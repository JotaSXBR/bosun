// Labels live in messages/<locale>.json under `ticketStatus` — this map
// only carries the badge variant per status.
export const TICKET_STATUS: Record<
  string,
  { variant: "warning" | "success" | "outline" | "secondary" }
> = {
  open: { variant: "warning" },
  in_progress: { variant: "success" },
  waiting_customer: { variant: "outline" },
  resolved: { variant: "secondary" },
  closed: { variant: "secondary" },
};
