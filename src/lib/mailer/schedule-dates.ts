/** Invitations are scheduled by calendar day in the team's time zone. */
export const MAILER_TIME_ZONE = "Africa/Lagos";

/** Today as yyyy-mm-dd in the mailer time zone. */
export const todayInMailerZone = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: MAILER_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

/** An instant's yyyy-mm-dd date and HH:mm time in the mailer time zone. */
export const toMailerZoneParts = (value: string) => {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return { date: "", time: "" };

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: MAILER_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
};

/** Auto-invites stop at the RSVP deadline, or the event day when there isn't one. */
export const getAutoInviteUntil = (
  sendOn: string,
  respondBy: string,
  eventDate: string,
) => {
  const until = respondBy || eventDate;
  return until > sendOn ? until : sendOn;
};
