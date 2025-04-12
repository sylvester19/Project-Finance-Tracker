import { getInitials } from "@/lib/utils";

interface User {
  id?: number;
  name?: string;
  role?: string;
}

interface UserAvatarProps {
  user?: User | null;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ user, size = "md" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-10 w-10"
  };

  const initials = user?.name ? getInitials(user.name) : "U";

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-primary-500 flex items-center justify-center text-white font-medium`}
    >
      {initials}
    </div>
  );
}
