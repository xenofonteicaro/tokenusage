"use client";
import { useI18n } from "./language-provider";

import * as React from "react";
import { useTheme } from "next-themes";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { t } = useI18n();
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
      aria-label={t("Selecionar tema")}
      value={mounted && theme ? [theme] : []}
      onValueChange={(value) => {
        if (value[0]) setTheme(value[0]);
      }}
    >
      <ToggleGroupItem value="light" aria-label={t("Tema claro")}>
        <SunIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label={t("Tema escuro")}>
        <MoonIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" aria-label={t("Tema do sistema")}>
        <MonitorIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
