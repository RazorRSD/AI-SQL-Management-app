"use client";
import ConnectionModal from "#/components/modals/connectionModal";
import { useDisclosure } from "@nextui-org/react";
import { invoke } from "@tauri-apps/api/core";
import { createContext, ReactNode, useState } from "react";

interface Connection {
  dbType: string;
  host: string;
  port: number | null;
  user: string;
  isConnected: boolean;
}

type IhandleConnection = (
  dbType: string,
  host: string,
  port: number,
  user: string,
  password: string
) => Promise<{
  status: string;
  message: string;
}>;

interface DataContextProps {
  connection: Connection;
  handleConnection: IhandleConnection;
  onOpen: () => void;
  databases: string[];
  SelectDatabase: (database: string) => Promise<{
    [key: string]: string[];
  }>;
  executeQueery: (query: string) => Promise<void>;
  selectedDatabase: string;
  recentResults: string;
  queryError: string;
  executeQueerySlient: () => Promise<string>;
}

const DataContext = createContext<DataContextProps>({
  connection: {
    dbType: "",
    host: "",
    port: null,
    user: "",
    isConnected: false,
  },
  handleConnection: function (
    dbType: string,
    host: string,
    port: number,
    user: string,
    password: string
  ): Promise<{
    status: string;
    message: string;
  }> {
    throw new Error("Function not implemented.");
  },
  onOpen: function (): void {
    throw new Error("Function not implemented.");
  },
  databases: [],
  SelectDatabase: function (database: string): Promise<{
    [key: string]: string[];
  }> {
    throw new Error("Function not implemented.");
  },
  executeQueery: function (query: string): Promise<void> {
    throw new Error("Function not implemented.");
  },
  selectedDatabase: "",
  recentResults: "",
  queryError: "",
  executeQueerySlient: function (): Promise<string> {
    throw new Error("Function not implemented.");
  },
});

const DataProvider = ({ children }: { children: ReactNode }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [connection, setConnection] = useState<Connection>({
    dbType: "",
    host: "",
    port: null,
    user: "",
    isConnected: false,
  });
  const [databases, setDatabases] = useState<string[]>([]);

  const [selectedDatabase, setSelectedDatabase] = useState<string>("");

  const [recentResults, setRecentResults] = useState<string>("");

  const [queryError, setQueryError] = useState<string>("");

  const handleConnection: IhandleConnection = async (
    dbType,
    host,
    port,
    user,
    password
  ) => {
    if (dbType === "mysql") {
      try {
        const res = await invoke("connect_to_mysql", {
          connectionString: {
            value: `mysql://${user}:${password}@${host}:${port}`,
          },
        });
        setConnection({
          dbType,
          host,
          port,
          user,
          isConnected: true,
        });

        const databases: string[] = await invoke("show_databases");
        setDatabases(databases);

        return { status: "success", message: "Connected to MySQL" };
      } catch (e) {
        setConnection({
          dbType,
          host,
          port,
          user,
          isConnected: false,
        });
        return { status: "error", message: e as string };
      }
    } else {
      return { status: "error", message: "Invalid DB Type" };
    }
  };

  const SelectDatabase = async (database: string) => {
    console.log("Selecting database", database);
    localStorage.setItem("selectedDatabase", database);
    const dbContent = await invoke("select_database", {
      dbName: { name: database },
    });
    return dbContent as { [key: string]: string[] };
  };

  const executeQueery = async (query: string) => {
    setQueryError("");
    await invoke("execute_query", {
      query: query,
    })
      .then((r) => {
        setRecentResults(r as string);
        return r;
      })
      .catch((e) => {
        setQueryError(e as string);
        return e;
      });
  };

  const executeQueerySlient = async () => {
    const DataPromt = `SELECT 
    t.TABLE_NAME AS 'TableName',
    GROUP_CONCAT(c.COLUMN_NAME ORDER BY c.ORDINAL_POSITION SEPARATOR ', ') AS 'AllColumns'
FROM 
    information_schema.TABLES t
JOIN 
    information_schema.COLUMNS c 
    ON t.TABLE_SCHEMA = c.TABLE_SCHEMA 
    AND t.TABLE_NAME = c.TABLE_NAME
WHERE  
    t.TABLE_SCHEMA = 'laravel'
GROUP BY 
    t.TABLE_NAME
ORDER BY 
    t.TABLE_NAME;`;
    const res = await invoke("execute_query", {
      query: DataPromt.replace(
        "laravel",
        localStorage.getItem("selectedDatabase") || ""
      ),
    });
    return res as string;
  };

  return (
    <DataContext.Provider
      value={{
        connection,
        handleConnection,
        onOpen,
        databases,
        SelectDatabase,
        selectedDatabase,
        executeQueery,
        recentResults,
        queryError,
        executeQueerySlient,
      }}
    >
      <div>{children}</div>
      <ConnectionModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </DataContext.Provider>
  );
};

export { DataContext, DataProvider };
