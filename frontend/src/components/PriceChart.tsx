'use client';

import { PriceHistoryEntry } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PriceChartProps {
  data: PriceHistoryEntry[];
  loading?: boolean;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
}

export default function PriceChart({ data, loading = false }: PriceChartProps) {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">Loading chart...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">No price history available yet</p>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = data.map((entry) => ({
    timestamp: formatDate(new Date(entry.timestamp)),
    price: entry.price,
    fullDate: entry.timestamp,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          label={{ value: 'Price (₹)', angle: -90, position: 'insideLeft' }}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value) => `₹${typeof value === 'number' ? value.toFixed(2) : value}`}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#0E9F6E"
          dot={false}
          activeDot={{ r: 6 }}
          isAnimationActive={true}
          name="Price"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
