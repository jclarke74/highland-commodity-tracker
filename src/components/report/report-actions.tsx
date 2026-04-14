"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Download, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateReportPdf } from "@/lib/report/generate-pdf";
import type { InsightCard } from "@/types";

interface CommodityEntry {
  id: number;
  name: string;
  slug: string;
  category: string;
  latestPrice: {
    price: number;
    dayChange: number;
    dayChangePct: number;
    weeklyPct: number;
    monthlyPct: number;
    ytdPct: number;
    date: string;
  } | null;
}

interface ReportActionsProps {
  commodities: CommodityEntry[];
  insights: InsightCard[];
  generatedAt: string | null;
  disabled: boolean;
}

export function ReportActions({
  commodities,
  insights,
  generatedAt,
  disabled,
}: ReportActionsProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownload() {
    setIsGenerating(true);
    try {
      const reportCommodities = commodities
        .filter((c) => c.latestPrice !== null)
        .map((c) => ({
          name: c.name,
          price: c.latestPrice!.price,
          dayChange: c.latestPrice!.dayChange,
          dayChangePct: c.latestPrice!.dayChangePct,
          weeklyPct: c.latestPrice!.weeklyPct,
          monthlyPct: c.latestPrice!.monthlyPct,
          ytdPct: c.latestPrice!.ytdPct,
        }));

      const doc = generateReportPdf(reportCommodities, insights, generatedAt);
      const dateStr = format(new Date(), "yyyy-MM-dd");
      doc.save(`highland-report-${dateStr}.pdf`);
      toast.success("Report downloaded successfully");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={disabled || isGenerating}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Download PDF
      </button>
      <Button variant="outline" size="default" onClick={handlePrint} disabled={disabled}>
        <Printer className="h-3.5 w-3.5" data-icon="inline-start" />
        Print
      </Button>
    </div>
  );
}
