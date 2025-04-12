import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

type Notification = {
  id: number;
  message: string;
  createdAt: string;
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications (we're using activity logs as notifications)
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['/api/activity-logs'],
    enabled: isOpen, // Only fetch when dropdown is open
  });

  const toggleMenu = () => setIsOpen(!isOpen);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format notification message based on activity type
  const formatNotification = (activity: any) => {
    const activityTime = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true });
    return {
      id: activity.id,
      message: activity.description,
      createdAt: activityTime
    };
  };

  return (
    <div className="ml-3 relative" ref={dropdownRef}>
      <button
        type="button"
        className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        onClick={toggleMenu}
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-6 w-6" />
      </button>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-72 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          tabIndex={-1}
        >
          <div className="px-4 py-2 text-sm text-gray-700 border-b">
            <div className="font-medium">Notifications</div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-2 text-sm text-gray-500">Loading notifications...</div>
            ) : notifications && notifications.length > 0 ? (
              notifications.slice(0, 5).map((activity: any) => {
                const notification = formatNotification(activity);
                return (
                  <div key={notification.id} className="px-4 py-2 hover:bg-gray-100 border-b">
                    <p className="text-sm text-gray-700 mb-1">{notification.message}</p>
                    <p className="text-xs text-gray-500">{notification.createdAt}</p>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">No notifications</div>
            )}
          </div>

          <div className="px-4 py-2 text-sm text-center text-primary-600 hover:text-primary-800">
            View all notifications
          </div>
        </div>
      )}
    </div>
  );
}
