"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Database,
  Settings,
  FileSpreadsheet,
  Sparkles,
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Contacts",
    href: "/contacts",
    icon: Users,
  },
  {
    title: "Enrichment",
    href: "/enrichment",
    icon: Sparkles,
  },
  {
    title: "Data Sources",
    href: "/data-sources",
    icon: Database,
  },
  {
    title: "Exports",
    href: "/exports",
    icon: FileSpreadsheet,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r bg-card/50 backdrop-blur-xl md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border/50 px-6">
        <Link href="/dashboard" className="flex items-center space-x-2 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60 rounded-lg blur-md opacity-50 group-hover:opacity-70 transition-opacity" />
            <div className="relative rounded-lg bg-gradient-to-br from-primary to-primary/80 p-1.5">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <span className="text-xl font-heading font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Enrichify
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-smooth"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-smooth",
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-transform group-hover:scale-110",
                isActive && "drop-shadow-sm"
              )} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/50 p-4">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 space-y-2">
          <p className="text-xs font-medium text-foreground">
            💡 Pro Tip
          </p>
          <p className="text-xs text-muted-foreground">
            Use keyboard shortcuts to navigate faster. Press <kbd className="px-1.5 py-0.5 text-xs rounded bg-muted">?</kbd> to see all shortcuts.
          </p>
        </div>
      </div>
    </aside>
  );
}
