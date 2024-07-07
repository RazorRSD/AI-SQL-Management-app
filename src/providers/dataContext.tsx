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

const DataContext = createContext<{
  connection: Connection;
  handleConnection: IhandleConnection;
  onOpen: () => void;
  databases: string[];
}>({
  connection: {
    dbType: "",
    host: "",
    port: null,
    user: "",
    isConnected: false,
  },
  handleConnection: async () => {
    return { status: "", message: "" };
  },
  onOpen: () => {},
  databases: [],
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

  return (
    <DataContext.Provider
      value={{ connection, handleConnection, onOpen, databases }}
    >
      <div> {children}</div>
      <ConnectionModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </DataContext.Provider>
  );
};

export { DataContext, DataProvider };
