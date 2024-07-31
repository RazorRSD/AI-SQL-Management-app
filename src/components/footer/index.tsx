"use client";
import { AiContext } from "#/providers/aiContext";
import { DataContext } from "#/providers/dataContext";
import { Button, Chip, Divider } from "@nextui-org/react";
import { useContext } from "react";
import { FcApproval } from "react-icons/fc";
import { FcCancel } from "react-icons/fc";

const Footer = () => {
  const { connection, onOpen } = useContext(DataContext);
  const { model, onOpenAiWizard, isModelReady } = useContext(AiContext);
  return (
    <div className="fixed left-0 bottom-0 flex w-screen justify-between bg-content1 text-[10px] font-medium text-white">
      <div className="h-10 bg-content1 flex items-center gap-2 text-content1-foreground/60">
        {connection.isConnected ? (
          <Button
            className="text-[10px] flex items-center gap-2"
            variant="light"
            color="success"
            startContent={<FcApproval size={12} />}
          >
            Connected
          </Button>
        ) : (
          <Button
            onClick={onOpen}
            className="text-[10px] flex items-center gap-2"
            variant="light"
            color="danger"
            startContent={<FcCancel size={12} />}
          >
            Disconnected
          </Button>
        )}
        <div>host: {connection.host || "N/A"}</div>
        <Divider orientation="vertical" />
        <div>port: {connection.port || "N/A"}</div>
        <Divider orientation="vertical" />
        <div>user: {connection.user || "N/A"}</div>
        <Divider orientation="vertical" />
      </div>
      <div className="h-10 pr-4 bg-content1 flex items-center gap-2 text-content2-foreground/60">
        <Divider orientation="vertical" />
        <Button
          onClick={onOpenAiWizard}
          variant="light"
          className="text-[10px]"
          color={isModelReady ? "success" : "warning"}
        >
          Model: {model || "Not loaded"}
        </Button>
      </div>
    </div>
  );
};

export default Footer;
