"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import * as monaco from "monaco-editor";
import Editor, { loader } from "@monaco-editor/react";
import { Button } from "@nextui-org/react";

import {
  sqlKeywords,
  sqlFunctions,
  sqlOperators,
  tokenizerConfig,
  themeConfig,
  languageConfig,
} from "./config";
import { DataContext } from "#/providers/dataContext";
import { AiContext } from "#/providers/aiContext";

interface ITableData {
  tableName: string;
  columns: {
    columnName: string;
    type: string;
  }[];
}

const newTable = {
  tableName: "products",
  columns: [
    { columnName: "id", type: "integer" },
    { columnName: "name", type: "varchar" },
    { columnName: "price", type: "decimal" },
  ],
};

const SQLEditor = () => {
  loader.config({ monaco });
  const [tableData, setTableData] = useState<ITableData[]>([newTable]);

  const { executeQueery } = useContext(DataContext);
  const { Generate } = useContext(AiContext);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const completionProviderRef = useRef<monaco.IDisposable | null>(null);

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

  const createCompletionItemProvider = useCallback(
    (tableData: ITableData[]) => ({
      provideCompletionItems: (
        model: monaco.editor.ITextModel,
        position: monaco.Position,
        context: monaco.languages.CompletionContext,
        token: monaco.CancellationToken
      ) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: monaco.languages.CompletionItem[] = [
          ...sqlKeywords.map((keyword) => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range,
          })),
          ...sqlFunctions.map((func) => ({
            label: func,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: func,
            range: range,
          })),
          ...tableData.map((table: { tableName: any }) => ({
            label: table.tableName,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: table.tableName,
            range: range,
            detail: "Table",
          })),
        ];

        const tableNameMatch = textUntilPosition.match(/(\w+)\.\s*$/);
        if (tableNameMatch) {
          const tableName = tableNameMatch[1];
          const table = tableData.find(
            (t: any) => t.tableName.toLowerCase() === tableName.toLowerCase()
          );
          if (table) {
            suggestions.push(
              ...table.columns.map((column: any) => ({
                label: column.columnName,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: column.columnName,
                range: range,
                detail: `Column (${column.type})`,
              }))
            );
          }
        }

        return { suggestions };
      },
      triggerCharacters: [".", " "],
    }),
    []
  );

  const updateTableData = useCallback(
    (newTableData: ITableData[]) => {
      setTableData(newTableData);
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          // Dispose of the old provider
          if (completionProviderRef.current) {
            completionProviderRef.current.dispose();
          }
          // Register the new provider
          completionProviderRef.current =
            monaco.languages.registerCompletionItemProvider(
              "sql",
              createCompletionItemProvider(newTableData)
            );
        }
      }
    },
    [createCompletionItemProvider]
  );

  const addNewTable = useCallback(
    (newTables: ITableData[]) => {
      updateTableData([...tableData, ...newTables]);
    },
    [tableData, updateTableData]
  );

  const removeTable = useCallback(
    (tableNameToRemove: string) => {
      const updatedTableData = tableData.filter(
        (table) => table.tableName !== tableNameToRemove
      );
      updateTableData(updatedTableData);
    },
    [tableData, updateTableData]
  );

  //   useEffect(() => {
  //     return () => {
  //       // Cleanup on component unmount
  //       if (completionProviderRef.current) {
  //         completionProviderRef.current.dispose();
  //       }
  //     };
  //   }, []);

  return (
    <div className="w-full h-full">
      <Editor
        theme="sqlTheme"
        defaultLanguage="sql"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          cursorStyle: "line",
          automaticLayout: true,
        }}
        defaultValue="SELECT * FROM testdata"
        beforeMount={(monaco) => {
          monaco.languages.register({ id: "sql" });
          monaco.languages.setMonarchTokensProvider("sql", tokenizerConfig);
          monaco.editor.defineTheme("sqlTheme", themeConfig);
          monaco.languages.setLanguageConfiguration("sql", languageConfig);
        }}
        onMount={(editor) => {
          editorRef.current = editor;
          completionProviderRef.current =
            monaco.languages.registerCompletionItemProvider(
              "sql",
              createCompletionItemProvider(tableData)
            );
          editor.addAction({
            id: "execute-query",
            label: "Execute Query",
            contextMenuGroupId: "execute",
            contextMenuOrder: 1.5,
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM],
            run: function (ed) {
              executeQueery(
                getSelectedText() || editorRef.current?.getValue() || ""
              );
              // Perform your custom action here
            },
          });
          editor.addAction({
            id: "execute-ai-query",
            label: "Execute Query with AI",
            contextMenuGroupId: "execute",
            contextMenuOrder: 1.5,
            keybindings: [
              monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyA,
            ],
            run: function (ed) {
              Generate(
                getSelectedText() || editorRef.current?.getValue() || ""
              );
              // Perform your custom action here
            },
          });
        }}
      />
    </div>

    // <Button onClick={() => setHeight(height + 100)}>Increase Height</Button>
    // <Button onClick={getSelectedText} />
    // <Button onClick={() => addNewTable([newTable])}>Add New Table</Button>
    // {tableData.map((table) => (
    //   <Button
    //     key={table.tableName}
    //     onClick={() => removeTable(table.tableName)}
    //   >
    //     Remove {table.tableName}
    //   </Button>
    // ))}
  );
};

export default SQLEditor;
