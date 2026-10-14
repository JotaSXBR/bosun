export {
  createDeal,
  createDealFromConversation,
  deleteDeal,
  getDealForConversation,
  moveDeal,
  searchContacts,
  updateDeal,
} from "./deals";
export {
  createLabel,
  deleteLabel,
  listContactLabels,
  listConversationLabels,
  listLabels,
  setContactLabels,
  setConversationLabels,
  setDealLabels,
  updateLabel,
} from "./labels";
export type { DealCardRow, DealRow, FunnelRow, LabelRow, StageRow } from "./repository";
export type {
  CreateDealFromConversationInput,
  CreateDealInput,
  CreateFunnelInput,
  CreateLabelInput,
  CreateStageInput,
  CustomAttributes,
  MoveDealInput,
  MoveStageInput,
  SetContactLabelsInput,
  SetConversationLabelsInput,
  SetDealLabelsInput,
  UpdateDealInput,
  UpdateFunnelInput,
  UpdateLabelInput,
  UpdateStageInput,
} from "./schemas";
export type { PaletteColor } from "./schemas";
export { COLOR_PALETTE } from "./schemas";
export type { BoardData, BoardStage } from "./service";
export {
  createFunnel,
  createStage,
  deleteFunnel,
  deleteStage,
  getBoard,
  listFunnels,
  listStages,
  listStagesForFunnels,
  moveStage,
  updateFunnel,
  updateStage,
} from "./service";
export type { FunnelTemplate, FunnelTemplateStage } from "./templates";
export { FUNNEL_TEMPLATES } from "./templates";
