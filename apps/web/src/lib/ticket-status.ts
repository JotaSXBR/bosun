// Labels live in messages/<locale>.json under `ticketStatus` — this map
// only carries the badge tone per status.
export const TICKET_STATUS: Record<string, { tone: "warning" | "success" | "neutral" }> = {
  open: { tone: "warning" },
  in_progress: { tone: "success" },
  waiting_customer: { tone: "neutral" },
  resolved: { tone: "neutral" },
  closed: { tone: "neutral" },
};
