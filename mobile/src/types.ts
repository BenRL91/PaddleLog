export type Entity = { id: string; [key: string]: unknown };
export type Expense = Entity & {
  kind: string;
  product: string;
  amount: number;
  currency: string;
  date: string;
  quantity?: number;
  outsideUseUnits?: number;
  supplyId?: string;
  units?: number;
  maintenanceEventId?: string;
};
export type Maintenance = Entity & {
  kind: string;
  action: string;
  at: string;
  product: string;
  interval?: number | null;
};
export type Paddle = Entity & {
  brand: string;
  model: string;
  nickname?: string;
  status?: string;
  favorite?: boolean;
  shape?: string;
  thickness?: number | string;
  photoId?: string;
  modelId?: string | null;
  maintenance?: Maintenance[];
  expenses?: Expense[];
};
export type Segment = {
  id: string;
  paddleId: string;
  start: string;
  end?: string;
};
export type Reflection = {
  paddleId: string;
  control?: number;
  power?: number;
  comfort?: number;
  confidence?: number;
};
export type Game = {
  id: string;
  discipline: "singles" | "doubles";
  format: "side-out" | "rally" | "simple";
  status: "completed" | "unfinished" | "abandoned";
  target: number;
  winBy: number;
  teams: string[][];
  ownerTeam: 0 | 1 | null;
  score: number[] | null;
  paddleId: string | null;
};
export type Session = Entity & {
  paddleId: string;
  start: string;
  end: string;
  name?: string;
  location?: string;
  notes?: string;
  segments?: Segment[];
  estimatedHours?: number;
  paddleReflections?: Reflection[];
  reflection?: Reflection;
  manualGames?: { version: 1; games: Game[] };
};
export type Timer = Entity & {
  paddleId: string;
  start: string;
  end?: string;
  pausedAt?: string;
  segments?: Segment[];
};
export type Library = {
  version: number;
  paddles: Paddle[];
  sessions: Session[];
  usagePeriods: Entity[];
  catalog: unknown[];
  settings: {
    mainPaddleId?: string | null;
    collectionExpenses?: Expense[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};
export type Snapshot = { accountId: string; revision: number; state: Library };
export type Entitlements = {
  accountId: string;
  pro: boolean;
  freePaddles: number;
  purchasesEnabled: boolean;
};

export type CatalogRow = {
  brand: string;
  model: string;
  shape: string;
  thickness: number | string;
  referenceModelId: string;
  referenceRecord: Record<string, unknown>;
};
