// pages/client-details.tsx

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
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
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate, getStatusColor, formatStatus, calculatePercentage } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Client, Project, ProjectBudgetComparison } from "@shared/schema";
import { Edit, ArrowLeft, Search, PanelTop } from "lucide-react";

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id);
  const [, navigate] = useLocation();
  const { authenticatedFetch, user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch client details
  const { data: client, isLoading: isClientLoading, error: clientError } = useQuery({
    queryKey: [`/api/clients/${clientId}`],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", `/api/clients/${clientId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch client");
      }
      return await res.json();
    },
  });

  // Fetch client projects
  const { data: projects = [], isLoading: isProjectsLoading, error: projectsError } = useQuery<Project[]>({
    queryKey: [`/api/projects/client/${clientId}`],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", `/api/projects/client/${clientId}`);
      return res.json();
    },
    enabled: !!clientId, // Only fetch if clientId is valid
    staleTime: 60000
  });

  // Get budget vs spent data
  const { data: budgetVsSpent = [] } = useQuery<ProjectBudgetComparison[]>({
    queryKey: ['/api/analytics/total-budget-vs-spent'],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", "/api/analytics/total-budget-vs-spent");
      return res.json();
    },
    staleTime: 60000
  });

  const canEditClient = user && (user.role === "admin" || user.role === "manager");

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

    // Get spent amount for a project
    const getProjectSpent = (projectName: string) => {
      const data = budgetVsSpent.find(p => p.project === projectName);
      return data ? data.spent : 0;
    };

  // Loading state
  if (isClientLoading || isProjectsLoading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="py-12 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (clientError || projectsError) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-red-500">
          Error: {clientError?.message || projectsError?.message}
        </div>
      </div>
    );
  }

  // Not found state
  if (!client) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-800">Client Not Found</h2>
          <p className="mt-2 text-gray-600">The client you're looking for doesn't exist or has been removed.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/clients")}>
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <Button variant="ghost" className="mb-2" onClick={() => navigate("/clients")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Clients
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{client.name}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
      <Card>
          <CardHeader>
            <div className="flex items-center justify-between"> {/* Flex container for title and button */}
              <CardTitle>Client Information</CardTitle>
              {canEditClient && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/clients/${clientId}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Client
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Contact Person</div>
                <div>{client.contactPerson}</div>
              </div>

              {client.contactEmail && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Email</div>
                  <div>
                    <a href={`mailto:${client.contactEmail}`} className="text-blue-500 hover:underline">
                      {client.contactEmail}
                    </a>
                  </div>
                </div>
              )}

              {client.contactPhone && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Phone</div>
                  <div>
                    <a href={`tel:${client.contactPhone}`} className="text-blue-500 hover:underline">
                      {client.contactPhone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects for {client.name}</CardTitle>
            <CardDescription>View and manage projects associated with this client.</CardDescription>
            <div className="flex flex-col sm:flex-row mt-4 gap-3">
              <div className="relative rounded-md flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search projects"
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isProjectsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "No projects match your filters"
                  : "No projects available for this client"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Spent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Start Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => {
                      const spent = getProjectSpent(project.name);
                      const percentage = calculatePercentage(spent, project.budget);

                      return (
                        <TableRow
                          key={project.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 flex-shrink-0 bg-primary-100 text-primary-600 rounded-md flex items-center justify-center">
                                <PanelTop className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium">{project.name}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(project.budget)}</TableCell>
                          <TableCell>
                            <div>{formatCurrency(spent)}</div>
                            <div className="text-sm text-muted-foreground">
                              {percentage}% used
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(project.status)}>
                              {formatStatus(project.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Progress value={percentage} className="h-2 w-full max-w-xs" />
                          </TableCell>
                          <TableCell>{formatDate(project.startDate)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredProjects.length} of {projects.length} projects
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}