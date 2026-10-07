import type { ReactNode } from "react";
import { Box, Text, type TextProps } from "ink";

// Fixed-width table cell: truncates instead of wrapping so columns stay aligned.
export function Cell({
  width,
  align = "left",
  children,
  ...text
}: {
  width: number;
  align?: "left" | "right";
  children: ReactNode;
} & Omit<TextProps, "wrap">) {
  return (
    <Box
      width={width}
      flexShrink={0}
      justifyContent={align === "right" ? "flex-end" : "flex-start"}
    >
      <Text wrap="truncate-end" {...text}>
        {children}
      </Text>
    </Box>
  );
}
