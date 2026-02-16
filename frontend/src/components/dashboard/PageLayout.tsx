import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn("min-h-screen space-y-6 bg-gray-50/50 p-6 md:p-8", className)}>
      {children}
    </div>
  );
}
