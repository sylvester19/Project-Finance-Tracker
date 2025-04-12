import React from "react";
import { Link, useLocation } from "wouter";
import { UserAvatar } from "./user-avatar";
import { useAuth } from "@/hooks/use-auth";
import { 
  BarChart3, SunIcon, Users, FileText, 
  Settings, ShieldCheck, LogOut, 
  LucideIcon, PanelTop, Factory 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon: Icon, label, active }) => {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-md group",
          active 
            ? "bg-gray-100 text-primary-600" 
            : "text-gray-700 hover:text-primary-600 hover:bg-gray-100"
        )}
      >
        <Icon 
          className={cn(
            "mr-3 h-5 w-5",
            active ? "text-primary-500" : "text-gray-500 group-hover:text-primary-500"
          )} 
        />
        <span>{label}</span>
      </a>
    </Link>
  );
};

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  // User role dependent menu items
  const isAdmin = user?.role === "admin" || user?.role === "manager";

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <SunIcon className="h-8 w-8 text-primary-500" />
        <span className="text-xl font-semibold ml-2">SolarFund</span>
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="space-y-1">
          <NavItem 
            href="/" 
            icon={BarChart3} 
            label="Dashboard" 
            active={location === "/"} 
          />
          <NavItem 
            href="/projects" 
            icon={PanelTop} 
            label="Projects" 
            active={location === "/projects" || location.startsWith("/projects/")} 
          />
          <NavItem 
            href="/expenses" 
            icon={FileText} 
            label="Expenses" 
            active={location === "/expenses" || location.startsWith("/expenses/")} 
          />
          <NavItem 
            href="/clients" 
            icon={Users} 
            label="Clients" 
            active={location === "/clients"} 
          />
          <NavItem 
            href="/employees" 
            icon={Factory} 
            label="Employees" 
            active={location === "/employees"} 
          />
          {isAdmin && (
            <NavItem 
              href="/analytics" 
              icon={BarChart3} 
              label="Analytics" 
              active={location === "/analytics"} 
            />
          )}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Admin
            </h3>
            <div className="mt-2 space-y-1">
              <NavItem 
                href="/settings" 
                icon={Settings} 
                label="Settings" 
                active={location === "/settings"} 
              />
              <NavItem 
                href="/user-management" 
                icon={ShieldCheck} 
                label="User Management" 
                active={location === "/user-management"} 
              />
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <UserAvatar user={user} />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user?.name || "User"}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role || "User"}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="ml-auto text-gray-400 hover:text-gray-600"
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
