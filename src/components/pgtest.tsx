"use client";
import { Button, Input, Listbox, ListboxItem } from "@nextui-org/react";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

const PgTest = () => {
  const [databases, setDataBases] = useState<string[]>([]);
  const [selectedDB, setSelecetedDB] = useState("");
  const connectiontodb = async () => {
    const res = await invoke("connect_to_postgres", {
      connectionString: { value: "postgres://postgres:admin@localhost:5432" },
    });
    console.log(res);
  };

  const getAllDbs = async () => {
    const res: any = await invoke("pg_show_databases");
    setDataBases(res);
  };

  const selectDatabase = async (selecteddb: string) => {
    setSelecetedDB(selecteddb);
    const res = await invoke("pg_select_database", {
      databasename: { name: selecteddb },
    });
    console.log(res);
  };

  const executeQ = async () => {};

  const executeTableType = async () => {};

  return (
    <div className="flex justify-center items-center gap-10">
      <div className="flex flex-col justify-center gap-4">
        <Button onClick={connectiontodb} color="primary">
          Connect to DB
        </Button>
        <Button onClick={getAllDbs} color="primary">
          Get All DBs
        </Button>
        <Button onClick={executeQ} color="primary">
          EXE Select
        </Button>
        <Button onClick={executeTableType} color="primary">
          EXE Table
        </Button>
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

export default PgTest;
