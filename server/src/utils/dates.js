// IST is UTC+5:30 all year (India has no daylight saving), so a fixed offset is safe.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Midnight IST at the start of the day `now` falls in, returned as a normal Date.
// Example: 11 Oct 03:00 IST (10 Oct 21:30 UTC) -> 11 Oct 00:00 IST (10 Oct 18:30 UTC)
export function startOfTodayIST(now = new Date()) {
  const istMs = now.getTime() + IST_OFFSET_MS; // shift the clock to IST
  const istMidnightMs = istMs - (istMs % DAY_MS); // drop the time of day
  return new Date(istMidnightMs - IST_OFFSET_MS); // shift back to real time
}

// Midnight IST `days` days before today. daysAgoIST(0) is the same as startOfTodayIST().
export function daysAgoIST(days, now = new Date()) {
  return new Date(startOfTodayIST(now).getTime() - days * DAY_MS);
}
