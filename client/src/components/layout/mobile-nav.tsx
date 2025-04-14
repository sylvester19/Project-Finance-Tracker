import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { UserAvatar } from "./user-avatar";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart3, SunIcon, Users, FileText, 
  Settings, ShieldCheck, LogOut, 
  LucideIcon, PanelTop, Bell, X, Menu, Factory 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon: Icon, label, active, onClick }) => {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-3 py-3 text-base font-medium rounded-md group",
          active 
            ? "bg-gray-100 text-primary-600" 
            : "text-gray-700 hover:text-primary-600 hover:bg-gray-100"
        )}
        onClick={onClick}
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

interface MobileNavProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function MobileNav({ isOpen, onToggle, onClose }: MobileNavProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "manager";

  // Close mobile nav on location change
  useEffect(() => {
    onClose();
  }, [location, onClose]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button 
            id="mobile-menu-button" 
            className="text-gray-500 focus:outline-none"
            onClick={onToggle}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <SunIcon className="h-8 w-8 text-primary-500" />
            <span className="text-xl font-semibold ml-2">SolarFund</span>
          </div>
        </div>
        <div className="flex items-center">
          <button className="p-1 rounded-full text-gray-500 hover:bg-gray-100 relative">
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          <div className="ml-4">
            <UserAvatar user={user} />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar (hidden by default) */}
      <div 
        className={cn(
          "fixed inset-0 z-20 flex transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button 
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none"
              onClick={onClose}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
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
                onClick={onClose}
              />
              <NavItem 
                href="/projects" 
                icon={PanelTop} 
                label="Projects" 
                active={location === "/projects" || location.startsWith("/projects/")} 
                onClick={onClose}
              />
              <NavItem 
                href="/expenses" 
                icon={FileText} 
                label="Expenses" 
                active={location === "/expenses" || location.startsWith("/expenses/")} 
                onClick={onClose}
              />
              <NavItem 
                href="/clients" 
                icon={Users} 
                label="Clients" 
                active={location === "/clients"}
                onClick={onClose}
              />
              <NavItem 
                href="/employees" 
                icon={Factory} 
                label="Employees" 
                active={location === "/employees"} 
                onClick={onClose}
              />
              {isAdmin && (
                <NavItem 
                  href="/analytics" 
                  icon={BarChart3} 
                  label="Analytics" 
                  active={location === "/analytics"} 
                  onClick={onClose}
                />
              )}
            </div>
            {isAdmin && (
              <div className="mt-8">
                <h3 className="px-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Admin
                </h3>
                <div className="mt-2 space-y-1">
                  <NavItem 
                    href="/settings" 
                    icon={Settings} 
                    label="Settings" 
                    active={location === "/settings"} 
                    onClick={onClose}
                  />
                  <NavItem 
                    href="/user-management" 
                    icon={ShieldCheck} 
                    label="User Management" 
                    active={location === "/user-management"} 
                    onClick={onClose}
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
        </div>
        <div className="flex-shrink-0 w-14"></div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
