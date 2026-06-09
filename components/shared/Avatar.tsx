import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: "sm" | "md";
}

export default function Avatar({ firstName, lastName, size = "sm" }: AvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center text-white font-semibold flex-shrink-0",
        size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"
      )}
    >
      {getInitials(firstName, lastName)}
    </div>
  );
}
