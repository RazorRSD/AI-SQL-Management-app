"use client";
import { DataContext } from "#/providers/dataContext";
import { Chip, Divider } from "@nextui-org/react";
import { useContext } from "react";
import { FcApproval } from "react-icons/fc";
import { FcCancel } from "react-icons/fc";

const Footer = () => {
  const { connection, onOpen } = useContext(DataContext);
  return (
    <div className="fixed left-0 bottom-0">
      <div className="h-10 bg-content1 flex items-center gap-2 w-screen text-sm text-content1-foreground/60">
        {connection.isConnected ? (
          <Chip
            startContent={<FcApproval size={16} />}
            variant="faded"
            color="success"
            className="cursor-pointer"
          >
            Connected
          </Chip>
        ) : (
          <Chip
            startContent={<FcCancel size={16} />}
            variant="faded"
            color="danger"
            onClick={onOpen}
            className="cursor-pointer"
          >
            Disconnected
          </Chip>
        )}
        <Divider orientation="vertical" />
        <div>host: {connection.host || "N/A"}</div>
        <Divider orientation="vertical" />
        <div>port: {connection.port || "N/A"}</div>
        <Divider orientation="vertical" />
        <div>user: {connection.user || "N/A"}</div>
      </div>
    </div>
  );
};

export default Footer;
