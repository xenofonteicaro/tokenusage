import { Box, Text } from "ink";
import { visibleWindow } from "../format";
import { useI18n } from "../i18n-context";

export function HelpOverlay() {
  const { t } = useI18n();
  const keys: [string, string][] = [
    ["1 2 3 · Tab", t("Troca de tela")],
    ["c", t("Alterna Ferramentas e APIs")],
    ["d", t("Alterna o período (7, 30 e 90 dias)")],
    ["s", t("Alterna o serviço")],
    ["p", t("Escolhe o projeto")],
    ["/", t("Busca na Atividade")],
    ["g", t("Agrupa a Atividade por sessão, modelo, projeto ou dia")],
    ["↑ ↓ PgUp PgDn", t("Rola as listas")],
    ["r", t("Atualiza agora (automático a cada 60 s)")],
    ["?", t("Abre ou fecha esta ajuda")],
    ["q", t("Sai")],
  ];
  return (
    <Box flexDirection="column">
      <Text bold>{t("Atalhos")}</Text>
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
          "Janelas mais altas mostram mais rankings na Visão geral. Pressione qualquer tecla para voltar.",
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
      <Text bold>{t("Projeto")}</Text>
      {options.slice(start, end).map((option, offset) => {
        const index = start + offset;
        const label = option || t("Todos os projetos");
        return (
          <Text key={label} wrap="truncate-end" bold={index === cursor}>
            {index === cursor ? "› " : "  "}
            {label}
            {option === current ? " ✓" : ""}
          </Text>
        );
      })}
      <Text dimColor>{t("↑↓ escolhe · Enter confirma · Esc cancela")}</Text>
    </Box>
  );
}
