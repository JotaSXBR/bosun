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
  listConversationLabels,
  listLabels,
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
  SetConversationLabelsInput,
  SetDealLabelsInput,
  UpdateDealInput,
  UpdateFunnelInput,
  UpdateLabelInput,
  UpdateStageInput,
} from "./schemas";
export { COLOR_PALETTE } from "./schemas";
export type { BoardData, BoardStage } from "./service";
export {
  createFunnel,
  createStage,
  deleteFunnel,
  deleteStage,
  getBoard,
  listFunnels,
  moveStage,
  updateFunnel,
  updateStage,
} from "./service";
export type { FunnelTemplate, FunnelTemplateStage } from "./templates";
export { FUNNEL_TEMPLATES } from "./templates";
