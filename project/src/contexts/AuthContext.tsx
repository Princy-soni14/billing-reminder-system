import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "../firebase";

type Role = "admin" | "user" | null;

type AuthState = {
  loading: boolean;
  user: FirebaseUser | null;
  role: Role;
  companyId?: string;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState>({
  loading: true,
  user: null,
  role: null,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [companyId, setCompanyId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setRole(null);
        setCompanyId(undefined);
        setLoading(false);
        return;
      }

      // Refresh token to get latest custom claims
      const res = await u.getIdTokenResult(true);
      const claims = res.claims as any;

      console.log(
        "Auth Debug → user:",
        u?.email,
        "role:",
        claims.role,
        "companyId:",
        claims.companyId
      );

      setRole((claims.role as Role) ?? null);
      setCompanyId(claims.companyId);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const value = useMemo(
    () => ({
      loading,
      user,
      role,
      companyId,
      logout: () => signOut(auth),
    }),
    [loading, user, role, companyId]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const context = useContext(Ctx);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
