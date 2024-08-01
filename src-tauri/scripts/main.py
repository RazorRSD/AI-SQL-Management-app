import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict
from huggingface_hub import hf_hub_download, list_repo_files
from ctransformers import AutoModelForCausalLM
import uvicorn
from sys import argv
import json

global reload_state
if "dev" not in argv:
    import ensure_exit  # type: ignore

    reload_state = False
else:
    reload_state = True

# Set up logging
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SQLRequest(BaseModel):
    prompt: str

class ModelRequest(BaseModel):
    model_name: str
    model_config = ConfigDict(protected_namespaces=())

class TokenRepoRequest(BaseModel):
    token: str
    repo: str

class SchemaRequest(BaseModel):
    schema: dict

# Global variables
current_model = None
hf_token = None
repo_id = None
table_schemas = {}

# Improved GPU detection
gpu_available = False
try:
    import torch
    if torch.cuda.is_available():
        gpu_available = True
        logging.debug(f"CUDA is available. GPU: {torch.cuda.get_device_name(0)}")
    else:
        logging.debug("CUDA is available, but no GPU detected.")
except ImportError:
    logging.debug("PyTorch not installed, defaulting to CPU")

def get_token_and_repo():
    if hf_token is None or repo_id is None:
        raise HTTPException(status_code=400, detail="Hugging Face token or repo not set")
    return hf_token, repo_id

def generate_response(prompt):
    if current_model is None:
        raise HTTPException(status_code=400, detail="No model loaded")
    
    logging.debug(f"Generating response for prompt: {prompt}")
    schema_info = json.dumps(table_schemas, indent=2)
    full_prompt = f"""
    Table Schemas:
    {schema_info}

    Task: {prompt}

    SQL:
    """
    response = current_model(full_prompt, max_new_tokens=1000, temperature=0.7, stop=["Human:", "Task:"])
    logging.debug(f"Generated SQL:\n{response}")
    return response.strip()

@app.post("/set_token_and_repo")
async def set_token_and_repo(request: TokenRepoRequest):
    global hf_token, repo_id
    hf_token = request.token
    repo_id = request.repo
    return {"message": f"Token and repo set. Repo: {repo_id}"}

@app.post("/set_schema")
async def set_schema(request: SchemaRequest):
    global table_schemas
    table_schemas = request.schema
    return {"message": "Schema set successfully"}

@app.post("/generate_sql")
async def generate_sql(request: SQLRequest):
    try:
        sql = generate_response(request.prompt)
        return sql
    except Exception as e:
        logging.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/list_models")
async def list_models():
    token, repo = get_token_and_repo()
    try:
        files = list_repo_files(repo, token=token)
        models = [file for file in files if file.endswith('.gguf')]
        return {"models": models}
    except Exception as e:
        logging.error(f"Error listing models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/load_model")
async def load_model_endpoint(request: ModelRequest):
    token, repo = get_token_and_repo()
    global current_model
    try:
        local_path = hf_hub_download(
                repo_id=repo,
                token=token,
                filename=request.model_name,
                local_files_only=False,
                resume_download=True,
                force_download=False,
                legacy_cache_layout=False,
        )
        if gpu_available:
            current_model = AutoModelForCausalLM.from_pretrained(local_path, model_type="llama", gpu_layers=50)
            return {"message": "Model loaded with GPU support"}
        else:
            current_model = AutoModelForCausalLM.from_pretrained(local_path, model_type="llama")
            return {"message": "Model loaded on CPU"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/unload_model")
async def unload_model():
    global current_model
    if current_model is not None:
        current_model = None
        return {"message": "Model unloaded successfully"}
    else:
        return {"message": "No model currently loaded"}

@app.post("/ping")
async def ping():
    return {"message": "Pong"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=reload_state)

logging.debug("FastAPI SQLCoder service is ready.")