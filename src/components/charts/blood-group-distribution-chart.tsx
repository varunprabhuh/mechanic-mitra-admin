
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { Member } from '@/lib/types';

type BloodGroupDistributionChartProps = {
  members: Member[];
};

const chartConfig = {
  count: {
    label: 'Members',
    color: 'hsl(var(--destructive))',
  },
} satisfies ChartConfig;

export function BloodGroupDistributionChart({ members }: BloodGroupDistributionChartProps) {
  const data = React.useMemo(() => {
    const bloodGroupCounts: Record<string, number> = {
      'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0,
    };
    members.forEach(member => {
      if (member.bloodGroup && bloodGroupCounts.hasOwnProperty(member.bloodGroup)) {
        bloodGroupCounts[member.bloodGroup]++;
      }
    });
    return Object.entries(bloodGroupCounts).map(([group, count]) => ({
      bloodGroup: group,
      count,
    })).filter(item => item.count > 0); // Only show blood groups with members
  }, [members]);

  return (
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <BarChart accessibilityLayer data={data} layout="vertical">
            <CartesianGrid horizontal={false} />
            <YAxis
                dataKey="bloodGroup"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value}
                width={40}
            />
            <XAxis type="number" allowDecimals={false} dataKey="count" />
            <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            <ChartLegend content={<ChartLegendContent />} />
        </BarChart>
      </ChartContainer>
  );
}
