"use client";

import { BarChart3 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarNav } from "./sidebar-nav";
import { SidebarWatchlist } from "./sidebar-watchlist";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220px] flex-col border-r border-border bg-card md:flex">
      {/* Logo area */}
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Highland
        </span>
      </div>

      <Separator />

      {/* Scrollable body: nav + watchlist */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="flex flex-col gap-6 py-4">
          {/* Navigation */}
          <SidebarNav />

          <Separator className="mx-3" />

          {/* Watchlist */}
          <SidebarWatchlist />
        </div>
      </ScrollArea>
    </aside>
  );
}
