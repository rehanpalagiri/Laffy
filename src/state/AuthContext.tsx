import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import {
  clearLocalSession,
  deleteCurrentAccountScan,
  getCurrentAccountScans,
  getCurrentLocalAccount,
  signInToLocalAccount,
  signUpForLocalAccount,
  type PublicAccount,
  type ScanHistoryEntry,
} from "@/lib/account";

interface AuthContextValue {
  account: PublicAccount | null;
  scans: ScanHistoryEntry[];
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signOut: () => void;
  refreshScans: () => void;
  deleteScan: (scanId: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = getCurrentLocalAccount();
  const [account, setAccount] = useState<PublicAccount | null>(initial?.account ?? null);
  const [scans, setScans] = useState<ScanHistoryEntry[]>(initial?.scans ?? []);

  const value = useMemo<AuthContextValue>(() => ({
    account,
    scans,
    signUp: async (input) => {
      const result = await signUpForLocalAccount(input);
      setAccount(result.account);
      setScans(result.scans);
    },
    signIn: async (input) => {
      const result = await signInToLocalAccount(input);
      setAccount(result.account);
      setScans(result.scans);
    },
    signOut: () => {
      clearLocalSession();
      setAccount(null);
      setScans([]);
    },
    refreshScans: () => {
      setScans(getCurrentAccountScans());
    },
    deleteScan: (scanId) => {
      setScans(deleteCurrentAccountScan(scanId));
    },
  }), [account, scans]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
