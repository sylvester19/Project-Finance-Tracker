import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import ProjectDetails from "@/pages/project-details";
import Expenses from "@/pages/expenses";
import Clients from "@/pages/clients";
import Employees from "@/pages/employees";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import UserManagement from "@/pages/user-management";
import Login from "@/pages/login";
import Register from "@/pages/register";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ExpenseDetails from "@/pages/expense-details";
import ClientDetails from "./pages/client-details";
import { DateRangeProvider } from "@/context/DateRangeContext"; 
import EmployeeDetails from "./pages/employee-details";

// Protected route wrapper
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return <Component {...rest} />;
}


function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
    

      {isAuthenticated && (
        <AppShell>
          <Switch>
            <Route
              path="/"
              component={() => (
                <DateRangeProvider>
                  <ProtectedRoute component={Dashboard} />
                </DateRangeProvider>
              )}
            />
            <Route path="/projects" component={() => <ProtectedRoute component={Projects} />} />
            <Route path="/projects/:id" component={() => <ProtectedRoute component={ProjectDetails} />} />
            <Route path="/expenses" component={() => <ProtectedRoute component={Expenses} />} />
            <Route path="/expenses/:id" component={() => <ProtectedRoute component={ExpenseDetails} />} />
            <Route path="/clients" component={() => <ProtectedRoute component={Clients} />} />
            <Route path="/clients/:id" component={() => <ProtectedRoute component={ClientDetails} />} />           
            <Route path="/employees" component={() => <ProtectedRoute component={Employees} />} />
            <Route path="/employees/:id" component={() => <ProtectedRoute component={EmployeeDetails} />} />
            <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
            <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
            <Route path="/user-management" component={() => <ProtectedRoute component={UserManagement} />} />
            <Route component={NotFound} />
          </Switch>
        </AppShell>
      )}



      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
