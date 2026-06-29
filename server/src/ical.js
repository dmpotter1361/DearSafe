// Minimal, dependency-free iCalendar (.ics) reader — just enough to answer
// "what was on my calendar that day?" as journaling context. It is NOT a full
// RFC 5545 implementation.
//
// Supported: VEVENT blocks, line unfolding, DTSTART/DTEND (all-day VALUE=DATE
// and date-time), SUMMARY / LOCATION / DESCRIPTION, and common recurrence
// (RRULE FREQ=DAILY|WEEKLY|MONTHLY|YEARLY with INTERVAL/COUNT/UNTIL/BYDAY,
// plus EXDATE).
//
// Time-zone simplification (intentional, for a personal journal): we bucket
// events by the *literal* wall-clock date written in the file (the YYYYMMDD of
// DTSTART) and display the literal time. We do not convert TZID/UTC to the
// viewer's zone — fine for "that day" context, and keeps this dependency-free.

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

// Unfold folded lines (RFC 5545: a CRLF followed by a space/tab continues).
function unfold(text) {
  return text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
}

// Parse a DTSTART/DTEND/EXDATE value into civil components.
// Returns { y, mo, d, h, mi, allDay } (mo is 1-12).
function parseDate(raw) {
  const v = raw.trim();
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?Z?)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  return {
    y: +y, mo: +mo, d: +d,
    h: h ? +h : 0, mi: mi ? +mi : 0,
    allDay: !h,
  };
}

const isoOf = (c) =>
  `${c.y}-${String(c.mo).padStart(2, '0')}-${String(c.d).padStart(2, '0')}`;

// A civil date as a UTC-midnight Date, so day arithmetic is DST-free.
const utc = (c) => new Date(Date.UTC(c.y, c.mo - 1, c.d));
const civilOf = (date) => ({
  y: date.getUTCFullYear(), mo: date.getUTCMonth() + 1, d: date.getUTCDate(),
});

// Parse a "KEY;PARAM=x:value" property line into { name, params, value }.
function parseLine(line) {
  const colon = line.indexOf(':');
  if (colon === -1) return null;
  const left = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const [name, ...paramParts] = left.split(';');
  const params = {};
  for (const p of paramParts) {
    const eq = p.indexOf('=');
    if (eq !== -1) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1);
  }
  return { name: name.toUpperCase(), params, value };
}

function parseRRule(value) {
  const out = {};
  for (const part of value.split(';')) {
    const [k, v] = part.split('=');
    out[k.toUpperCase()] = v;
  }
  return {
    freq: out.FREQ,
    interval: out.INTERVAL ? +out.INTERVAL : 1,
    count: out.COUNT ? +out.COUNT : null,
    until: out.UNTIL ? parseDate(out.UNTIL) : null,
    byDay: out.BYDAY ? out.BYDAY.split(',').map((s) => s.slice(-2)) : null,
  };
}

// Parse raw .ics text into base (non-expanded) events.
export function parseICS(text) {
  const lines = unfold(text).split('\n');
  const events = [];
  let cur = null;
  for (const line of lines) {
    const t = line.trim();
    if (t === 'BEGIN:VEVENT') { cur = { exdates: [] }; continue; }
    if (t === 'END:VEVENT') {
      if (cur && cur.start) events.push(cur);
      cur = null;
      continue;
    }
    if (!cur) continue;
    const p = parseLine(t);
    if (!p) continue;
    switch (p.name) {
      case 'DTSTART': cur.start = parseDate(p.value); break;
      case 'DTEND': cur.end = parseDate(p.value); break;
      case 'SUMMARY': cur.summary = unescapeText(p.value); break;
      case 'LOCATION': cur.location = unescapeText(p.value); break;
      case 'DESCRIPTION': cur.description = unescapeText(p.value); break;
      case 'RRULE': cur.rrule = parseRRule(p.value); break;
      case 'EXDATE': {
        const c = parseDate(p.value);
        if (c) cur.exdates.push(isoOf(c));
        break;
      }
      default: break;
    }
  }
  return events;
}

function unescapeText(s) {
  return s.replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

function fmtTime(c) {
  if (c.allDay) return null;
  let h = c.h % 12; if (h === 0) h = 12;
  const ampm = c.h < 12 ? 'AM' : 'PM';
  return `${h}:${String(c.mi).padStart(2, '0')} ${ampm}`;
}

// Expand events (incl. recurrence) into concrete occurrences whose date falls
// in [fromISO, toISO]. Returns flat list: { date, time, allDay, summary, location }.
export function eventsForRange(events, fromISO, toISO, cap = 2000) {
  const from = new Date(fromISO + 'T00:00:00Z');
  const to = new Date(toISO + 'T00:00:00Z');
  const out = [];

  for (const ev of events) {
    const base = ev.start;
    if (!base) continue;
    const time = fmtTime(base);
    const push = (iso) => {
      if (ev.exdates.includes(iso)) return;
      out.push({ date: iso, time, allDay: base.allDay, summary: ev.summary || '(busy)', location: ev.location || null });
    };

    if (!ev.rrule || !ev.rrule.freq) {
      const iso = isoOf(base);
      if (base.allDay || true) {
        const d = utc(base);
        if (d >= from && d <= to) push(iso);
      }
      continue;
    }

    // Recurring: walk occurrences from the series start forward.
    const r = ev.rrule;
    const untilDate = r.until ? utc(r.until) : null;
    let count = 0;
    let occ = utc(base);
    const interval = Math.max(1, r.interval);
    let guard = 0;

    const tryDate = (d) => {
      if (untilDate && d > untilDate) return false;
      if (r.count && count >= r.count) return false;
      count++;
      if (d >= from && d <= to) push(isoOf(civilOf(d)));
      return true;
    };

    while (guard++ < cap) {
      if (occ > to && !(r.count && count < r.count)) break; // past window, no count quota left
      if (untilDate && occ > untilDate) break;
      if (r.count && count >= r.count) break;

      if (r.freq === 'WEEKLY' && r.byDay && r.byDay.length) {
        // Emit each configured weekday within this week-step.
        const weekStart = new Date(occ);
        for (const wd of r.byDay) {
          const target = WEEKDAYS.indexOf(wd);
          if (target === -1) continue;
          const day = new Date(weekStart);
          day.setUTCDate(day.getUTCDate() + ((target - day.getUTCDay() + 7) % 7));
          if (day >= utc(base)) {
            if (!tryDate(day)) { guard = cap; break; }
          }
        }
        occ.setUTCDate(occ.getUTCDate() + 7 * interval);
      } else {
        if (!tryDate(new Date(occ))) break;
        switch (r.freq) {
          case 'DAILY': occ.setUTCDate(occ.getUTCDate() + interval); break;
          case 'WEEKLY': occ.setUTCDate(occ.getUTCDate() + 7 * interval); break;
          case 'MONTHLY': occ.setUTCMonth(occ.getUTCMonth() + interval); break;
          case 'YEARLY': occ.setUTCFullYear(occ.getUTCFullYear() + interval); break;
          default: guard = cap; break;
        }
      }
    }
  }

  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.time || '') < (b.time || '') ? -1 : 1));
  return out;
}
