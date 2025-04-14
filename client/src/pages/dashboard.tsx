import React, { useState } from "react";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { BudgetChart } from "@/components/dashboard/budget-chart";
import { SpendingTrendsChart } from "@/components/dashboard/spending-trends-chart";
import { ProjectsTable } from "@/components/dashboard/projects-table";
import { PendingExpenses } from "@/components/dashboard/pending-expenses";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const [dateRange, setDateRange] = useState("30");
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
  };

  const canCreateProject = user && (user.role === "admin" || user.role === "manager" || user.role === "salesperson");

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="mt-3 sm:mt-0 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <Select
            value={dateRange}
            onValueChange={handleDateRangeChange}
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
          
          {canCreateProject && (
            <Button 
              onClick={() => navigate("/projects/new")}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <StatsOverview />

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetChart />
        <SpendingTrendsChart />
      </div>

      {/* Projects Table */}
      <ProjectsTable />

      {/* Expenses & Activity */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingExpenses />
        <RecentActivity />
      </div>
    </div>
  );
}
