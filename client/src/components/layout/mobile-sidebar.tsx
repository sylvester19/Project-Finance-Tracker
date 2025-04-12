import { useLocation, Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { 
  Home, 
  Sun, 
  FileText, 
  Users, 
  BarChart, 
  Settings,
  X
} from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Projects', href: '/projects', icon: Sun },
    { name: 'Expenses', href: '/expenses', icon: FileText },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: BarChart },
    { name: 'Settings', href: '/settings', icon: Settings }
  ];

  // Handle navigation click
  const handleNavClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex z-40 lg:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-600 bg-opacity-75" 
        aria-hidden="true"
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-primary-800">
        {/* Close button */}
        <div className="absolute top-0 right-0 -mr-12 pt-2">
          <button 
            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            onClick={onClose}
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Logo */}
        <div className="flex-shrink-0 flex items-center px-4">
          <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <span className="ml-2 text-white font-semibold text-lg">SolarFund</span>
        </div>

        {/* Navigation */}
        <div className="mt-5 flex-1 h-0 overflow-y-auto">
          <nav className="px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href || 
                               (item.href !== '/' && location.startsWith(item.href));
              
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  onClick={handleNavClick}
                  className={`${
                    isActive
                      ? 'bg-primary-900 text-white'
                      : 'text-white hover:bg-primary-700'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                >
                  <item.icon className="mr-4 flex-shrink-0 h-6 w-6 text-primary-300" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile */}
        <div className="flex-shrink-0 flex border-t border-primary-700 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div>
                <div className="inline-block h-9 w-9 rounded-full bg-primary-600 text-white flex items-center justify-center">
                  {user?.name.charAt(0)}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs font-medium text-primary-200 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
