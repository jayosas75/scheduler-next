export type CategoryKey = 'health' | 'work' | 'growth' | 'relations' | 'admin' | 'misc';

export interface CategoryInfo {
  label: string;
  color: string;
  text: string;
  border: string;
  hex: string;
}

export const CATEGORIES: Record<CategoryKey, CategoryInfo> = {
  health: { label: 'Health', color: 'bg-cyan-400', text: 'text-cyan-400', border: 'border-cyan-400', hex: '#22d3ee' },
  work: { label: 'Work', color: 'bg-fuchsia-400', text: 'text-fuchsia-400', border: 'border-fuchsia-400', hex: '#e879f9' },
  growth: { label: 'Growth', color: 'bg-[#39ff14]', text: 'text-[#39ff14]', border: 'border-[#39ff14]', hex: '#39ff14' },
  relations: { label: 'Relationships', color: 'bg-yellow-400', text: 'text-yellow-400', border: 'border-yellow-400', hex: '#facc15' },
  admin: { label: 'Life Admin', color: 'bg-blue-400', text: 'text-blue-400', border: 'border-blue-400', hex: '#60a5fa' },
  misc: { label: 'Misc', color: 'bg-white', text: 'text-white', border: 'border-white', hex: '#ffffff' }
};

export interface Segment {
  label: string;
  category: string;
  offset: number;
}

export interface TimeSlot {
  time: string;
  label: string;
  category: string;
  deleted?: boolean;
  segments?: Segment[];
}

export type RecurrenceRule = 'daily' | 'weekly' | 'monthly' | null;
