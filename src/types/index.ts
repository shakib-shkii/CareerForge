export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: string[];
  languages: string[];
  linkedIn: string;
  portfolio: string;
  rawCvText: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  year: string;
  gpa?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  posted: string;
  matchScore?: number;
  applied?: boolean;
  source?: string;
  applyUrl?: string;
  employerLogo?: string;
}

export interface ATSResult {
  overallScore: number;
  keywordMatch: number;
  formattingScore: number;
  sectionScore: number;
  suggestions: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  detailedFeedback: {
    category: string;
    score: number;
    feedback: string;
  }[];
}

export interface TailoredResume {
  content: string;
  coverLetter: string;
  changes: string[];
  matchScoreBefore: number;
  matchScoreAfter: number;
}

export interface MatchSession {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  currentScore: number;
  targetScore: number;
  suggestions: string[];
  appliedSuggestions: string[];
  tailoredResume: string;
  tailoredCoverLetter: string;
  status: 'in_progress' | 'ready' | 'applied';
}

export type Page = 'dashboard' | 'profile' | 'jobs' | 'tailor' | 'ats' | 'match-session' | 'connectors' | 'applications';
