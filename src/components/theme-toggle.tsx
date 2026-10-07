"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      spacing={0}
      aria-label="Selecionar tema"
      value={mounted && theme ? [theme] : []}
      onValueChange={(value) => {
        if (value[0]) setTheme(value[0]);
      }}
    >
      <ToggleGroupItem value="light" aria-label="Tema claro">
        <SunIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Tema escuro">
        <MoonIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" aria-label="Tema do sistema">
        <MonitorIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
