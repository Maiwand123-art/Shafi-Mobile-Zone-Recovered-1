import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured, requireSupabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(user) {
    if (!isSupabaseConfigured || !user) {
      setProfile(null);
      return;
    }

    const client = requireSupabase();
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile loading failed:", error.message);
      setProfile(null);
      return;
    }

    setProfile(data || null);
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) console.error("Session loading failed:", error.message);
      if (!mounted) return;

      setSession(data?.session || null);
      await loadProfile(data?.session?.user);

      if (mounted) setLoading(false);
    }).catch((error) => {
      console.error("Session initialization failed:", error);
      if (mounted) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        if (!mounted) return;
        setSession(next);
        setLoading(false);

        // Load profile outside the auth callback.
        Promise.resolve().then(() => {
          if (mounted) return loadProfile(next?.user);
        }).catch((error) => {
          console.error("Profile loading failed:", error);
        });
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signUp({ name, email, password, phone }) {
    const client = requireSupabase();

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone: phone || "" },
      },
    });

    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    const client = requireSupabase();

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async function signOut() {
    const client = requireSupabase();
    const { error } = await client.auth.signOut();

    if (error) throw error;
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        profile,
        loading,
        isAdmin: profile?.role === "admin",
        signUp,
        signIn,
        signOut,
        refreshProfile: () => loadProfile(session?.user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);