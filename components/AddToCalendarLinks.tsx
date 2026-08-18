import {
  buildGoogleCalendarUrl,
  buildICSDataUrl,
  buildOutlookCalendarUrl,
  type CalendarEvent,
} from "@/utils/calendar";

// No "use client" here on purpose — this only renders plain <a> tags
// built from a few pure string-formatting functions, so it works as a
// leaf component from both server pages (the search page's upcoming
// list) and client components (BookSlotButton's post-booking state)
// without needing to be a client component itself.
export function AddToCalendarLinks({
  event,
  consultationId,
}: {
  event: CalendarEvent;
  consultationId: string;
}) {
  const linkClass =
    "rounded-full border border-line bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-trust hover:text-trust-dark dark:hover:text-trust";

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={buildGoogleCalendarUrl(event)}
        target="_blank"
        rel="noreferrer"
        className={linkClass}
      >
        Google Calendar
      </a>
      <a
        href={buildOutlookCalendarUrl(event)}
        target="_blank"
        rel="noreferrer"
        className={linkClass}
      >
        Outlook
      </a>
      <a href={buildICSDataUrl(event, consultationId)} download={`${consultationId}.ics`} className={linkClass}>
        Apple / iPhone Calendar
      </a>
    </div>
  );
}
