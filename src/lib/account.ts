import type { AssessmentInput, ScanSignals } from "@/lib/recommendation";

const ACCOUNTS_KEY = "lumaroutine.accounts.v1";
const SESSION_KEY = "lumaroutine.session.v1";

export interface PublicAccount {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface ScanHistoryEntry {
  id: string;
  savedAt: string;
  capturedAt: string;
  scan: ScanSignals;
  assessment: AssessmentInput;
}

interface StoredAccount extends PublicAccount {
  passwordHash: string;
  passwordSalt: string;
  scans: ScanHistoryEntry[];
}

interface AccountStore {
  accounts: StoredAccount[];
}

interface SessionStore {
  accountId: string;
}

export interface AuthResult {
  account: PublicAccount;
  scans: ScanHistoryEntry[];
}

export async function signUpForLocalAccount(input: { name: string; email: string; password: string }): Promise<AuthResult> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password.trim();

  if (name.length < 2) throw new Error("Add your name so your account feels personal.");
  if (!isEmail(email)) throw new Error("Enter a valid email address.");
  if (password.length < 8) throw new Error("Use at least 8 characters for your password.");

  const store = loadAccountStore();
  if (store.accounts.some((account) => account.email === email)) {
    throw new Error("An account already exists for that email.");
  }

  const passwordSalt = createId("salt");
  const account: StoredAccount = {
    id: createId("acct"),
    email,
    name,
    createdAt: new Date().toISOString(),
    passwordSalt,
    passwordHash: await hashPassword(password, passwordSalt),
    scans: [],
  };

  store.accounts.unshift(account);
  saveAccountStore(store);
  saveSession(account.id);

  return { account: toPublicAccount(account), scans: account.scans };
}

export async function signInToLocalAccount(input: { email: string; password: string }): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  const store = loadAccountStore();
  const account = store.accounts.find((item) => item.email === email);

  if (!account || account.passwordHash !== await hashPassword(password, account.passwordSalt)) {
    throw new Error("Email or password did not match.");
  }

  saveSession(account.id);
  return { account: toPublicAccount(account), scans: account.scans };
}

export function getCurrentLocalAccount(): AuthResult | null {
  const session = loadSession();
  if (!session) return null;

  const account = loadAccountStore().accounts.find((item) => item.id === session.accountId);
  if (!account) {
    clearLocalSession();
    return null;
  }

  return { account: toPublicAccount(account), scans: account.scans };
}

export function clearLocalSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Optional local convenience state.
  }
}

export function saveScanForCurrentAccount(scan: ScanSignals, assessment: AssessmentInput): ScanHistoryEntry | null {
  const session = loadSession();
  if (!session) return null;

  const store = loadAccountStore();
  const account = store.accounts.find((item) => item.id === session.accountId);
  if (!account) return null;

  const entry: ScanHistoryEntry = {
    id: createId("scan"),
    savedAt: new Date().toISOString(),
    capturedAt: scan.capturedAt ?? new Date().toISOString(),
    scan: sanitizeScan(scan),
    assessment,
  };

  const withoutDuplicate = account.scans.filter((item) => item.scan.sessionId !== scan.sessionId);
  account.scans = [entry, ...withoutDuplicate].slice(0, 24);
  saveAccountStore(store);
  return entry;
}

export function getCurrentAccountScans(): ScanHistoryEntry[] {
  return getCurrentLocalAccount()?.scans ?? [];
}

export function deleteCurrentAccountScan(scanId: string): ScanHistoryEntry[] {
  const session = loadSession();
  if (!session) return [];

  const store = loadAccountStore();
  const account = store.accounts.find((item) => item.id === session.accountId);
  if (!account) return [];

  account.scans = account.scans.filter((scan) => scan.id !== scanId);
  saveAccountStore(store);
  return account.scans;
}

export function clearCurrentAccountScans(): ScanHistoryEntry[] {
  const session = loadSession();
  if (!session) return [];

  const store = loadAccountStore();
  const account = store.accounts.find((item) => item.id === session.accountId);
  if (!account) return [];

  account.scans = [];
  saveAccountStore(store);
  return account.scans;
}

export function deleteCurrentLocalAccount() {
  const session = loadSession();
  if (!session) {
    clearLocalSession();
    return;
  }

  const store = loadAccountStore();
  store.accounts = store.accounts.filter((account) => account.id !== session.accountId);
  saveAccountStore(store);
  clearLocalSession();
}

function loadAccountStore(): AccountStore {
  if (typeof localStorage === "undefined") return { accounts: [] };

  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return { accounts: [] };
    const parsed = JSON.parse(raw) as Partial<AccountStore>;
    return { accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [] };
  } catch {
    return { accounts: [] };
  }
}

function saveAccountStore(store: AccountStore) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(store));
  } catch {
    // Local account history is a convenience layer and should not block scans.
  }
}

function saveSession(accountId: string) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ accountId }));
  } catch {
    // Sign-in can still complete for this page load through React state.
  }
}

function loadSession(): SessionStore | null {
  if (typeof localStorage === "undefined") return null;

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionStore>;
    return parsed.accountId ? { accountId: parsed.accountId } : null;
  } catch {
    return null;
  }
}

function toPublicAccount(account: StoredAccount): PublicAccount {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    createdAt: account.createdAt,
  };
}

function sanitizeScan(scan: ScanSignals): ScanSignals {
  return {
    ...scan,
    imageReference: null,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function hashPassword(password: string, salt: string) {
  const payload = `${salt}:${password}`;
  if (globalThis.crypto?.subtle) {
    const data = new TextEncoder().encode(payload);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  let hash = 0;
  for (let index = 0; index < payload.length; index += 1) {
    hash = Math.imul(31, hash) + payload.charCodeAt(index) | 0;
  }
  return `fallback-${Math.abs(hash)}`;
}

function createId(prefix: string) {
  if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
