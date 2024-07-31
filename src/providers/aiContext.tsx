"use client";
import {
  activateVirtualEnv,
  checkPythonSetup,
  generateSQL,
  installPython,
  isVirtualEnvExisted,
  pingApi,
  setHfTokenAndRepo,
  start_python_script,
} from "#/api/ai";
import {
  Autocomplete,
  AutocompleteItem,
  Avatar,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Select,
  SelectedItems,
  SelectItem,
  Spinner,
  Tooltip,
  useDisclosure,
} from "@nextui-org/react";
import { createContext, ReactNode, useEffect, useState } from "react";

interface IAiContext {
  model: string;
  isModelReady: boolean;
  onOpenAiWizard: () => void;
  Generate: (text: string) => Promise<any>;
}

const AiContext = createContext<IAiContext>({
  model: "",
  isModelReady: false,
  onOpenAiWizard: () => {},
  Generate: async () => {},
});

type ModelMap = {
  name: string;
  model: string;
  description: string;
};

const modelMap: ModelMap[] = [
  {
    name: "2-bit quntized Model",
    model: "sqlman-finetuned.Q2_K.gguf",
    description: "Smallest model, Lowest qulity model with 2-bit quantization",
  },
  {
    name: "3-bit quntized Model - 01",
    model: "sqlman-finetuned.Q3_K_S.gguf",
    description:
      "very small size, very Low quality model with 3-bit quantization",
  },
  {
    name: "3-bit quntized Model - 02",
    model: "sqlman-finetuned.Q3_K_M.gguf",
    description:
      "very small size, very Low quality model with 3-bit quantization ",
  },
  {
    name: "3-bit quntized Model - 03",
    model: "sqlman-finetuned.Q3_K_L.gguf",
    description: "Small size, Low quality model with 3-bit quantization",
  },
  {
    name: "4-bit quntized Model - 01",
    model: "sqlman-finetuned.Q4_K_S.gguf",
    description: "Small size, Low quality model with 4-bit quantization",
  },
  {
    name: "4-bit quntized Model - 02",
    model: "sqlman-finetuned.Q4_0.gguf",
    description: "Not Recommended",
  },
  {
    name: "4-bit quntized Model - 03",
    model: "sqlman-finetuned.Q4_K_M.gguf",
    description: "Medium size, Medium quality model with 4-bit quantization",
  },
  {
    name: "5-bit quntized Model - 02",
    model: "sqlman-finetuned.Q5_0.gguf",
    description:
      "Medium size, Medium quality model with 5-bit quantization - not recommended",
  },
  {
    name: "5-bit quntized Model - 01",
    model: "sqlman-finetuned.Q5_K_S.gguf",
    description: "Normal size, Normal quality model with 5-bit quantization",
  },
  {
    name: "5-bit quntized Model - 03",
    model: "sqlman-finetuned.Q5_K_M.gguf",
    description: "Normal size, Normal quality model with 5-bit quantization",
  },
  {
    name: "6-bit quntized Model",
    model: "sqlman-finetuned.Q6_K.gguf",
    description:
      "Large size, High quality model with 6-bit quantization - GPU required",
  },
  {
    name: "8-bit quntized Model",
    model: "sqlman-finetuned.Q8_0.gguf",
    description:
      "Very large size, Very high quality model with 8-bit quantization - GPU required",
  },
];

const AIProvider = ({ children }: { children: ReactNode }) => {
  const [model, setModel] = useState<string>("");

  const [systemReady, setSystemReady] = useState<boolean>(false);

  const [loadingMessage, setLoadingMessage] = useState<string>("");

  const [modelLoading, setModelLoading] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [listOfModels, setListOfModels] = useState<ModelMap[]>([]);
  const [selectedModel, setSelectedModel] = useState<any>();

  const loadAI = async () => {
    //check if pyhthon is installed
    setLoadingMessage("Checking Python installation...");
    const result = await checkPythonSetup();
    if (!result.status) {
      setError("Could not find python installation");
      if (
        result.error ===
        "Python 3.10 is not installed. Would you like to install it?"
      ) {
        if (confirm(result.error)) {
          const res = await installPython();
          if (res) {
            setSystemReady(true);
          } else {
            setError("Error installing python");
            return;
          }
        }
      } else {
        setError(error);
        return;
      }
    }
    setLoadingMessage("Python check successful");
    setLoadingMessage("Checking for virtual environment...");
    const venv = await isVirtualEnvExisted();
    if (!venv.status) {
      setError("Error checking virtual environment");
      return;
    }
    setLoadingMessage("Activating virtual environment...");
    const activate = await activateVirtualEnv();
    if (!activate.status) {
      setError("Error activating virtual environment");
      return;
    }
    setLoadingMessage("Loading python api...");
    const start = await start_python_script();
    if (!start.status) {
      setError("Error starting python script");
      return;
    }

    const ping = await pingApi();
    if (!ping?.ok) {
      setError("Error pinging server");
      return;
    }

    setLoadingMessage("Python script started");

    const token = await setHfTokenAndRepo(
      "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",
      "RazorRSD/SQLManModels"
    );
    if (!token?.status) {
      setError("Error setting token and repo");
      return;
    }
    setLoadingMessage("Loading models...");
    fetchModels();

    setSystemReady(true);
    //check for VENV
    //start python server
  };

  const fetchModels = async () => {
    try {
      const response = await fetch("http://localhost:8000/list_models");
      const data = await response.json();
      if (response.ok) {
        const modelsItems = modelMap
          .map((model) => (data.models.includes(model.model) ? model : null))
          .filter((model) => model !== null);
        setListOfModels(modelsItems);
        setLoadingMessage("Models fetched successfully");
      } else {
        setError(data.detail || "Error fetching models");
      }
    } catch (error) {
      setError("Error fetching models");
    }
  };

  const onOpenAiWizard = () => {
    onOpen();
  };

  const loadModel = async () => {
    setModelLoading(true);
    setLoadingMessage("Downloading Model...");

    const selectedModelStr = Array.from(selectedModel)[0];

    try {
      const response = await fetch("http://localhost:8000/load_model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model_name: selectedModelStr }),
      });
      const data = await response.json();
      if (response.ok) {
        setLoadingMessage("Model loaded successfully");
        setModelLoading(false);
        setModel(selectedModelStr as string);
        setIsModelReady(true);
      } else {
        setError(data.detail || "Error loading model");
        setModelLoading(false);
      }
    } catch (error: any) {
      setError("Error loading model: " + error.message);
      setModelLoading(false);
    }
  };

  const testFunction3 = async () => {
    loadModel();
  };

  const Generate = async (text: string) => {
    const response = await generateSQL(text);
    return response;
  };

  useEffect(() => {
    if (!systemReady) {
      loadAI();
      onOpen();
    }
  }, [onOpen, systemReady]);

  return (
    <AiContext.Provider
      value={{
        model,
        isModelReady,
        onOpenAiWizard,
        Generate,
      }}
    >
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        isDismissable={false}
        isKeyboardDismissDisabled={false}
        hideCloseButton={true}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                System Setting up
              </ModalHeader>
              <ModalBody>
                {systemReady ? (
                  <div className="flex flex-col gap-4 w-full">
                    <Select
                      isDisabled={modelLoading}
                      isLoading={modelLoading}
                      items={listOfModels}
                      label="Choose a model to start"
                      description="Please be sure to select a model that is compatible with your system"
                      placeholder="Select a model"
                      labelPlacement="outside"
                      classNames={{
                        base: "w-full",
                        trigger: "h-12",
                      }}
                      renderValue={(items: SelectedItems<ModelMap>) => {
                        return items.map((item) => (
                          <div
                            key={item.key}
                            className="flex items-center gap-2"
                          >
                            <div className="flex flex-col">
                              <span>{item.data?.name}</span>
                              <span className="text-default-500 text-tiny">
                                ({item.data?.description})
                              </span>
                            </div>
                          </div>
                        ));
                      }}
                      onSelectionChange={setSelectedModel}
                    >
                      {(model) => (
                        <SelectItem key={model.model} textValue={model.name}>
                          <Tooltip
                            content={model.description}
                            showArrow
                            placement="right"
                          >
                            <div className="flex gap-2 items-center">
                              <div className="flex flex-col">
                                <span className="text-small">{model.name}</span>
                                <span className="text-tiny text-default-400">
                                  {model.description}
                                </span>
                              </div>
                            </div>
                          </Tooltip>
                        </SelectItem>
                      )}
                    </Select>
                    <Button
                      color={isModelReady ? "success" : "primary"}
                      variant="flat"
                      className="w-full mt-4"
                      isDisabled={!selectedModel || modelLoading}
                      isLoading={modelLoading}
                      onClick={testFunction3}
                    >
                      {isModelReady
                        ? "Load model again"
                        : "Load Selected Model"}
                    </Button>
                    <div>{modelLoading && loadingMessage}</div>
                  </div>
                ) : (
                  <div className="h-64 w-full flex flex-col justify-center items-center">
                    <Spinner label={loadingMessage} />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {children}
    </AiContext.Provider>
  );
};

export { AiContext, AIProvider };
