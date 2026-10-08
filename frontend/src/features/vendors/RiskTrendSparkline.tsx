import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { RiskTrendPoint } from '../../api/types';

interface RiskTrendSparklineProps {
  data: RiskTrendPoint[];
  height?: number;
}

export const RiskTrendSparkline: React.FC<RiskTrendSparklineProps> = ({
  data,
  height = 140,
}) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-muted-foreground">No historical data available.</div>;
  }

  // Format data for recharts
  const chartData = data.map((d) => ({
    quarter: d.quarter,
    score: d.riskScore ?? (d as any).risk_score ?? 30,
    cases: d.auditedCases ?? (d as any).audited_cases ?? 1,
  }));

  const firstScore = chartData[0].score;
  const lastScore = chartData[chartData.length - 1].score;
  const isImproving = lastScore < firstScore;

  const strokeColor = isImproving ? '#10b981' : lastScore > 65 ? '#ef4444' : '#f59e0b';
  const fillColor = isImproving ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="quarter"
            tick={{ fontSize: 10, fill: '#888' }}
            tickLine={false}
            axisLine={{ stroke: '#333' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#888' }}
            tickLine={false}
            axisLine={{ stroke: '#333' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-popover border border-border/80 px-2.5 py-1.5 rounded shadow text-xs">
                    <p className="font-semibold text-foreground">{item.quarter}</p>
                    <p className="text-muted-foreground">
                      Risk Score:{' '}
                      <span className="font-bold text-foreground">{item.score}/100</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Audited Cases: {item.cases}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke={strokeColor}
            strokeWidth={2}
            fill="url(#riskGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
