import { create } from 'zustand';
import type { UserProfile, Job, ATSResult, MatchSession, Page } from '../types';
import * as db from '../services/database';

const ENV_GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AppState {
  // Auth
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;

  // Navigation
  currentPage: Page;
  setCurrentPage: (page: Page) => void;

  // AI API
  aiApiKey: string;
  setAiApiKey: (key: string) => void;

  // User Profile
  profile: UserProfile;
  setProfile: (profile: Partial<UserProfile>) => void;
  loadProfile: () => Promise<void>;
  saveProfileToDB: () => Promise<void>;
  cvUploaded: boolean;
  setCvUploaded: (uploaded: boolean) => void;

  // Jobs
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;

  // ATS
  atsResult: ATSResult | null;
  setAtsResult: (result: ATSResult | null) => void;

  // Match Sessions
  matchSessions: MatchSession[];
  setMatchSessions: (sessions: MatchSession[]) => void;
  addMatchSession: (session: MatchSession) => void;
  updateMatchSession: (id: string, updates: Partial<MatchSession>) => void;
  loadSessions: () => Promise<void>;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;

  // Applications
  appliedJobs: string[];
  setAppliedJobs: (jobs: string[]) => void;
  addAppliedJob: (jobId: string) => void;
  loadAppliedJobs: () => Promise<void>;

  // Loading
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const defaultProfile: UserProfile = {
  name: '',
  email: '',
  phone: '',
  location: '',
  title: '',
  summary: '',
  skills: [],
  experience: [],
  education: [],
  certifications: [],
  languages: [],
  linkedIn: '',
  portfolio: '',
  rawCvText: '',
};

export const useStore = create<AppState>((set, get) => ({
  // Auth
  user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('auth_user'),
  setUser: (user) => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
    set({ user, isAuthenticated: !!user });
  },
  logout: () => {
    localStorage.removeItem('auth_user');
    set({
      user: null,
      isAuthenticated: false,
      profile: defaultProfile,
      matchSessions: [],
      appliedJobs: [],
      cvUploaded: false,
      currentPage: 'dashboard',
    });
  },

  // Navigation
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),

  // AI API
  aiApiKey: localStorage.getItem('ai_api_key') || localStorage.getItem('gemini_api_key') || ENV_GOOGLE_API_KEY || '',
  setAiApiKey: (key) => {
    localStorage.setItem('ai_api_key', key);
    localStorage.setItem('gemini_api_key', key);
    set({ aiApiKey: key });
  },

  // Profile
  profile: defaultProfile,
  setProfile: (updates) =>
    set((state) => {
      const newProfile = { ...state.profile, ...updates };
      return { profile: newProfile };
    }),
  loadProfile: async () => {
    const user = get().user;
    if (!user) return;
    const profile = await db.getProfile(user.id);
    if (profile) {
      set({ profile, cvUploaded: !!profile.rawCvText });
    }
  },
  saveProfileToDB: async () => {
    const user = get().user;
    const profile = get().profile;
    if (!user) return;
    await db.saveProfile(user.id, profile);
  },
  cvUploaded: false,
  setCvUploaded: (uploaded) => set({ cvUploaded: uploaded }),

  // Jobs
  jobs: [],
  setJobs: (jobs) => set({ jobs }),
  selectedJob: null,
  setSelectedJob: (job) => set({ selectedJob: job }),

  // ATS
  atsResult: null,
  setAtsResult: (result) => set({ atsResult: result }),

  // Match Sessions
  matchSessions: [],
  setMatchSessions: (sessions) => set({ matchSessions: sessions }),
  addMatchSession: async (session) => {
    const user = get().user;
    set((state) => ({ matchSessions: [...state.matchSessions, session] }));
    if (user) {
      await db.saveSession(user.id, session);
    }
  },
  updateMatchSession: async (id, updates) => {
    const user = get().user;
    set((state) => {
      const sessions = state.matchSessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      );
      return { matchSessions: sessions };
    });
    if (user) {
      const session = get().matchSessions.find((s) => s.id === id);
      if (session) {
        await db.saveSession(user.id, session);
      }
    }
  },
  loadSessions: async () => {
    const user = get().user;
    if (!user) return;
    const sessions = await db.getSessions(user.id);
    set({ matchSessions: sessions });
  },
  activeSessionId: null,
  setActiveSessionId: (id) => set({ activeSessionId: id }),

  // Applications
  appliedJobs: [],
  setAppliedJobs: (jobs) => set({ appliedJobs: jobs }),
  addAppliedJob: async (jobId) => {
    const user = get().user;
    set((state) => ({ appliedJobs: [...state.appliedJobs, jobId] }));
    if (user) {
      await db.addAppliedJobToDB(user.id, jobId);
    }
  },
  loadAppliedJobs: async () => {
    const user = get().user;
    if (!user) return;
    const jobs = await db.getAppliedJobs(user.id);
    set({ appliedJobs: jobs });
  },

  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
