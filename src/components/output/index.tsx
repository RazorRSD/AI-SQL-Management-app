"use client";
import DynamicTable from "./table";
import { useEffect, useState } from "react";

const OutPutWindow = ({ text, error }: { text: string; error: string }) => {
  const isText = (text: string) => {
    return !text.trim().includes("\t");
  };
  return (
    <div className="w-full h-full pt-5">
      <div className="text-xs italic">output:</div>
      {error ? (
        <div className="text-sm text-danger-400">{error}</div>
      ) : (
        <div className="w-full h-full text-foreground-500/70">
          {isText(text) ? text : <DynamicTable data={text} />}
        </div>
      )}
    </div>
  );
};

export default OutPutWindow;
