"use client";
import { useContext, useEffect, useState } from "react";
import SQLEditor from "../codeEditor";
import ResizableLayout from "../containers/resizable";
import TreeView from "../treeView";
import { DataContext } from "#/providers/dataContext";

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

const MainWin = () => {
  const { databases } = useContext(DataContext);

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
            <TreeView data={dataStructure} />
          </div>
        }
        upperContent={<SQLEditor />}
        lowerContent={<div className="text-xs">output window</div>}
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
