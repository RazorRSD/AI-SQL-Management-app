"use client";
import React, { useState } from "react";
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

interface TreeNodeProps {
  label: string;
  type: NodeType;
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

const TreeNode: React.FC<TreeNodeProps> = ({ label, type, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = children && children.length > 0;

  return (
    <div className="relative">
      <div
        className={`flex items-center cursor-pointer py-1 transition-all duration-200 ease-in-out 
                    ${isOpen ? "opacity-100" : "opacity-80"} hover:opacity-100`}
        onClick={() => setIsOpen(!isOpen)}
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
            <TreeNode key={index} {...child} />
          ))}
        </div>
      )}
    </div>
  );
};

interface TreeViewProps {
  data: TreeNodeProps[];
}

const TreeView: React.FC<TreeViewProps> = ({ data }) => {
  return (
    <div className="">
      {data.map((node, index) => (
        <TreeNode key={index} {...node} />
      ))}
    </div>
  );
};

export default TreeView;
