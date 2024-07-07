"use client";
import React, { useState, useCallback, useEffect } from "react";
import Toolbar from "../toolbar";

interface ResizableLayoutProps {
  initialSidebarWidth?: number;
  initialUpperHeight?: number;
  minSidebarWidth?: number;
  maxSidebarWidth?: number;
  minUpperHeight?: number;
  maxUpperHeight?: number;
  sidebarContent: React.ReactNode;
  upperContent: React.ReactNode;
  lowerContent: React.ReactNode;
}

const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  initialSidebarWidth = 250,
  initialUpperHeight = 300,
  minSidebarWidth = 150,
  maxSidebarWidth = 500,
  minUpperHeight = 100,
  maxUpperHeight = 800,
  sidebarContent,
  upperContent,
  lowerContent,
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(initialSidebarWidth);
  const [upperHeight, setUpperHeight] = useState(initialUpperHeight);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingUpper, setIsResizingUpper] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const updateWindowSize = useCallback(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    window.addEventListener("resize", updateWindowSize);
    return () => window.removeEventListener("resize", updateWindowSize);
  }, [updateWindowSize]);

  useEffect(() => {
    const sidebarRatio = sidebarWidth / windowSize.width;
    const upperRatio = upperHeight / windowSize.height;

    setSidebarWidth(
      Math.max(
        minSidebarWidth,
        Math.min(maxSidebarWidth, windowSize.width * sidebarRatio)
      )
    );
    setUpperHeight(
      Math.max(
        minUpperHeight,
        Math.min(maxUpperHeight, windowSize.height * upperRatio)
      )
    );
  }, [
    windowSize,
    minSidebarWidth,
    maxSidebarWidth,
    minUpperHeight,
    maxUpperHeight,
    sidebarWidth,
    upperHeight,
  ]);

  const startResizeSidebar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  }, []);

  const startResizeUpper = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingUpper(true);
  }, []);

  const stopResize = useCallback(() => {
    setIsResizingSidebar(false);
    setIsResizingUpper(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizingSidebar) {
        const newWidth = Math.max(
          minSidebarWidth,
          Math.min(maxSidebarWidth, e.clientX)
        );
        setSidebarWidth(newWidth);
      } else if (isResizingUpper) {
        const newHeight = Math.max(
          minUpperHeight,
          Math.min(maxUpperHeight, e.clientY)
        );
        setUpperHeight(newHeight);
      }
    },
    [
      isResizingSidebar,
      isResizingUpper,
      minSidebarWidth,
      maxSidebarWidth,
      minUpperHeight,
      maxUpperHeight,
    ]
  );

  useEffect(() => {
    if (isResizingSidebar || isResizingUpper) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResize);
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResize);
    };
  }, [isResizingSidebar, isResizingUpper, resize, stopResize]);

  return (
    <div
      className="flex overflow-hidden"
      style={{
        height: `${windowSize.height - 80}px`,
      }}
    >
      {/* Sidebar */}
      <div className="relative" style={{ width: `${sidebarWidth}px` }}>
        <div className="h-full overflow-auto">{sidebarContent}</div>
        <div
          className="absolute top-0 right-0 w-[2px] h-full bg-content1 cursor-col-resize"
          onMouseDown={startResizeSidebar}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Upper part */}
        <div className="relative" style={{ height: `${upperHeight}px` }}>
          <div className="h-full overflow-auto">{upperContent}</div>
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-content1 cursor-row-resize"
            onMouseDown={startResizeUpper}
          />
        </div>

        {/* Lower part */}
        <div className="flex-1 overflow-auto">{lowerContent}</div>
      </div>
    </div>
  );
};

export default ResizableLayout;
