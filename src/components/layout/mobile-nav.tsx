"use client";

import { useState } from "react";
import { Menu, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarNav } from "./sidebar-nav";
import { SidebarWatchlist } from "./sidebar-watchlist";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="shrink-0" />
          }
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation</span>
        </SheetTrigger>

        <SheetContent side="left" className="w-[260px] p-0">
          <SheetHeader className="flex h-14 flex-row items-center gap-2.5 px-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <SheetTitle className="text-sm font-semibold tracking-tight">
              Highland
            </SheetTitle>
          </SheetHeader>

          <Separator />

          <ScrollArea className="flex-1 overflow-hidden">
            <div className="flex flex-col gap-6 py-4">
              <SidebarNav />
              <Separator className="mx-3" />
              <SidebarWatchlist />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Mobile header bar branding */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Highland
        </span>
      </div>
    </header>
  );
}
