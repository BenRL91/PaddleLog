// One implementation of usage, wear, costs, source ownership, and validation across clients.
export { validate } from "../../public/validate.js";
export { sessionUsage, componentWear } from "../../public/maintenance.js";
export { activeMain, changeMain } from "../../public/main-paddle.js";
export {
  switchTimerPaddle,
  pauseTimer,
  resumeTimer,
  finishTimer,
  usageSegments,
  usesPaddle,
} from "../../public/session-segments.js";
export { surfaceInfo, supportsSkin } from "../../public/surface.js";
export {
  availableSupplies,
  allocateSupply,
  usedUnits,
  expenseKinds,
  supplyUnit,
  roundMoney,
  equipmentKinds,
} from "../../public/shared-expenses.js";
export {
  withPaddleReflections,
  sessionReflections,
  collectionCostSummary,
} from "../../public/pro-data.js";
export {
  gameRecords,
  summarizeGames,
  filterGameRecords,
} from "../../public/results-data.js";
export { paddleImage } from "../../public/paddle-image.js";
export { ownedPaddleLabel } from "../../public/catalog-names.js";
export { normalizeSharedCatalog } from "../../public/shared-catalog.js";
