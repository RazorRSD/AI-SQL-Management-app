"use client";
import { ReactNode, useContext, useRef, MutableRefObject } from "react";
import { createContext } from "react";
import * as monaco from "monaco-editor";
import { DataContext } from "./dataContext";
import { AiContext } from "./aiContext";

interface EditorContextType {
  editorRef: MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
  getSelectedText: () => string | undefined;
  execute: () => void;
  aiExecute: () => void;
}

const EditorContext = createContext<EditorContextType>({
  editorRef: { current: null },
  getSelectedText: () => undefined,
  execute: () => {},
  aiExecute: () => {},
});

const EditorProvider = ({ children }: { children: ReactNode }) => {
  const { executeQueery } = useContext(DataContext);
  const { Generate } = useContext(AiContext);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const getSelectedText = () => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const model = editorRef.current.getModel();
      if (selection && model) {
        const selectedText = model.getValueInRange(selection);
        return selectedText;
      }
    }
  };

  const aiExecute = async () => {
    const res = await Generate(
      getSelectedText() || editorRef.current?.getValue() || ""
    );
    editorRef.current?.setValue(editorRef.current?.getValue() + "\n\n" + res);
  };

  const execute = async () => {
    executeQueery(getSelectedText() || editorRef.current?.getValue() || "");
  };
  return (
    <EditorContext.Provider
      value={{
        editorRef,
        getSelectedText,
        execute,
        aiExecute,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export { EditorProvider, EditorContext };
