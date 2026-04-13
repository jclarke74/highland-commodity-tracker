"use client";

interface KpiCardProps {
  name: string;
  price: number;
  dayChangePct: number;
}

function formatPrice(price: number): string {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function KpiCard({ name, price, dayChangePct }: KpiCardProps) {
  const isPositive = dayChangePct >= 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 min-w-[160px]">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">
        {name}
      </p>
      <p className="text-2xl font-bold text-foreground tabular-nums">
        ${formatPrice(price)}
      </p>
      <p
        className={`text-sm font-medium mt-1 ${
          isPositive ? "text-[color:var(--color-positive)]" : "text-[color:var(--color-negative)]"
        }`}
      >
        {isPositive ? "\u25B2" : "\u25BC"}{" "}
        {Math.abs(dayChangePct).toFixed(2)}%
      </p>
    </div>
  );
}
