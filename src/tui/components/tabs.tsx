import { Box, Text } from "ink";

export function Tabs({ labels, active }: { labels: string[]; active: number }) {
  return (
    <Box>
      <Text bold>tokenusage</Text>
      <Text dimColor> · </Text>
      {labels.map((label, index) => (
        <Box key={label} marginRight={1}>
          <Text
            inverse={index === active}
            bold={index === active}
            dimColor={index !== active}
          >
            {` ${index + 1} ${label} `}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
