"use client";
import React, { FC, useState } from "react";
import {
  FcCommandLine,
  FcDatabase,
  FcDataSheet,
  FcGrid,
  FcOpenedFolder,
  FcViewDetails,
  FcWorkflow,
} from "react-icons/fc";

type NodeType =
  | "database"
  | "table"
  | "view"
  | "stored_procedure"
  | "function"
  | "column"
  | "folder";

interface TreeNodePropsItems {
  label: string;
  type: NodeType;
  selectDB: (database: string) => void;
  children?: TreeNodeProps[];
}

const getIconForType = (type: NodeType) => {
  switch (type) {
    case "database":
      return <FcDatabase size={16} />;
    case "table":
      return <FcDataSheet size={16} />;
    case "view":
      return <FcViewDetails size={16} />;
    case "stored_procedure":
      return <FcCommandLine size={16} />;
    case "function":
      return <FcWorkflow size={16} />;
    case "column":
      return <FcGrid size={16} />;
    case "folder":
    default:
      return <FcOpenedFolder size={16} />;
  }
};

const TreeNode: React.FC<TreeNodePropsItems> = ({
  label,
  type,
  children,
  selectDB,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = children && children.length > 0;

  return (
    <div className="relative">
      <div
        className={`flex items-center cursor-pointer py-1 transition-all duration-200 ease-in-out 
                    ${isOpen ? "opacity-100" : "opacity-80"} hover:opacity-100`}
        onClick={() => {
          if (type === "database" && !isOpen) selectDB(label);
          setIsOpen(!isOpen);
        }}
      >
        <span className="mr-2">{getIconForType(type)}</span>
        <span className="select-none text-xs">{label}</span>
      </div>
      {hasChildren && (
        <div
          className={`ml-4 pl-4 border-l border-gray-300 overflow-hidden transition-all duration-200 ease-in-out
                      ${
                        isOpen
                          ? "max-h-screen opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
        >
          {children.map((child, index) => (
            <TreeNode selectDB={selectDB} key={index} {...child} />
          ))}
        </div>
      )}
    </div>
  );
};

interface TreeNodeProps {
  label: string;
  type: NodeType;
  children?: TreeNodeProps[];
}

interface TreeViewProps {
  data: {
    label: string;
    type: NodeType;
    children?: TreeNodeProps[];
  }[];
  selectDB: (database: string) => void;
}

const TreeView: FC<TreeViewProps> = ({ data, selectDB }) => {
  return (
    <div className="">
      {data.map((node, index) => (
        <TreeNode selectDB={selectDB} key={index} {...node} />
      ))}
    </div>
  );
};

export default TreeView;
