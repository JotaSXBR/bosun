import type { PaletteColor } from "./schemas";

export interface FunnelTemplateStage {
  name: string;
  color: PaletteColor;
}

export interface FunnelTemplate {
  ref: string;
  label: string;
  stages: FunnelTemplateStage[];
}

/**
 * Declarative niche templates — applied at funnel creation to seed stages.
 * Stages become regular editable rows afterwards; `template_ref` only
 * records provenance on the funnel.
 */
export const FUNNEL_TEMPLATES: readonly FunnelTemplate[] = [
  {
    ref: "imobiliaria",
    label: "Imobiliária",
    stages: [
      { name: "Novo lead", color: "blue" },
      { name: "Qualificação", color: "indigo" },
      { name: "Visita agendada", color: "purple" },
      { name: "Proposta", color: "amber" },
      { name: "Negociação", color: "orange" },
      { name: "Fechado", color: "green" },
    ],
  },
  {
    ref: "clinica",
    label: "Clínica / Saúde",
    stages: [
      { name: "Novo contato", color: "blue" },
      { name: "Triagem", color: "indigo" },
      { name: "Consulta agendada", color: "purple" },
      { name: "Em tratamento", color: "amber" },
      { name: "Concluído", color: "green" },
    ],
  },
  {
    ref: "varejo",
    label: "Varejo / E-commerce",
    stages: [
      { name: "Lead", color: "blue" },
      { name: "Interesse", color: "indigo" },
      { name: "Orçamento enviado", color: "purple" },
      { name: "Pagamento", color: "amber" },
      { name: "Concluído", color: "green" },
    ],
  },
  {
    ref: "servicos",
    label: "Serviços",
    stages: [
      { name: "Prospecção", color: "blue" },
      { name: "Qualificação", color: "indigo" },
      { name: "Proposta", color: "amber" },
      { name: "Em execução", color: "purple" },
      { name: "Concluído", color: "green" },
    ],
  },
] as const;

export function findTemplate(ref: string): FunnelTemplate | undefined {
  return FUNNEL_TEMPLATES.find((t) => t.ref === ref);
}
