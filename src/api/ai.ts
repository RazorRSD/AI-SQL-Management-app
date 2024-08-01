import { invoke } from "@tauri-apps/api/core";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const setHfTokenAndRepo = async (token: string, repo: string) => {
  try {
    const response = await fetch("http://localhost:8000/set_token_and_repo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, repo }),
    });
    return response;
  } catch (error) {
    console.log("Error setting token");
  }
};

const ping = async () => {
  try {
    const response = await fetch("http://localhost:8000/ping", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "ping",
    });
    return response;
  } catch (error) {
    throw error;
  }
};

const pingApi = async () => {
  for (let i = 0; i < 5; i++) {
    try {
      const response = await ping();
      if (response.ok) {
        return response;
      }
    } catch (error) {}
    await delay(1000);
  }
};

async function checkPythonSetup() {
  try {
    const result = await invoke("check_python_installation");
    return { status: true, result };
  } catch (error) {
    return { status: false, error };
  }
}

async function installPython() {
  try {
    const result = await invoke("install_python");
    return result;
  } catch (error) {
    throw error;
  }
}

async function isVirtualEnvExisted() {
  try {
    const result = await invoke("manage_venv");
    return { status: true, result };
  } catch (error) {
    return { status: false, error };
  }
}

async function activateVirtualEnv() {
  try {
    const result = await invoke("activate_venv");
    return { status: true, result };
  } catch (error) {
    return { status: false, error };
  }
}

async function start_python_script() {
  try {
    const result = await invoke("start_python_script");
    return { status: true, result };
  } catch (error) {
    return { status: false, error };
  }
}

async function generateSQL(prompt: string) {
  try {
    const response = await fetch("http://localhost:8000/generate_sql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const dataRaw = await response.json();
    const data = dataRaw.split("```")[0];
    return data;
  } catch (error) {
    console.error("Error generating SQL:", error);
    throw error;
  }
}

async function setSchema(schema: Object) {
  console.log("Setting schema", schema);
  try {
    const response = await fetch("http://localhost:8000/set_schema", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(schema),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error generating SQL:", error);
    throw error;
  }
}

export {
  pingApi,
  setHfTokenAndRepo,
  checkPythonSetup,
  installPython,
  isVirtualEnvExisted,
  activateVirtualEnv,
  start_python_script,
  generateSQL,
  setSchema,
};
