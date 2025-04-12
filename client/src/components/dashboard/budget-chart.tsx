import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 shadow-md rounded-md border">
        <p className="font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }

  return null;
}

export function BudgetChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/analytics/budget-vs-spent'],
    staleTime: 60000
  });

  // Format data for chart
  const chartData = data?.map((item: any) => ({
    name: item.project.length > 15 ? item.project.substring(0, 12) + "..." : item.project,
    Budget: item.budget,
    Spent: item.spent,
    fullName: item.project
  })) || [];

  return (
    <Card>
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Budget vs. Spent</h3>
      </div>
      <CardContent className="p-5">
        <div className="h-72">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : error ? (
            <div className="h-full w-full flex items-center justify-center text-red-500">
              Error loading chart data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value / 1000}k`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Budget" fill="#0EA5E9" barSize={30} />
                <Bar dataKey="Spent" fill="#10B981" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
