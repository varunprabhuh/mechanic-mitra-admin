'use client';

import * as React from 'react';
import { Label, Pie, PieChart, Sector } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { Member } from '@/lib/types';
import { getMemberStatus } from '@/lib/utils';
import { Badge } from '../ui/badge';

type StatusDistributionChartProps = {
  members: Member[];
};

const chartConfig = {
  Active: { label: 'Active', color: 'hsl(var(--chart-2))' }, // Green
  Inactive: { label: 'Inactive', color: 'hsl(var(--chart-1))' }, // Red
  Expired: { label: 'Expired', color: 'hsl(var(--chart-1))' }, // Red
  'Not Issued': { label: 'Not Issued', color: 'hsl(var(--muted))' },
} satisfies ChartConfig;

export function StatusDistributionChart({ members }: StatusDistributionChartProps) {
  const totalMembers = members.length;
  const data = React.useMemo(() => {
    const statusCounts: Record<string, number> = {
      Active: 0,
      Inactive: 0,
      Expired: 0,
      'Not Issued': 0,
    };
    members.forEach(member => {
      const status = getMemberStatus(member);
      statusCounts[status]++;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      fill: `var(--color-${status})`,
    })).filter(item => item.count > 0);
  }, [members]);

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[250px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          innerRadius={60}
          strokeWidth={5}
          activeIndex={0}
          activeShape={(props: React.ComponentProps<typeof Sector>) => (
             <Sector {...props} cornerRadius={4} />
          )}
        >
           <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-3xl font-bold"
                    >
                      {totalMembers.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      Members
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="status" />} />
      </PieChart>
    </ChartContainer>
  );
}
