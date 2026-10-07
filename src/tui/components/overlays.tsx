import { Box, Text } from "ink";
import { visibleWindow } from "../format";

const KEYS: [string, string][] = [
  ["1 2 3 · Tab", "Troca de tela"],
  ["c", "Alterna Ferramentas e APIs"],
  ["d", "Alterna o período (7, 30 e 90 dias)"],
  ["s", "Alterna o serviço"],
  ["p", "Escolhe o projeto"],
  ["/", "Busca na Atividade"],
  ["g", "Agrupa a Atividade por sessão, modelo, projeto ou dia"],
  ["↑ ↓ PgUp PgDn", "Rola as listas"],
  ["r", "Atualiza agora (automático a cada 60 s)"],
  ["?", "Abre ou fecha esta ajuda"],
  ["q", "Sai"],
];

export function HelpOverlay() {
  return (
    <Box flexDirection="column">
      <Text bold>Atalhos</Text>
      {KEYS.map(([key, description]) => (
        <Box key={key}>
          <Box width={16} flexShrink={0}>
            <Text bold>{key}</Text>
          </Box>
          <Text wrap="truncate-end">{description}</Text>
        </Box>
      ))}
      <Text dimColor>
        Janelas mais altas mostram mais rankings na Visão geral. Pressione
        qualquer tecla para voltar.
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
  const { start, end } = visibleWindow(
    options.length,
    cursor,
    Math.max(1, height - 2),
  );
  return (
    <Box flexDirection="column">
      <Text bold>Projeto</Text>
      {options.slice(start, end).map((option, offset) => {
        const index = start + offset;
        const label = option || "Todos os projetos";
        return (
          <Text key={label} wrap="truncate-end" bold={index === cursor}>
            {index === cursor ? "› " : "  "}
            {label}
            {option === current ? " ✓" : ""}
          </Text>
        );
      })}
      <Text dimColor>↑↓ escolhe · Enter confirma · Esc cancela</Text>
    </Box>
  );
}
