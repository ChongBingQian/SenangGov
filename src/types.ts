export type Screen = 'lobby' | 'passport_landing' | 'passport_checker' | 'passport_guidance' | 'passport_checklist' | 'roadtax_landing' | 'roadtax_checker' | 'roadtax_result' | 'license_landing' | 'license_checker' | 'license_result' | 'ai_assistant';

export type Service = 'passport' | 'roadtax' | 'license';

export interface UserData {
  age: number | null;
  hasPassport: boolean | null;
  isDamagedOrLost: boolean | null;
  isSpecialCategory: boolean | null; // OKU, children <= 13, students, hajj
}

export interface RoadTaxData {
  hasInsurance: boolean | null;
  needsInspection: 'yes' | 'no' | 'not_sure' | null;
  isBlacklisted: 'yes' | 'no' | 'not_sure' | null;
  hasRequiredInfo: boolean | null;
}

export interface LicenseData {
  type: 'CDL' | 'PDL' | 'LDL' | 'Vocational' | null;
  expiryStatus: 'valid' | 'expired_under_3y' | 'expired_over_3y' | null;
  renewalDuration: number | null;
}

export interface EligibilityResult {
  isEligibleOnline: boolean;
  reason?: string;
  status?: 'ready' | 'blocked' | 'pending';
  nextStep?: string;
}
