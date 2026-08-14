export interface CalendarEvent {
  title: string;
  description: string;
  location: string; // the consultation room URL — shows as a clickable link in most calendar apps
  start: Date;
  end: Date;
}

function toUTCStamp(d: Date) {
  // YYYYMMDDTHHMMSSZ — the format both Google and the ICS spec expect.
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildGoogleCalendarUrl(e: CalendarEvent) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${toUTCStamp(e.start)}/${toUTCStamp(e.end)}`,
    details: e.description,
    location: e.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildOutlookCalendarUrl(e: CalendarEvent) {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    startdt: e.start.toISOString(),
    enddt: e.end.toISOString(),
    subject: e.title,
    body: e.description,
    location: e.location,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

// A data: URI .ics link — no backend endpoint needed. iOS/macOS Safari
// and most desktop calendar apps (Apple Calendar, Outlook desktop)
// recognize text/calendar and offer to add the event directly.
export function buildICSDataUrl(e: CalendarEvent, uid: string) {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vaidya//Consultation//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}@vaidya`,
    `DTSTAMP:${toUTCStamp(new Date())}`,
    `DTSTART:${toUTCStamp(e.start)}`,
    `DTEND:${toUTCStamp(e.end)}`,
    `SUMMARY:${e.title}`,
    `DESCRIPTION:${e.description.replace(/\n/g, "\\n")}`,
    `LOCATION:${e.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
