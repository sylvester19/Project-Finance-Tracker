import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from "@/hooks/useAuth";
import { SpendingCategory } from '@shared/schema';


const COLORS = [
  'hsl(var(--primary))', 
  'hsl(var(--secondary))', 
  'hsl(var(--accent))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))', 
  'hsl(var(--muted))'
];

export default function SpendingCategoriesChart() {
  const { authenticatedFetch } = useAuth();

  // Fetch top spending categories
  const { data: categories, isLoading } = useQuery<SpendingCategory[]>({
    queryKey: ['/api/analytics/spending-by-category'],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", "/api/analytics/spending-by-category");
      return res.json();
    },
  });

  // Format data for chart
  const formatChartData = () => {
    if (!categories) return [];
    
    return categories.map((category: any) => ({
      name: category.categoryName,
      value: category.amount
    }));
  };

  const chartData = formatChartData();

  // For demo purposes, if no data yet
  const demoData = [
    { name: 'Equipment', value: 45 },
    { name: 'Labor', value: 25 },
    { name: 'Materials', value: 15 },
    { name: 'Travel', value: 8 },
    { name: 'Permits', value: 5 },
    { name: 'Other', value: 2 }
  ];

  const displayData = chartData.length > 0 ? chartData : demoData;

  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  return (
    <Card>
      <CardHeader className="px-6 py-5 flex flex-row items-center justify-between border-b">
        <CardTitle className="text-lg font-medium">Top Spending Categories</CardTitle>
        <Button variant="link" size="sm" className="text-primary-600 hover:text-primary-800">
          View details
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Skeleton className="h-full w-full rounded-md" />
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#666666', strokeWidth: 1 }}
                >
                  {displayData.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={
                    chartData.length > 0 
                      ? (value: number) => formatCurrency(value)
                      : (value: number) => `${value}%`
                  }
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.375rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
