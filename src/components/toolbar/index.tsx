"use client";
import { invoke } from "@tauri-apps/api/core";

const Toolbar = () => {
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
    <div className="bg-content1 h-10 w-screen">
      <button onClick={handleClick}>Click me</button>
    </div>
  );
};

export default Toolbar;
