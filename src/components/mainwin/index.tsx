"use client";
import { useContext, useEffect, useState } from "react";
import SQLEditor from "../codeEditor";
import ResizableLayout from "../containers/resizable";
import TreeView from "../treeView";
import { DataContext } from "#/providers/dataContext";
import { Button } from "@nextui-org/react";
import OutPutWindow from "../output";

type NodeType =
  | "database"
  | "table"
  | "view"
  | "stored_procedure"
  | "function"
  | "column"
  | "folder";

interface TreeNodeProps {
  label: string;
  type: NodeType;
  children?: TreeNodeProps[];
}

const treeData: TreeNodeProps[] = [
  {
    label: "MyDatabase",
    type: "database",
    children: [
      {
        label: "Tables",
        type: "table",
        children: [
          { label: "Users", type: "table" },
          { label: "Orders", type: "table" },
        ],
      },
      {
        label: "Views",
        type: "view",
        children: [{ label: "ActiveUsers", type: "view" }],
      },
      {
        label: "Stored Procedures",
        type: "stored_procedure",
        children: [{ label: "CreateOrder", type: "stored_procedure" }],
      },
      {
        label: "Functions",
        type: "function",
        children: [{ label: "CalculateTotal", type: "function" }],
      },
    ],
  },
  {
    label: "Test db",
    type: "database",
  },
];

const Dbprepare = (databases: string[]) => {
  const dataStructure: TreeNodeProps[] = [];
  databases.forEach((db) => {
    dataStructure.push({
      label: db,
      type: "database",
    });
  });
  return dataStructure;
};

const prepareDBContent = (
  dataStructure: TreeNodeProps[],
  selectedDatabase: string,
  dbContent: { [key: string]: string[] }
) => {
  console.log("dbContent", dbContent);
  const dataStructureCopy = [...dataStructure];
  const index = dataStructureCopy.findIndex(
    (x) => x.label === selectedDatabase
  );
  dataStructureCopy[index].children = [];
  const tables = dbContent["tables"];
  const views = dbContent["views"];
  const storedProcedures = dbContent["procedures"];
  const functions = dbContent["functions"];

  if (tables) {
    dataStructureCopy[index].children.push({
      label: "Tables",
      type: "folder",
      children: tables.map((x) => ({ label: x, type: "table" })),
    });
  }

  if (views) {
    dataStructureCopy[index].children.push({
      label: "Views",
      type: "folder",
      children: views.map((x) => ({ label: x, type: "view" })),
    });
  }

  if (storedProcedures) {
    dataStructureCopy[index].children.push({
      label: "Stored Procedures",
      type: "folder",
      children: storedProcedures.map((x) => ({
        label: x,
        type: "stored_procedure",
      })),
    });
  }

  if (functions) {
    dataStructureCopy[index].children.push({
      label: "Functions",
      type: "folder",
      children: functions.map((x) => ({ label: x, type: "function" })),
    });
  }
  return dataStructureCopy;
};

const MainWin = () => {
  const { databases, SelectDatabase, queryError, recentResults } =
    useContext(DataContext);

  const [dataStructure, setDataStructure] = useState<TreeNodeProps[]>(
    Dbprepare(databases) || []
  );

  useEffect(() => {
    setDataStructure(Dbprepare(databases));
  }, [databases]);

  if (!window) return null;
  return (
    <div className="w-screen">
      <ResizableLayout
        sidebarContent={
          <div>
            <TreeView
              data={dataStructure}
              selectDB={async (dbName) =>
                setDataStructure(
                  prepareDBContent(
                    dataStructure,
                    dbName,
                    await SelectDatabase(dbName)
                  )
                )
              }
            />
          </div>
        }
        upperContent={<SQLEditor />}
        lowerContent={
          <OutPutWindow
            text={recentResults.replace("\n", "|") || "output\n window"}
            error={queryError}
          />
        }
        initialSidebarWidth={200}
        initialUpperHeight={window.innerHeight - 300}
        minSidebarWidth={100}
        maxSidebarWidth={300}
        minUpperHeight={300}
        maxUpperHeight={window.innerHeight - 180}
      />
    </div>
  );
};

export default MainWin;
