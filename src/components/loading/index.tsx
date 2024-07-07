import { Progress } from "@nextui-org/react";

const Loading = () => {
  return (
    <div className="flex h-[70vh] w-screen items-center justify-center">
      <div className="w-96 text-center italic text-foreground/30">
        <div>Loading data...</div>
        <Progress
          size="sm"
          isIndeterminate
          aria-label="Loading..."
          classNames={{
            base: "max-w-md",
            track: "drop-shadow-md border border-default",
            indicator: "bg-gradient-to-r from-primary to-secondary",
            label: "tracking-wider font-medium text-default-600",
            value: "text-foreground/60",
          }}
        />
      </div>
    </div>
  );
};

export default Loading;
