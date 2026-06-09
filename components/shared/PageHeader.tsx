import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function PageHeader({ icon: Icon, title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
          <Icon size={22} className="text-gray-500 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">{title}</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
