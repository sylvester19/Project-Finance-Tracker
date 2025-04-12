import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 shadow-md rounded-md border">
        <p className="font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color || entry.fill }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const COLORS = ['#10B981', '#0EA5E9', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Analytics() {
  const [timeframe, setTimeframe] = useState("90");

  // Fetch budget vs spent data
  const { data: budgetVsSpent = [], isLoading: isBudgetLoading } = useQuery({
    queryKey: ['/api/analytics/budget-vs-spent'],
    staleTime: 60000
  });

  // Fetch monthly spending trends
  const { data: monthlySpending = [], isLoading: isMonthlyLoading } = useQuery({
    queryKey: ['/api/analytics/monthly-spending'],
    staleTime: 60000
  });

  // Fetch spending by category
  const { data: spendingByCategory = [], isLoading: isCategoryLoading } = useQuery({
    queryKey: ['/api/analytics/spending-by-category'],
    staleTime: 60000
  });

  // Fetch expense approval rates
  const { data: approvalRates = [], isLoading: isApprovalLoading } = useQuery({
    queryKey: ['/api/analytics/expense-approval-rates'],
    staleTime: 60000
  });

  // Fetch spending by employee
  const { data: employeeSpending = [], isLoading: isEmployeeLoading } = useQuery({
    queryKey: ['/api/analytics/spending-by-employee'],
    staleTime: 60000
  });

  // Calculate total amounts
  const totalBudget = budgetVsSpent.reduce((sum: number, project: any) => sum + project.budget, 0);
  const totalSpent = budgetVsSpent.reduce((sum: number, project: any) => sum + project.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  // Format categories data for pie chart
  const categoryData = spendingByCategory.map((item: any, index: number) => ({
    name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
    value: item.amount,
    color: COLORS[index % COLORS.length]
  }));

  // Format approval rates for pie chart
  const approvalRateData = approvalRates.map((item: any, index: number) => ({
    name: item.status,
    value: item.count,
    color: item.status === 'Approved' 
      ? '#10B981' 
      : item.status === 'Rejected' 
        ? '#EF4444' 
        : '#F59E0B'
  }));

  // Format employee spending for bar chart (top 5)
  const topEmployeeSpending = [...employeeSpending]
    .sort((a: any, b: any) => b.amount - a.amount)
    .slice(0, 5)
    .map((item: any, index: number) => ({
      name: item.employee,
      amount: item.amount,
      color: COLORS[index % COLORS.length]
    }));

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
        <div className="mt-3 sm:mt-0">
          <Select
            value={timeframe}
            onValueChange={setTimeframe}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <div className="text-sm text-gray-500 mt-1">
              {((totalSpent / totalBudget) * 100).toFixed(1)}% of total budget
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Remaining Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRemaining)}</div>
            <div className="text-sm text-gray-500 mt-1">
              {((totalRemaining / totalBudget) * 100).toFixed(1)}% remaining
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget vs. Spent Chart & Monthly Spending Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget vs. Spent by Project</CardTitle>
            <CardDescription>
              Comparison of allocated budget and actual spending across projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isBudgetLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : budgetVsSpent.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-gray-500">
                  No budget data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={budgetVsSpent.map(item => ({
                      name: item.project.length > 15 ? item.project.substring(0, 15) + "..." : item.project,
                      Budget: item.budget,
                      Spent: item.spent,
                      fullName: item.project
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 12 }}
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

        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trends</CardTitle>
            <CardDescription>
              Spending trends across different expense categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isMonthlyLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : monthlySpending.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-gray-500">
                  No spending trend data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlySpending}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis 
                      tickFormatter={(value) => `$${value / 1000}k`}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="equipment" 
                      name="Equipment"
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="labor" 
                      name="Labor"
                      stroke="#0EA5E9" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="transport" 
                      name="Transport"
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spending by Category & Expense Approval Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>
              Distribution of expenses across different categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isCategoryLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : categoryData.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-gray-500">
                  No category data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Approval Rates</CardTitle>
            <CardDescription>
              Distribution of expense approval statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isApprovalLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : approvalRateData.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-gray-500">
                  No approval rate data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={approvalRateData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {approvalRateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Employees by Spending */}
      <Card>
        <CardHeader>
          <CardTitle>Top Employees by Spending</CardTitle>
          <CardDescription>
            Employees with the highest approved expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {isEmployeeLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : topEmployeeSpending.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-gray-500">
                No employee spending data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topEmployeeSpending}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 80, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => `$${value / 1000}k`}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="amount" 
                    name="Amount Spent" 
                    fill="#10B981"
                  >
                    {topEmployeeSpending.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
