"use client";
import { Button, Input, Listbox, ListboxItem } from "@nextui-org/react";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

const TestComp = () => {
  const [databases, setDataBases] = useState<string[]>([]);
  const [selectedDB, setSelecetedDB] = useState("");
  const connectiontodb = async () => {
    const res = await invoke("connect_to_mysql", {
      connectionString: { value: "mysql://root:admin@127.0.0.1:3306" },
    });
    console.log(res);
  };

  const getAllDbs = async () => {
    const databases: any = await invoke("show_databases");
    setDataBases(databases);
  };

  const selectDatabase = async (selecteddb: string) => {
    setSelecetedDB(selecteddb);
    const tables = await invoke("select_database", {
      dbName: { name: selecteddb },
    });
    console.log(tables);
  };

  const executeQ = async () => {
    const result = await invoke("execute_query", {
      query: "select * from users",
    });
    console.log(result);
  };

  const executeTableType = async () => {
    const query = `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE 
               FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = '${selectedDB}' AND TABLE_NAME = 'users' 
               ORDER BY ORDINAL_POSITION`;

    const res = await invoke("execute_query", { query: query });
    console.log(res);
  };

  return (
    <div className="flex justify-center items-center gap-10">
      <div className="flex flex-col justify-center gap-4">
        <Button onClick={connectiontodb}>Connect to DB</Button>
        <Button onClick={getAllDbs}>Get All DBs</Button>
        <Button onClick={executeQ}>EXE Select</Button>
        <Button onClick={executeTableType}>EXE Table</Button>
      </div>

      <div>
        <div className="w-full max-w-[260px] border-small px-1 py-2 rounded-small border-default-200 dark:border-default-100">
          <Listbox
            aria-label="Actions"
            onAction={(key) => selectDatabase(key as string)}
          >
            {databases.map((x, i) => (
              <ListboxItem key={x}>{x}</ListboxItem>
            ))}
          </Listbox>
        </div>
      </div>
    </div>
  );
};

export default TestComp;
