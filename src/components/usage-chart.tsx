"use client";
import { useI18n } from "./language-provider";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { dailySeries } from "@/lib/analytics";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  total: { label: "Tokens", color: "var(--primary)" },
} satisfies ChartConfig;

export function UsageChart({
  series,
}: {
  series: ReturnType<typeof dailySeries>;
}) {
  const { t, formatTokens, formatDate } = useI18n();
  const label = (date: string) => formatDate(`${date}T12:00:00Z`);
  return (
    <ChartContainer
      config={{
        ...chartConfig,
        total: { ...chartConfig.total, label: t("Tokens") },
      }}
      className="aspect-auto h-64 w-full"
    >
      <AreaChart data={series} margin={{ left: 0, right: 8 }}>
        <defs>
          <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-total)"
              stopOpacity={0.25}
            />
            <stop
              offset="95%"
              stopColor="var(--color-total)"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={label}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={60}
          tickFormatter={(value: number) => formatTokens(value)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(value) => label(String(value))}
              formatter={(value) => (
                <div className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">{t("Tokens")}</span>
                  <span className="font-mono font-medium tabular-nums">
                    {formatTokens(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="total"
          type="monotone"
          fill="url(#fillTotal)"
          stroke="var(--color-total)"
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
