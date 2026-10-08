import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MonthlySavingsPoint } from '../../api/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { TrendingUp } from 'lucide-react';

interface SavingsTrendChartProps {
  data: MonthlySavingsPoint[];
}

export const SavingsTrendChart: React.FC<SavingsTrendChartProps> = ({ data }) => {
  const formattedData = data.map((item) => ({
    ...item,
    savingsLakhs: Number((item.savingsInr / 100000).toFixed(1)),
    volumeCrores: Number((item.procurementVolumeInr / 10000000).toFixed(2)),
  }));

  return (
    <Card className="border border-border/80 shadow-md bg-card/60 backdrop-blur-xs h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              Cumulative Statutory Savings Over Time
            </CardTitle>
            <CardDescription className="text-xs">
              Direct DPCO 2013 price markups and illegal vendor quotes blocked (in ₹ Lakhs)
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Savings (₹ Lakhs)</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex-1">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} unit="L" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`₹${val} Lakhs`, 'Blocked Overpayment']}
                labelFormatter={(lbl: any) => `Audit Cycle: ${lbl}`}
              />
              <Area
                type="monotone"
                dataKey="savingsLakhs"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#savingsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
