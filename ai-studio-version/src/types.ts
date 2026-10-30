export type Language = 'odia' | 'hindi' | 'bengali' | 'tamil';

export type Category = 
  | 'safety'       // Machine or Safety
  | 'wages'        // Wages & Overtime
  | 'harassment'   // Harassment or Discrimination
  | 'hostel'       // Hostel & Canteen
  | 'supervisor';  // Supervisor Conduct

export type TicketStatus = 
  | 'new'
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'resolved'
  | 'escalated';

export interface Factory {
  id: string;
  name: string;
  location: string;
  workersCount: number;
}

export interface Supervisor {
  id: string;
  name: string;
  factoryId: string;
  department: string;
  resolvedCount: number;
  totalAssigned: number;
  avgTimeHours: number;
  ratings: number[]; // 1-5 ratings
}

export interface Ticket {
  id: number;
  factoryId: string;
  lineOrArea: string;
  category: Category;
  originalVoiceText: string;
  translatedText: string;
  language: Language;
  status: TicketStatus;
  createdAt: string; // ISO string
  deadlineHours: number; // 24 for safety, 48 for normal
  remainingHours: number;
  assignedSupervisorId: string | null;
  reporterWorkerId: string; // Anonymous, e.g. 'W123'
  isSensitive: boolean; // Wages, harassment, supervisor are strictly sensitive
  isSafetyVerified: boolean;
  isFirstReport: boolean;
  workerConfirmed: boolean;
  workerRating?: number;
  supervisorNotes?: string;
  grievanceNotes?: string[];
  resolvedAt?: string;
}

export interface SafetyReward {
  id: string;
  workerId: string; // Anonymous e.g. 'W123'
  ticketId: number;
  factoryId: string;
  hazardDescription: string;
  points: number;
  amountInr: number;
  status: 'pending' | 'verified_and_awarded';
  awardedAt: string;
}

export interface InformationTopic {
  id: string;
  titleKey: string;
  titles: Record<Language, string>;
  contents: Record<Language, string>;
  englishSummary: string;
}
