import Link from 'next/link';
import { MessageSquare } from 'lucide-react'; // Using MessageSquare as a generic icon

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  hideTextOnCollapsed?: boolean;
}

export function Logo({ className, iconClassName, textClassName, hideTextOnCollapsed = true }: LogoProps) {
  const textSpanClass = hideTextOnCollapsed ? "group-data-[collapsible=icon]:hidden" : "";
  return (
    <Link href="/dashboard" className={`flex items-center gap-2 text-2xl font-bold ${className}`}>
      <MessageSquare className={`h-7 w-7 ${iconClassName ?? 'text-primary group-data-[sidebar=sidebar]:text-sidebar-primary'}`} />
      <span className={`${textSpanClass} ${textClassName}`}>AI Caller</span>
    </Link>
  );
}
