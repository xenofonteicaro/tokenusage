import { Box, Text } from "ink";
import { visibleWindow } from "../format";
import { useI18n } from "../i18n-context";

export function HelpOverlay() {
  const { t } = useI18n();
  const keys: [string, string][] = [
    ["1 2 3 · Tab", t("Switch screen")],
    ["c", t("Switch between Tools and APIs")],
    ["d", t("Cycle the period (7, 30 and 90 days)")],
    ["s", t("Cycle the service")],
    ["p", t("Choose the project")],
    ["/", t("Search in Activity")],
    ["g", t("Group Activity by session, model, project or day")],
    ["↑ ↓ PgUp PgDn", t("Scroll the lists")],
    ["r", t("Refresh now (automatic every 60 s)")],
    ["?", t("Open or close this help")],
    ["q", t("Quit")],
  ];
  return (
    <Box flexDirection="column">
      <Text bold>{t("Shortcuts")}</Text>
      {keys.map(([key, description]) => (
        <Box key={key}>
          <Box width={16} flexShrink={0}>
            <Text bold>{key}</Text>
          </Box>
          <Text wrap="truncate-end">{description}</Text>
        </Box>
      ))}
      <Text dimColor>
        {t(
          "Taller windows show more rankings in the Overview. Press any key to go back.",
        )}
      </Text>
    </Box>
  );
}

export function ProjectPicker({
  options,
  cursor,
  current,
  height,
}: {
  options: string[];
  cursor: number;
  current: string;
  height: number;
}) {
  const { t } = useI18n();
  const { start, end } = visibleWindow(
    options.length,
    cursor,
    Math.max(1, height - 2),
  );
  return (
    <Box flexDirection="column">
      <Text bold>{t("Project")}</Text>
      {options.slice(start, end).map((option, offset) => {
        const index = start + offset;
        const label = option || t("All projects");
        return (
          <Text key={label} wrap="truncate-end" bold={index === cursor}>
            {index === cursor ? "› " : "  "}
            {label}
            {option === current ? " ✓" : ""}
          </Text>
        );
      })}
      <Text dimColor>{t("↑↓ choose · Enter confirm · Esc cancel")}</Text>
    </Box>
  );
}
