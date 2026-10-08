import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { VendorComparisonCandidate } from '../../api/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Radar as RadarIcon } from 'lucide-react';

interface RadarComparisonChartProps {
  candidates: VendorComparisonCandidate[];
}

const COLORS = ['#10b981', '#f43f5e', '#38bdf8', '#fbbf24', '#a855f7'];

export const RadarComparisonChart: React.FC<RadarComparisonChartProps> = ({ candidates }) => {
  const radarData = [
    {
      pillar: 'Financial Solvency',
      ...candidates.reduce((acc, c) => ({ ...acc, [c.vendorName]: c.pillars.financialScore }), {}),
    },
    {
      pillar: 'Market Power',
      ...candidates.reduce((acc, c) => ({ ...acc, [c.vendorName]: c.pillars.marketPowerScore }), {}),
    },
    {
      pillar: 'Operational Resiliency',
      ...candidates.reduce((acc, c) => ({ ...acc, [c.vendorName]: c.pillars.operationalScore }), {}),
    },
    {
      pillar: 'Statutory Compliance',
      ...candidates.reduce((acc, c) => ({ ...acc, [c.vendorName]: c.pillars.complianceScore }), {}),
    },
    {
      pillar: 'Corporate Governance',
      ...candidates.reduce((acc, c) => ({ ...acc, [c.vendorName]: c.pillars.governanceScore }), {}),
    },
  ];

  return (
    <Card className="border border-border/80 shadow-md bg-card/60 backdrop-blur-xs h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <RadarIcon className="size-4 text-primary" />
          5-Pillar Due Diligence Radar
        </CardTitle>
        <CardDescription className="text-xs">
          Comparative audit across Financial, Market, Operational, Compliance, and Governance pillars
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 flex-1 flex flex-col justify-center">
        <div className="h-80 w-full min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.12)" />
              <PolarAngleAxis dataKey="pillar" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.2)" fontSize={9} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {candidates.map((c, i) => (
                <Radar
                  key={c.vendorName}
                  name={c.vendorName}
                  dataKey={c.vendorName}
                  stroke={COLORS[i % COLORS.length]}
                  fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.25}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
