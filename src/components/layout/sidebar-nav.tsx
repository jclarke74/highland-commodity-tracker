"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/intelligence", label: "Intelligence", icon: Lightbulb },
] as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
              isActive
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors duration-150",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
