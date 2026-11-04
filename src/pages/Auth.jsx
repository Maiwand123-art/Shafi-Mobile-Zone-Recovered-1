import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { requireSupabase } from "../lib/supabase";

async function startGoogleLogin(setError, setBusy) {
  setError("");
  setBusy(true);

  try {
    const client = requireSupabase();
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/account`,
      },
    });

    if (error) throw error;
  } catch (error) {
    setError(error.message || "Google sign-in failed.");
    setBusy(false);
  }
}

function GoogleButton({ busy, onClick }) {
  return (
    <button
      type="button"
      className="button"
      onClick={onClick}
      disabled={busy}
    >
      {busy ? "Connecting to Google..." : "Continue with Google"}
    </button>
  );
}

function AuthDivider() {
  return (
    <div className="muted" style={{ textAlign: "center", margin: "14px 0" }}>
      OR CONTINUE WITH EMAIL
    </div>
  );
}

export function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      await signIn(email, password);
      nav("/account");
    } catch (x) {
      setError(x.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame
      title="Welcome back"
      subtitle="Sign in to manage your mobile requests."
    >
      <GoogleButton
        busy={googleBusy}
        onClick={() => startGoogleLogin(setError, setGoogleBusy)}
      />

      <AuthDivider />

      <form onSubmit={submit} className="form-stack">
        <Field label="Email" type="email" value={email} set={setEmail} />

        <Field
          label="Password"
          type="password"
          value={password}
          set={setPassword}
        />

        {error && <p className="error">{error}</p>}

        <button className="button" disabled={busy || googleBusy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>

        <Link className="text-link" to="/forgot-password">
          Forgot password?
        </Link>

        <p className="muted">
          New here?{" "}
          <Link className="text-link" to="/signup">
            Create an account
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}

export function Signup() {
  const { signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNote("");

    try {
      await signUp({ name, email, password, phone });
      setNote("Account created. Check your email to confirm your account.");
    } catch (x) {
      setError(x.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame
      title="Create your account"
      subtitle="Join Shafi Mobile Zone to send requests and save phones."
    >
      <GoogleButton
        busy={googleBusy}
        onClick={() => startGoogleLogin(setError, setGoogleBusy)}
      />

      <AuthDivider />

      <form onSubmit={submit} className="form-stack">
        <Field label="Full name" value={name} set={setName} />

        <Field label="Email" type="email" value={email} set={setEmail} />

        <Field label="Phone (optional)" value={phone} set={setPhone} />

        <Field
          label="Password (minimum 8 characters)"
          type="password"
          value={password}
          set={setPassword}
        />

        {error && <p className="error">{error}</p>}
        {note && <p className="success">{note}</p>}

        <button className="button" disabled={busy || googleBusy}>
          {busy ? "Creating..." : "Create account"}
        </button>

        <p className="muted">
          Already registered?{" "}
          <Link className="text-link" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNote("");

    try {
      const client = requireSupabase();
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/account/password",
      });

      if (error) throw error;

      setNote("If the email exists, a password reset link has been sent.");
    } catch (x) {
      setError(x.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame
      title="Reset password"
      subtitle="We'll email you a secure reset link."
    >
      <form onSubmit={submit} className="form-stack">
        <Field label="Email" type="email" value={email} set={setEmail} />

        {error && <p className="error">{error}</p>}
        {note && <p className="success">{note}</p>}

        <button className="button" disabled={busy}>
          {busy ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </AuthFrame>
  );
}

function Field({ label, type = "text", value, set }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => set(e.target.value)}
        required={label !== "Phone (optional)"}
        minLength={type === "password" ? 8 : undefined}
      />
    </label>
  );
}

function AuthFrame({ title, subtitle, children }) {
  return (
    <section className="auth-wrap">
      <div className="auth-card glass">
        <div className="eyebrow">SHAFI ACCOUNT</div>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
      </div>
    </section>
  );
}

