"use client";
import { start_python_script } from "#/api/ai";
import { EditorContext } from "#/providers/editorContext";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";
import { invoke } from "@tauri-apps/api/core";
import { PlaneTakeoff, Play } from "lucide-react";
import { useContext, useState } from "react";

const AboutApp = {
  title: "About Application",
  content: "AI-Powered Natural Language SQL Management tool",
  version: "Version 0.1.0",
  description:
    "The project aims to develop an AI-powered interface that allows users to interact with SQL databases using natural language. The system will translate plain English queries into SQL commands, execute them, and display the results in an accessible format. Key components include a Natural Language Processing (NLP) module, a SQL query generator, a database interface, and a user interface. The NLP module will interpret user queries, recognise intents, and identify database entities. The SQL query generator will convert these interpreted queries into valid SQL commands, handling various operations and conditions. The database interface will execute these SQL queries against the target database. The user interface will provide an intuitive platform for users to input questions and view results.",
  devaloper: "Developed by: P R S D Bandara - S23014559",
};

const AboutDeveloper = {
  title: "About Developer",
  name: "P R S D Bandara",
  studentId: "S23014559",
  email: "sahan.d.anr@gmail.com",
  github: "https://github.com/RazorRSD",
};

const Toolbar = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isAboutApp, setIsAboutApp] = useState(true);
  const { aiExecute, execute, editorRef } = useContext(EditorContext);
  const handleClick = () => {
    console.log("Clicked");
  };

  async function stop_python_script() {
    try {
      const result = await invoke("stop_python_script");
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  }

  async function delete_venv() {
    try {
      const result = await invoke("delete_venv");
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  }

  async function update_venv_requirements() {
    try {
      const result = await invoke("update_venv_requirements");
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="bg-content1 w-screen">
      <>
        <Modal
          backdrop="opaque"
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          radius="lg"
          classNames={{
            body: "py-6",
            backdrop: "bg-[#292f46]/50 backdrop-opacity-40",
            base: "border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]",
            header: "border-b-[1px] border-[#292f46]",
            footer: "border-t-[1px] border-[#292f46]",
            closeButton: "hover:bg-white/5 active:bg-white/10",
          }}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {isAboutApp ? AboutApp.title : AboutDeveloper.title}
                </ModalHeader>
                <ModalBody>
                  <div className="flex flex-col gap-2">
                    <p>
                      {isAboutApp ? (
                        <div className="text-xl font-semibold">
                          {AboutApp.content}
                        </div>
                      ) : (
                        AboutDeveloper.name
                      )}
                    </p>
                    <p>
                      {isAboutApp ? AboutApp.version : AboutDeveloper.studentId}
                    </p>
                    <p>
                      {isAboutApp ? AboutApp.description : AboutDeveloper.email}
                    </p>
                    <p>{isAboutApp ? "" : AboutDeveloper.github}</p>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button
                    className="bg-[#6f4ef2] shadow-lg shadow-indigo-500/20"
                    onPress={onClose}
                  >
                    Ok
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
      <Dropdown backdrop="transparent">
        <DropdownTrigger>
          <Button variant="light" size="sm">
            File
          </Button>
        </DropdownTrigger>
        <DropdownMenu variant="faded" aria-label="Static Actions">
          <DropdownItem key="save">Save File</DropdownItem>
          <DropdownItem key="open">Open File</DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <Dropdown backdrop="transparent">
        <DropdownTrigger>
          <Button variant="light" size="sm">
            Project
          </Button>
        </DropdownTrigger>
        <DropdownMenu variant="faded" aria-label="Static Actions">
          <DropdownItem key="exe" onClick={execute}>
            Execute
          </DropdownItem>
          <DropdownItem key="exeai" onClick={aiExecute}>
            Execute with AI
          </DropdownItem>
          <DropdownItem
            key="clear"
            onClick={() => {
              editorRef.current?.setValue("");
            }}
          >
            Clear
          </DropdownItem>
          <DropdownItem
            key="astop"
            className="text-danger"
            color="danger"
            onClick={stop_python_script}
          >
            Stop API
          </DropdownItem>
          <DropdownItem
            key="astop"
            className="text-danger"
            color="danger"
            onClick={start_python_script}
          >
            Start API
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <Dropdown backdrop="transparent">
        <DropdownTrigger>
          <Button variant="light" size="sm">
            About
          </Button>
        </DropdownTrigger>
        <DropdownMenu variant="faded" aria-label="Static Actions">
          <DropdownItem
            key="app"
            onClick={() => {
              setIsAboutApp(true);
              onOpen();
            }}
          >
            About Application
          </DropdownItem>
          <DropdownItem
            key="dev"
            onClick={() => {
              setIsAboutApp(false);
              onOpen();
            }}
          >
            About Dev
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <Button size="sm" variant="light" color="success" onClick={execute}>
        <Play size={16} />
      </Button>
      <Button size="sm" variant="light" color="primary" onClick={aiExecute}>
        <PlaneTakeoff size={16} />
      </Button>
    </div>
  );
};

export default Toolbar;
