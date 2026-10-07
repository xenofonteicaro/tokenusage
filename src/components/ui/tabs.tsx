"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  id: string;
  onValueChange: (value: string) => void;
}
const TabsContext = React.createContext<TabsContextValue | undefined>(
  undefined,
);

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [activeTab, setActiveTab] = React.useState(defaultValue || "");
  const id = React.useId();
  return (
    <TabsContext.Provider
      value={{
        value: value ?? activeTab,
        id,
        onValueChange: (next) => {
          if (value === undefined) setActiveTab(next);
          onValueChange?.(next);
        },
      }}
    >
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
  onKeyDown,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      role="tablist"
      className={cn(
        "inline-flex items-center rounded-lg bg-[var(--secondary)] p-1 text-[var(--muted-foreground)]",
        className,
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          event.defaultPrevented ||
          !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
        )
          return;
        const tabs = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            '[role="tab"]:not(:disabled)',
          ),
        );
        const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
                tabs.length;
        event.preventDefault();
        tabs[next]?.focus();
        tabs[next]?.click();
      }}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");
  const selected = context.value === value;
  return (
    <button
      {...props}
      role="tab"
      type="button"
      id={`${context.id}-tab-${value}`}
      aria-controls={`${context.id}-panel-${value}`}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) context.onValueChange(value);
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        selected
          ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
          : "hover:text-[var(--foreground)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");
  return (
    <div
      {...props}
      role="tabpanel"
      id={`${context.id}-panel-${value}`}
      aria-labelledby={`${context.id}-tab-${value}`}
      hidden={context.value !== value}
      tabIndex={0}
      className={cn(
        "mt-4 focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
