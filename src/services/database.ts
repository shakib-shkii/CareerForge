import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { UserProfile, MatchSession } from '../types';

interface UserRecord {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
}

interface ProfileRecord extends UserProfile {
  oduserId: string;
}

interface SessionRecord extends MatchSession {
  oduserId: string;
}

interface AppliedJobRecord {
  id: string;
  oduserId: string;
  jobId: string;
  appliedAt: string;
}

interface CareerForgeDB extends DBSchema {
  users: {
    key: string;
    value: UserRecord;
    indexes: { 'by-email': string };
  };
  profiles: {
    key: string;
    value: ProfileRecord;
    indexes: { 'by-userId': string };
  };
  sessions: {
    key: string;
    value: SessionRecord;
    indexes: { 'by-userId': string };
  };
  appliedJobs: {
    key: string;
    value: AppliedJobRecord;
    indexes: { 'by-userId': string };
  };
}

let db: IDBPDatabase<CareerForgeDB> | null = null;

export async function initDatabase(): Promise<IDBPDatabase<CareerForgeDB>> {
  if (db) return db;

  db = await openDB<CareerForgeDB>('careerforge-db', 1, {
    upgrade(database) {
      // Users store
      const userStore = database.createObjectStore('users', { keyPath: 'id' });
      userStore.createIndex('by-email', 'email', { unique: true });

      // Profiles store
      const profileStore = database.createObjectStore('profiles', { keyPath: 'oduserId' });
      profileStore.createIndex('by-userId', 'oduserId');

      // Sessions store
      const sessionStore = database.createObjectStore('sessions', { keyPath: 'id' });
      sessionStore.createIndex('by-userId', 'oduserId');

      // Applied Jobs store
      const appliedStore = database.createObjectStore('appliedJobs', { keyPath: 'id' });
      appliedStore.createIndex('by-userId', 'oduserId');
    },
  });

  return db;
}

// User Authentication
export async function createUser(email: string, password: string, name: string): Promise<string> {
  const database = await initDatabase();
  const existingUser = await database.getFromIndex('users', 'by-email', email);
  if (existingUser) {
    throw new Error('Email already exists');
  }

  const id = `user_${Date.now()}`;
  await database.add('users', {
    id,
    email,
    password, // In production, hash this!
    name,
    createdAt: new Date().toISOString(),
  });

  // Create default profile
  const defaultProfile: ProfileRecord = {
    oduserId: id,
    name,
    email,
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
  await database.add('profiles', defaultProfile);

  return id;
}

export async function loginUser(email: string, password: string): Promise<{ id: string; name: string; email: string } | null> {
  const database = await initDatabase();
  const user = await database.getFromIndex('users', 'by-email', email);
  if (!user || user.password !== password) {
    return null;
  }
  return { id: user.id, name: user.name, email: user.email };
}

export async function getUserById(id: string): Promise<{ id: string; name: string; email: string } | null> {
  const database = await initDatabase();
  const user = await database.get('users', id);
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email };
}

// Profile Management
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const database = await initDatabase();
  const profile = await database.get('profiles', userId);
  if (!profile) return null;
  const { oduserId, ...rest } = profile;
  return rest;
}

export async function saveProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  const database = await initDatabase();
  const existing = await database.get('profiles', userId);
  if (existing) {
    await database.put('profiles', { ...existing, ...profile, oduserId: userId });
  } else {
    const newProfile: ProfileRecord = {
      oduserId: userId,
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
      ...profile,
    };
    await database.add('profiles', newProfile);
  }
}

// Match Sessions
export async function getSessions(userId: string): Promise<MatchSession[]> {
  const database = await initDatabase();
  const all = await database.getAllFromIndex('sessions', 'by-userId', userId);
  return all.map(({ oduserId, ...rest }) => rest);
}

export async function saveSession(userId: string, session: MatchSession): Promise<void> {
  const database = await initDatabase();
  await database.put('sessions', { ...session, oduserId: userId });
}

export async function deleteSession(sessionId: string): Promise<void> {
  const database = await initDatabase();
  await database.delete('sessions', sessionId);
}

// Applied Jobs
export async function getAppliedJobs(userId: string): Promise<string[]> {
  const database = await initDatabase();
  const all = await database.getAllFromIndex('appliedJobs', 'by-userId', userId);
  return all.map((a) => a.jobId);
}

export async function addAppliedJobToDB(userId: string, jobId: string): Promise<void> {
  const database = await initDatabase();
  await database.add('appliedJobs', {
    id: `applied_${Date.now()}`,
    oduserId: userId,
    jobId,
    appliedAt: new Date().toISOString(),
  });
}
