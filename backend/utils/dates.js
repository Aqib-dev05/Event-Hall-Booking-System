// Event dates are calendar days ("2026-10-20"), stored in a Postgres DATE column.
// Prisma returns them as a JS Date at 00:00:00 UTC, so everything here works in UTC.

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/

/** "YYYY-MM-DD" -> Date at 00:00 UTC, or null if it is not a real calendar date. */
function parseDateOnly(value) {
  const m = YMD.exec(value || '')
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(y, mo - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) {
    return null
  }
  return date
}

/** Today's calendar date in the given timezone, as a Date at 00:00 UTC. */
function todayInTimezone(timeZone) {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return parseDateOnly(ymd)
}

function tomorrowInTimezone(timeZone) {
  const d = todayInTimezone(timeZone)
  d.setUTCDate(d.getUTCDate() + 1)
  return d
}

function toYmd(date) {
  return date.toISOString().slice(0, 10)
}

/** e.g. "Tuesday, October 20, 2026" (same output as date-fns 'EEEE, MMMM d, yyyy') */
function formatLongDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/** Whole hours from now until the event day starts (truncated, like date-fns differenceInHours). */
function hoursUntil(date) {
  return Math.trunc((date.getTime() - Date.now()) / 3_600_000)
}

module.exports = {
  parseDateOnly,
  todayInTimezone,
  tomorrowInTimezone,
  toYmd,
  formatLongDate,
  hoursUntil,
}
