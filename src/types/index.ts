export const EmploymentType = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CASUAL: 'CASUAL',
} as const;
export type EmploymentType = typeof EmploymentType[keyof typeof EmploymentType];

export const EmployeeRole = {
  CREW: 'CREW',
  MANAGER: 'MANAGER',
} as const;
export type EmployeeRole = typeof EmployeeRole[keyof typeof EmployeeRole];

export const StoreLocationType = {
  CBD_CORE: 'CBD_CORE',
  SUBURBAN_RESIDENTIAL: 'SUBURBAN_RESIDENTIAL',
} as const;
export type StoreLocationType = typeof StoreLocationType[keyof typeof StoreLocationType];

export interface Employee {
  id: string;
  externalCode: number;
  firstName: string;
  lastName: string;
  employmentType: EmploymentType;
  role: EmployeeRole;
  defaultStoreId: string;
  defaultStore?: Store;
  defaultStationId?: string;
  defaultStation?: Station;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeDto {
  externalCode: number;
  firstName: string;
  lastName: string;
  employmentType: EmploymentType;
  role: EmployeeRole;
  defaultStoreId: string;
  defaultStationId?: string;
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {}

export interface Store {
  id: string;
  code: string;
  name: string;
  locationType: StoreLocationType;
  revenueLevel?: string;
  storeType?: string;
  openingTime?: string;
  closingTime?: string;
}

export interface CreateStoreDto {
  code: string;
  name: string;
  locationType: StoreLocationType;
  revenueLevel?: string;
  storeType?: string;
  openingTime?: string;
  closingTime?: string;
}

export interface UpdateStoreDto extends Partial<CreateStoreDto> {}

export interface Station {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface CreateStationDto {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateStationDto extends Partial<CreateStationDto> {}

export interface ShiftCode {
  id: string;
  code: string;
  shiftName: string;
  startTime?: string;
  endTime?: string;
  hours?: number;
  description?: string;
  isAvailable: boolean;
  isManagement: boolean;
  isActive: boolean;
}

export interface CreateShiftCodeDto {
  code: string;
  shiftName: string;
  startTime?: string;
  endTime?: string;
  hours?: number;
  description?: string;
  isAvailable?: boolean;
  isManagement?: boolean;
}

export interface UpdateShiftCodeDto extends Partial<CreateShiftCodeDto> {}

export interface SchedulePeriod {
  id: string;
  store: Store;
  startDate: string;
  endDate: string;
  periodType: 'NORMAL' | 'PEAK';
  isActive: boolean;
}

export interface EmployeeAvailability {
  id: string;
  employee: Employee;
  schedulePeriod: SchedulePeriod;
  store: Store;
  date: string; // ISO date string
  shiftCode: ShiftCode;
  station?: Station;
  notes?: string;
  isActive: boolean;
}

// Types for Roster Generation from MAS (Multi-Agent System)
export interface RosterShift {
  employeeId: string;
  employeeName?: string;
  start: string;
  end: string;
  station?: string;      // Nombre de la estación (del backend)
  stationCode?: string;  // Codigo alternativo
  shiftCodeCode?: string;
  isWorking: boolean;
}

export interface ComplianceIssue {
  issue: string;
  severity: 'CRITICAL' | 'MAJOR' | 'WARNING' | 'MINOR' | 'INFO';
  employeeId?: string;
  details?: Record<string, unknown>;
  suggestion?: string;
}

export interface ComplianceSuggestion {
  type: string;
  relatedIssue: string;
  description: string;
  employeeId?: string;
}

export interface ComplianceResult {
  passed: boolean;
  issues?: ComplianceIssue[];
  suggestions?: ComplianceSuggestion[];
  summary?: string;
}

export interface OptimizationMetrics {
  originalCost: number;
  optimizedCost: number;
  savingsPercent: number;
  suggestionsApplied: number;
}

export interface OptimizationResult {
  score: number;
  roster: { roster: RosterShift[]; metadata: RosterMetadata };
  metrics: OptimizationMetrics;
  validationQueries?: Array<{ passed: boolean; description: string }>;
}

export interface ConflictAction {
  type: string;
  description: string;
  success: boolean;
  employeeId?: string;
}

export interface ConflictResolutionResult {
  roster: { roster: RosterShift[]; metadata: RosterMetadata };
  resolved: number;
  unresolved: number;
  actions: ConflictAction[];
  warnings: string[];
  requiresHumanReview?: boolean;
}

export interface AgentMessage {
  timestamp: string;
  from: string;
  to: string;
  action: string;
  data?: unknown;
}

export interface RosterMetadata {
  generatedAt: string;
  storeId: string;
  weekStart: string;
  weekEnd: string;
  employeeCount: number;
}

export interface RosterGenerationResult {
  status: 'ok' | 'requires_human_review' | 'optimization_failed' | 'partial';
  roster: {
    roster: RosterShift[];
    metadata: RosterMetadata;
  };
  compliance: ComplianceResult;
  optimization?: OptimizationResult;
  conflictResolution?: ConflictResolutionResult;
  agentTrace: AgentMessage[];
  metrics?: {
    totalDurationMs: number;
    costSavingsPercent?: number;
    suggestionsApplied?: number;
    validationQueriesCount?: number;
    coverageGapsResolved?: number;
    lastSuccessfulPhase?: string;
    error?: string;
  };
}

