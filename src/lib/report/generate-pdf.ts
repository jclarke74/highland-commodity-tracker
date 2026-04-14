import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { InsightCard } from "@/types";

interface ReportCommodity {
  name: string;
  price: number;
  dayChange: number;
  dayChangePct: number;
  weeklyPct: number;
  monthlyPct: number;
  ytdPct: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatPrice(value: number): string {
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatDayChange(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

const PAGE_BG: [number, number, number] = [10, 10, 15];
const TEXT_COLOR: [number, number, number] = [230, 232, 240];
const MUTED_COLOR: [number, number, number] = [140, 140, 160];
const GREEN: [number, number, number] = [34, 197, 94];
const RED: [number, number, number] = [239, 68, 68];
const BLUE: [number, number, number] = [59, 130, 246];
const AMBER: [number, number, number] = [245, 158, 11];
const BODY_BG: [number, number, number] = [17, 17, 24];
const ALT_BG: [number, number, number] = [22, 22, 35];
const LINE_COLOR: [number, number, number] = [40, 40, 60];

const MARGIN = 15;

/* Fill entire page with the dark background */
function fillPageBackground(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(...PAGE_BG);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
}

/* Draw footer on a given page */
function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("Highland Commodity Tracker", MARGIN, pageHeight - 10);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - MARGIN, pageHeight - 10, { align: "right" });
}

/* ------------------------------------------------------------------ */
/*  Main export                                                       */
/* ------------------------------------------------------------------ */

export function generateReportPdf(
  commodities: ReportCommodity[],
  insights: InsightCard[],
  generatedAt: string | null,
): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  /* --- Page 1 background --- */
  fillPageBackground(doc);

  /* --- Header --- */
  let y = MARGIN + 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...TEXT_COLOR);
  doc.text("Highland Commodity Tracker", MARGIN, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text("Summary Report", MARGIN, y);
  y += 6;

  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  const dateStr = generatedAt
    ? new Date(generatedAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  doc.text(dateStr, MARGIN, y);
  y += 4;

  /* Horizontal line */
  doc.setDrawColor(...LINE_COLOR);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 8;

  /* --- Price Table --- */
  const tableBody = commodities.map((c) => [
    c.name,
    formatPrice(c.price),
    formatDayChange(c.dayChange),
    formatPct(c.dayChangePct),
    formatPct(c.weeklyPct),
    formatPct(c.monthlyPct),
    formatPct(c.ytdPct),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Commodity", "Price", "Day Chg", "Day %", "Weekly %", "Monthly %", "YTD %"]],
    body: tableBody,
    theme: "grid",
    styles: {
      fontSize: 9,
      textColor: TEXT_COLOR,
      fillColor: BODY_BG,
      lineColor: LINE_COLOR,
      lineWidth: 0.25,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: BLUE,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: ALT_BG,
    },
    didParseCell(data) {
      // Color percentage columns: Day % (col 3), Weekly % (col 4), Monthly % (col 5), YTD % (col 6)
      // Also Day Chg (col 2)
      if (data.section === "body" && data.column.index >= 2) {
        const raw = commodities[data.row.index];
        if (!raw) return;

        let value = 0;
        switch (data.column.index) {
          case 2:
            value = raw.dayChange;
            break;
          case 3:
            value = raw.dayChangePct;
            break;
          case 4:
            value = raw.weeklyPct;
            break;
          case 5:
            value = raw.monthlyPct;
            break;
          case 6:
            value = raw.ytdPct;
            break;
        }

        if (value > 0) {
          data.cell.styles.textColor = GREEN;
        } else if (value < 0) {
          data.cell.styles.textColor = RED;
        }
      }
    },
  });

  /* Get Y position after the table */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable?.finalY ?? y + 60;
  y += 12;

  /* --- Insights Section --- */
  if (insights.length > 0) {
    const contentWidth = pageWidth - MARGIN * 2;
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottomLimit = pageHeight - 25; // leave room for footer

    function checkPageBreak(needed: number) {
      if (y + needed > bottomLimit) {
        doc.addPage();
        fillPageBackground(doc);
        y = MARGIN + 5;
      }
    }

    checkPageBreak(20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...TEXT_COLOR);
    doc.text("Actionable Insights", MARGIN, y);
    y += 8;

    for (const insight of insights) {
      // Estimate block height (rough) and check page space
      checkPageBreak(45);

      /* Priority badge */
      let badgeColor: [number, number, number];
      let badgeLabel: string;
      switch (insight.priority) {
        case "high":
          badgeColor = RED;
          badgeLabel = "HIGH PRIORITY";
          break;
        case "watch":
          badgeColor = AMBER;
          badgeLabel = "WATCH";
          break;
        case "opportunity":
          badgeColor = GREEN;
          badgeLabel = "OPPORTUNITY";
          break;
        default:
          badgeColor = MUTED_COLOR;
          badgeLabel = String(insight.priority).toUpperCase();
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...badgeColor);
      doc.text(badgeLabel, MARGIN, y);
      y += 5;

      /* Commodity + Title */
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...TEXT_COLOR);
      const titleText = `${insight.commodity}: ${insight.title}`;
      const titleLines = doc.splitTextToSize(titleText, contentWidth);
      doc.text(titleLines, MARGIN, y);
      y += titleLines.length * 4.5 + 2;

      /* Description */
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED_COLOR);
      const descLines = doc.splitTextToSize(insight.description, contentWidth);
      doc.text(descLines, MARGIN, y);
      y += descLines.length * 4 + 2;

      /* Recommendation */
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...TEXT_COLOR);
      const recLines = doc.splitTextToSize(insight.recommendation, contentWidth);
      doc.text(recLines, MARGIN, y);
      y += recLines.length * 4 + 6;

      /* Separator line between insights */
      doc.setDrawColor(...LINE_COLOR);
      doc.setLineWidth(0.2);
      doc.line(MARGIN, y, pageWidth - MARGIN, y);
      y += 6;
    }
  }

  /* --- Footer on every page --- */
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }

  return doc;
}
