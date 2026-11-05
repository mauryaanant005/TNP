import React, { useRef, useState, useEffect } from "react";

export interface TabItem<T extends string> {
  key: T;
  label: string;
  icon?: React.ReactNode;
}

interface TextTabsProps<T extends string> {
  tabs: TabItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  className?: string;
  idPrefix?: string;
  gapClassName?: string;
  tabClassName?: string;
}

export function TextTabs<T extends string>({
  tabs,
  activeKey,
  onChange,
  className = "",
  idPrefix = "text-tab",
  gapClassName = "gap-7",
  tabClassName = "",
}: TextTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const updateIndicator = () => {
    const activeEl = tabRefs.current[activeKey];
    const container = containerRef.current;
    if (activeEl && container) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      setIndicatorStyle({
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
        opacity: 1,
      });
    }
  };

  useEffect(() => {
    updateIndicator();
  }, [activeKey, tabs]);

  useEffect(() => {
    const handleResize = () => updateIndicator();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeKey]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center ${gapClassName} border-b border-gray-200 overflow-x-auto select-none no-print ${className}`}
      role="tablist"
      style={{
        background: "transparent",
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeKey === tab.key;
        return (
          <button
            key={tab.key}
            id={`${idPrefix}-${tab.key}`}
            data-testid={`${idPrefix}-${tab.key}`}
            ref={(el) => {
              tabRefs.current[tab.key] = el;
            }}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`relative inline-flex items-center gap-2 px-2.5 pb-3 pt-2 text-sm whitespace-nowrap bg-transparent border-0 outline-none cursor-pointer transition-colors duration-200 ${
              isActive
                ? "text-blue-600 font-semibold"
                : "text-slate-500 hover:text-slate-900 font-medium"
            } ${tabClassName}`}
            style={{
              background: "transparent",
              border: "none",
              boxShadow: "none",
            }}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}

      {/* Smooth moving active blue underline */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 h-[2.5px] bg-blue-600 rounded-full pointer-events-none"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          opacity: indicatorStyle.opacity,
          transition: "left 240ms cubic-bezier(0.4, 0, 0.2, 1), width 240ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms ease",
        }}
      />
    </div>
  );
}

