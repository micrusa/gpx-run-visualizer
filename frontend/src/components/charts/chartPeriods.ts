import type { ChartBucket, ChartGranularity } from "@/lib/chartsService";

export type DateWindow = { from: string; to: string };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAILY_SPAN = 30;
const WEEKLY_SPAN = 12;
const MONTHLY_SPAN = 12;

export function todayIsoDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatIsoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

function startOfIsoWeek(date: Date): Date {
  const day = date.getUTCDay(); // 0 = Sun, 1 = Mon, ...
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(date, offset);
}

function endOfIsoWeek(date: Date): Date {
  return addDays(startOfIsoWeek(date), 6);
}

function startOfMonth(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex, 1));
}

function endOfMonth(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex + 1, 0));
}

export function defaultWindow(granularity: ChartGranularity, today = todayIsoDate()): DateWindow {
  const anchor = parseIsoDate(today);
  if (granularity === "DAILY") {
    return { from: formatIsoDate(addDays(anchor, -(DAILY_SPAN - 1))), to: formatIsoDate(anchor) };
  }
  if (granularity === "WEEKLY") {
    const end = endOfIsoWeek(anchor);
    const start = addDays(startOfIsoWeek(anchor), -(WEEKLY_SPAN - 1) * 7);
    return { from: formatIsoDate(start), to: formatIsoDate(end) };
  }
  const end = endOfMonth(anchor.getUTCFullYear(), anchor.getUTCMonth());
  const start = startOfMonth(anchor.getUTCFullYear(), anchor.getUTCMonth() - (MONTHLY_SPAN - 1));
  return { from: formatIsoDate(start), to: formatIsoDate(end) };
}

export function shiftWindow(granularity: ChartGranularity, window: DateWindow, direction: -1 | 1): DateWindow {
  const from = parseIsoDate(window.from);
  const to = parseIsoDate(window.to);
  if (granularity === "DAILY") {
    const delta = direction * DAILY_SPAN;
    return { from: formatIsoDate(addDays(from, delta)), to: formatIsoDate(addDays(to, delta)) };
  }
  if (granularity === "WEEKLY") {
    const delta = direction * WEEKLY_SPAN * 7;
    return {
      from: formatIsoDate(startOfIsoWeek(addDays(from, delta))),
      to: formatIsoDate(endOfIsoWeek(addDays(to, delta))),
    };
  }
  const delta = direction * MONTHLY_SPAN;
  return {
    from: formatIsoDate(startOfMonth(from.getUTCFullYear(), from.getUTCMonth() + delta)),
    to: formatIsoDate(endOfMonth(to.getUTCFullYear(), to.getUTCMonth() + delta)),
  };
}

export function formatBucketTick(granularity: ChartGranularity, bucket: Pick<ChartBucket, "key" | "startDate">): string {
  const start = parseIsoDate(bucket.startDate);
  if (granularity === "DAILY") {
    return `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]}`;
  }
  if (granularity === "WEEKLY") {
    const weekPart = bucket.key.split("-")[1] ?? bucket.key;
    return weekPart;
  }
  return `${MONTHS[start.getUTCMonth()]} ${String(start.getUTCFullYear()).slice(-2)}`;
}

export function formatBucketLabel(granularity: ChartGranularity, bucket: Pick<ChartBucket, "key" | "startDate" | "endDate">): string {
  const start = parseIsoDate(bucket.startDate);
  const end = parseIsoDate(bucket.endDate);
  if (granularity === "DAILY") {
    return `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}`;
  }
  if (granularity === "WEEKLY") {
    const weekPart = bucket.key.split("-")[1] ?? bucket.key;
    const sameMonth = start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();
    const range = sameMonth
      ? `${start.getUTCDate()}–${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]} ${end.getUTCFullYear()}`
      : `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]} – ${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
    return `${weekPart} · ${range}`;
  }
  return `${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}`;
}

export function formatWindowLabel(granularity: ChartGranularity, fromIso: string, toIso: string): string {
  const from = parseIsoDate(fromIso);
  const to = parseIsoDate(toIso);
  if (granularity === "MONTHLY") {
    const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
    return sameYear
      ? `${MONTHS[from.getUTCMonth()]} – ${MONTHS[to.getUTCMonth()]} ${to.getUTCFullYear()}`
      : `${MONTHS[from.getUTCMonth()]} ${from.getUTCFullYear()} – ${MONTHS[to.getUTCMonth()]} ${to.getUTCFullYear()}`;
  }
  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  return sameYear
    ? `${from.getUTCDate()} ${MONTHS[from.getUTCMonth()]} – ${to.getUTCDate()} ${MONTHS[to.getUTCMonth()]} ${to.getUTCFullYear()}`
    : `${from.getUTCDate()} ${MONTHS[from.getUTCMonth()]} ${from.getUTCFullYear()} – ${to.getUTCDate()} ${MONTHS[to.getUTCMonth()]} ${to.getUTCFullYear()}`;
}

export function formatDuration(seconds: number): string {
  const rounded = Math.round(seconds);
  if (rounded <= 0) return "0m";
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export type PercentDiff = {
  direction: "up" | "down";
  percent: number;
  formatted: string;
};

export function percentDiff(current: number | null, previous: number | null): PercentDiff | null {
  if (current == null || previous == null || !Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) {
    return null;
  }
  const percent = ((current - previous) / previous) * 100;
  if (!Number.isFinite(percent) || Math.abs(percent) < 0.05) return null;
  const sign = percent > 0 ? "+" : "";
  return {
    direction: percent > 0 ? "up" : "down",
    percent,
    formatted: `${sign}${percent.toFixed(1)}%`,
  };
}
