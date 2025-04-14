import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import ProjectDetails from "@/pages/project-details";
import Expenses from "@/pages/expenses";
import ExpenseDetail from "@/pages/expense-detail";
import Clients from "@/pages/clients";
import Employees from "@/pages/employees";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import UserManagement from "@/pages/user-management";
import Login from "@/pages/login";
import Register from "@/pages/register";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

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
      
      {/* Protected routes */}
      <Route path="/">
        {isAuthenticated ? (
          <AppShell>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/projects" component={Projects} />
              <Route path="/projects/:id" component={ProjectDetails} />
              <Route path="/expenses" component={Expenses} />
              <Route path="/expenses/:id" component={ExpenseDetail} />
              <Route path="/clients" component={Clients} />
              <Route path="/employees" component={Employees} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/settings" component={Settings} />
              <Route path="/user-management" component={UserManagement} />
              <Route component={NotFound} />
            </Switch>
          </AppShell>
        ) : (
          <Login />
        )}
      </Route>
      
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
