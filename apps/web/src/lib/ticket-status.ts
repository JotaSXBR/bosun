export const TICKET_STATUS: Record<
  string,
  { label: string; variant: "warning" | "success" | "outline" | "secondary" }
> = {
  open: { label: "Na fila", variant: "warning" },
  in_progress: { label: "Em atendimento", variant: "success" },
  waiting_customer: { label: "Aguardando cliente", variant: "outline" },
  resolved: { label: "Resolvido", variant: "secondary" },
};
