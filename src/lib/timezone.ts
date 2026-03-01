import { prisma } from "./prisma";

/**
 * Get user's timezone from the database.
 * Falls back to "Asia/Almaty" if not set.
 */
export async function getUserTimezone(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  return user?.timezone || "Asia/Almaty";
}

/**
 * Get the start of "today" (midnight) in the user's timezone,
 * returned as a UTC Date that Prisma/Postgres can use.
 *
 * Example: if user is in Asia/Almaty (UTC+5) and it's 2026-02-28 23:00 UTC,
 * the local time is 2026-03-01 04:00 → "today" is 2026-03-01.
 * This returns a Date representing 2026-03-01T00:00:00+05:00 = 2026-02-28T19:00:00Z.
 */
export function todayForTimezone(tz: string): Date {
  // Get current date string in user's timezone (YYYY-MM-DD)
  const now = new Date();
  const localDateStr = now.toLocaleDateString("en-CA", { timeZone: tz }); // "en-CA" gives YYYY-MM-DD
  // Build midnight in that timezone
  return midnightInTimezone(localDateStr, tz);
}

/**
 * Get midnight of a specific date string (YYYY-MM-DD) in the given timezone,
 * returned as a UTC Date.
 */
export function midnightInTimezone(dateStr: string, tz: string): Date {
  // Parse date parts
  const [year, month, day] = dateStr.split("-").map(Number);

  // Create a date at roughly the right time (noon UTC to avoid DST issues)
  const rough = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  // Get the offset for that date in the target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(rough);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0");
  const localH = get("hour");
  const localM = get("minute");

  // The rough date is at 12:00 UTC. The local time at that moment is localH:localM.
  // offset = localTime - utcTime (in minutes)
  const utcMinutes = 12 * 60;
  const localMinutes = localH * 60 + localM;
  const offsetMinutes = localMinutes - utcMinutes;

  // Midnight local = 00:00 local = 00:00 - offset = -offset in UTC
  const midnightUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60 * 1000);

  return midnightUTC;
}

/**
 * Get end of day (23:59:59.999) for a date in the given timezone.
 */
export function endOfDayInTimezone(dateStr: string, tz: string): Date {
  const midnight = midnightInTimezone(dateStr, tz);
  return new Date(midnight.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Get the YYYY-MM-DD string for "today" in user's timezone.
 */
export function todayDateStr(tz: string): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: tz });
}

/**
 * Get start of week (Monday) in user's timezone.
 */
export function weekStartForTimezone(tz: string, refDate?: Date): Date {
  const d = refDate || new Date();
  const localStr = d.toLocaleDateString("en-CA", { timeZone: tz });
  const [y, m, day] = localStr.split("-").map(Number);
  const local = new Date(y, m - 1, day);
  const dow = local.getDay();
  const diff = dow === 0 ? -6 : 1 - dow; // Monday = 1
  local.setDate(local.getDate() + diff);
  const mondayStr = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
  return midnightInTimezone(mondayStr, tz);
}
