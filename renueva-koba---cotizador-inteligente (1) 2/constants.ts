
import { ProjectConfig } from './types';

export const INITIAL_CONFIG: ProjectConfig = {
  m2: 100,
  selectedMaterial: 'Impermeabilizante',
  auxMaterialRate: 1805, // per 100m2
  profitRate: 70, // per 1m2 ($7000 / 100m2)
  numWorkers: 2,
  workerDailyRate: 600,
  workDays: 5,
  scaffoldCount: 0,
  scaffoldDailyRate: 150,
  scaffoldDays: 5,
  masonryRepairEnabled: false,
  masonryRepairCost: 0,
  materials: {
    'Impermeabilizante': {
      name: 'Impermeabilizante',
      yield: 34, 
      price: 1639,
      brand: 'Fester'
    },
    'Pintura': {
      name: 'Pintura',
      yield: 120,
      price: 2100,
      brand: 'Comex'
    },
    'Sellador': {
      name: 'Sellador',
      yield: 50,
      price: 1200,
      brand: 'Sayer'
    }
  },
  workers: [
    { id: '1', name: 'Maestro Obra', dailyRate: 650 },
    { id: '2', name: 'Ayudante 1', dailyRate: 400 }
  ]
};

export const IVA_RATE = 0.16;
