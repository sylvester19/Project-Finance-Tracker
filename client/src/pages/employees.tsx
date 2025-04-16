import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { useLocation } from "wouter";
import { getInitials } from "@/lib/utils";
import { Search, UserCircle, CircleDollarSign, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { EmployeeSpending } from "@shared/schema";

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export default function Employees() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBySpending, setSortBySpending] = useState("none");
  const { authenticatedFetch } = useAuth();

  // Fetch users
  const { data: users = [], isLoading: isUsersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", '/api/users');
      if (!res.ok) {
        throw new Error(`Failed to fetch users: ${res.statusText}`);
      }
      return await res.json();
    },
    staleTime: 300000
  });

  // Fetch spending by employee for analytics
  const { data: employeeSpending = [], isLoading: isSpendingLoading, error: spendingError } = useQuery<EmployeeSpending[]>({
    queryKey: ['/api/analytics/spending-by-employee'],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", '/api/analytics/spending-by-employee');
      if (!res.ok) {
        throw new Error(`Failed to fetch employee spending: ${res.statusText}`);
      }
      return await res.json();
    },
    staleTime: 60000
  });

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      // Filter out admin users (they're not employees)
      if (user.role === "admin") return false;
      
      // Apply search and role filters
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .map(user => {
      // Add spending data to each user
      const spending = employeeSpending.find((s: any) => s.employee === user.name);
      return {
        ...user,
        spending: spending ? spending.amount : 0
      };
    })
    .sort((a, b) => {
      // Sort by spending if needed
      if (sortBySpending === "highest") {
        return b.spending - a.spending;
      } else if (sortBySpending === "lowest") {
        return a.spending - b.spending;
      }
      return 0;
    });

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
          <CardDescription>
            View and analyze your team members.
          </CardDescription>
          <div className="flex flex-col sm:flex-row mt-4 gap-3">
            <div className="relative rounded-md flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search employees"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={setRoleFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="salesperson">Salesperson</SelectItem>
                <SelectItem value="employee">Engineer/Worker</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortBySpending}
              onValueChange={setSortBySpending}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by spending" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Sorting</SelectItem>
                <SelectItem value="highest">Highest Spending</SelectItem>
                <SelectItem value="lowest">Lowest Spending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isUsersLoading || isSpendingLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || roleFilter !== "all" 
                ? "No employees match your filters" 
                : "No employees available"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <span>Total Spending</span>
                        <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 flex-shrink-0 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          user.role === "manager" 
                            ? "default" 
                            : user.role === "salesperson" 
                              ? "secondary" 
                              : "outline"
                        }>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CircleDollarSign className="mr-2 h-4 w-4 text-gray-400" />
                          <span>{formatCurrency(user.spending)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/employees/${user.id}`)}
                        >
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} employees
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
