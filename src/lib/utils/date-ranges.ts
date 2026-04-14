import { subDays, subMonths, subYears } from "date-fns";
import type { DateRange } from "@/types";

export function getStartDate(range: DateRange): Date | null {
  const now = new Date();
  switch (range) {
    case "1w":
      return subDays(now, 7);
    case "1m":
      return subMonths(now, 1);
    case "3m":
      return subMonths(now, 3);
    case "6m":
      return subMonths(now, 6);
    case "1y":
      return subYears(now, 1);
    case "all":
      return null;
  }
}
