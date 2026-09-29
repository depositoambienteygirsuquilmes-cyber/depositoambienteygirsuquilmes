import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Tool } from '../types';

interface DashboardChartsProps {
  tools: Tool[];
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#6366f1', '#ef4444'];

const DashboardCharts: React.FC<DashboardChartsProps> = ({ tools }) => {
  // Aggregate data by category
  const data = tools.reduce((acc: any[], tool) => {
    const existing = acc.find(item => item.name === tool.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: tool.category, value: 1 });
    }
    return acc;
  }, []);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Distribución por Categoría</h3>
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardCharts;