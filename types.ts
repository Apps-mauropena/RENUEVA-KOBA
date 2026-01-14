
export type MaterialType = 'Impermeabilizante' | 'Pintura' | 'Sellador';

export interface MaterialConfig {
  name: MaterialType;
  yield: number; // m2 per bucket
  price: number; // price per bucket
  brand: string; // bucket brand
}

export interface Worker {
  id: string;
  name: string;
  dailyRate: number; // cost per 8 hours
}

export interface ProjectConfig {
  m2: number;
  selectedMaterial: MaterialType;
  auxMaterialRate: number; // per 100m2
  profitRate: number; // per 1m2
  materials: Record<MaterialType, MaterialConfig>;
  workers: Worker[]; // Individual roster
  numWorkers: number;
  workerDailyRate: number;
  workDays: number;
  // Scaffolding rental fields
  scaffoldCount: number;
  scaffoldDailyRate: number;
  scaffoldDays: number;
  // Masonry repair fields
  masonryRepairEnabled: boolean;
  masonryRepairCost: number;
}

// Interface for AI-driven updates
export interface AIUpdates {
  m2?: number;
  selectedMaterial?: string;
  yield?: number;
  price?: number;
  brand?: string;
  auxMaterialRate?: number;
  profitRate?: number;
  numWorkers?: number;
  workerDailyRate?: number;
  workDays?: number;
  scaffoldCount?: number;
  scaffoldDailyRate?: number;
  scaffoldDays?: number;
  masonryRepairEnabled?: boolean;
  masonryRepairCost?: number;
  addWorker?: { name: string; dailyRate: number };
  removeWorker?: string; // id or name
}

export interface QuoteItem {
  concept: string;
  detail: string;
  quantity: string | number;
  unitPrice: number;
  total: number;
  brand?: string; 
  yieldDisplay?: string; // Added field for separate column
  isWarning?: boolean; // Highlight in red
  laborDetails?: {
    workers: number;
    rate: number;
    days: number;
  };
}

export interface QuoteResult {
  items: QuoteItem[];
  subtotal: number;
  iva: number;
  total: number;
}
