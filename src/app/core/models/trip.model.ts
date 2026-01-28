export type TripType = 'single-day' | 'multi-day';

export interface DayDescription {
  date: string;
  description: string;
}

export interface Trip {
  tripType: TripType;
  tripDate?: string;
  startDate?: string;
  endDate?: string;
  tripName: string;
  guides: string[];
  departure: string;
  section: string;
  transport: string;
  fitnessDifficulty: string;
  technicalDifficulty: string;
  memberPrice: number;
  nonMemberPrice: number;
  food: string;
  returnInfo: string;
  description?: string;
  dayDescriptions?: DayDescription[];
  notes?: string;
}

export const SECTIONS = [
  'Izletnička sekcija',
  'Visokogorska sekcija',
  'Planinarska sekcija Čevo',
  "Sekcija “Svaki tjedan – izlet jedan”"
];

export const TRANSPORT_METHODS = [
  'Vlastitim automobilima',
  'Autobusom',
  'Vlakom',
  'Pješke'
];

export const FITNESS_DIFFICULTIES = [
  { value: 'K1', label: 'K1 – Lagano; < 5h hoda' },
  { value: 'K2', label: 'K2 – Umjereno teško; 5–7h hoda' },
  { value: 'K3', label: 'K3 – Teško; 7–9h hoda' },
  { value: 'K4', label: 'K4 – Vrlo teško; > 9h hoda' }
];

export const TECHNICAL_DIFFICULTIES = [
  { value: 'T1', label: 'T1 – Nezahtjevno; hodnja, bez upotrebe ruku i pomagala' },
  { value: 'T2', label: 'T2 – Umjereno zahtjevno;  hodnja+povremena upotreba ruku, lagano penjanje ' },
  { value: 'T3', label: 'T3 – Zahtjevno; povremeno penjanje uz upotrebu ruku i pomagala(klinovi i čelična užad)' },
  { value: 'T4', label: 'T4 – Vrlo zahtjevno; duže i zahtjevnije dionice osiguranih putova, ozbiljnije penjanje' }
];
