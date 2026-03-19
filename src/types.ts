export type Screen = 'landing' | 'checker' | 'guidance' | 'checklist';

export interface UserData {
  age: number | null;
  hasPassport: boolean | null;
  isDamagedOrLost: boolean | null;
  isSpecialCategory: boolean | null; // OKU, children <= 13, students, hajj
}

export interface EligibilityResult {
  isEligibleOnline: boolean;
  reason?: string;
}
