import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — FraudGuard" }] }),
  component: AuthPage,
});

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function Divider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border/60" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
      </div>
    </div>
  );
}

function PasswordInput({
  id, value, onChange, placeholder, required, minLength,
}: {
  id: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["bg-danger", "bg-danger", "bg-warning", "bg-warning", "bg-success"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : "bg-muted"}`} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-2">
        <span className={score >= 3 ? "text-success" : "text-warning"}>{labels[score]}</span>
      </p>
      <ul className="grid grid-cols-2 gap-1">
        {checks.map((c) => (
          <li key={c.label} className={`flex items-center gap-1 text-xs ${c.pass ? "text-success" : "text-muted-foreground"}`}>
            <CheckCircle2 className={`h-3 w-3 ${c.pass ? "opacity-100" : "opacity-30"}`} />
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<"tabs" | "forgot-password">("tabs");
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/predict" });
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/predict`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) {
        if (error.message.toLowerCase().includes("provider") || error.message.toLowerCase().includes("not enabled")) {
          toast.error(
            "Google Sign-in is not enabled. Please enable the Google provider in your Supabase dashboard under Authentication → Providers.",
            { duration: 6000 }
          );
        } else {
          toast.error(error.message);
        }
      } else if (!data.url) {
        toast.error("Google Sign-in requires the Google OAuth provider to be configured in Supabase.");
      }
    } catch (err) {
      toast.error("Failed to initiate Google Sign-in. Check your Supabase configuration.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">FraudGuard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to detect fraud in real time.</p>
        </div>

        {view === "tabs" ? (
          <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
            {/* Google Sign-in Section */}
            <div className="space-y-3">
              <Button
                id="btn-google-signin"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                {googleLoading ? "Redirecting to Google..." : "Sign in with Google"}
              </Button>

              {/* Info note about Google setup */}
              <p className="text-xs text-center text-muted-foreground">
                Google Sign-in requires{" "}
                <a
                  href="https://supabase.com/dashboard/project/dujtdvjkbjqhfgqzxgiu/auth/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Google provider to be enabled
                </a>{" "}
                in Supabase.
              </p>
            </div>

            <Divider />

            <Tabs defaultValue="signin">
              <TabsList className="mb-6 grid grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <SignInForm onForgotPassword={() => setView("forgot-password")} />
              </TabsContent>
              <TabsContent value="signup">
                <SignUpForm />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <ForgotPasswordForm onBack={() => setView("tabs")} />
        )}
      </div>
    </div>
  );
}

function SignInForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/predict" });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="si-email">Email</Label>
        <Input
          id="si-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="si-pw">Password</Label>
          <Button type="button" variant="link" size="sm" className="px-0 font-normal text-xs h-auto" onClick={onForgotPassword}>
            Forgot password?
          </Button>
        </div>
        <PasswordInput id="si-pw" value={password} onChange={setPassword} required />
      </div>
      <Button id="btn-signin" type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {busy ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/predict`,
        data: { display_name: name },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! Check your email to confirm.");
    navigate({ to: "/predict" });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="su-name">Display name</Label>
        <Input id="su-name" required placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-email">Email</Label>
        <Input
          id="su-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-pw">Password</Label>
        <PasswordInput id="su-pw" value={password} onChange={setPassword} required minLength={6} />
        <PasswordStrength password={password} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-confirm-pw">Confirm password</Label>
        <PasswordInput id="su-confirm-pw" value={confirmPassword} onChange={setConfirmPassword} required minLength={6} />
        {confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-danger">Passwords do not match</p>
        )}
        {confirmPassword && password === confirmPassword && confirmPassword.length >= 6 && (
          <p className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Passwords match</p>
        )}
      </div>
      <Button id="btn-signup" type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {busy ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm text-center">
        <div className="mb-4 flex justify-center">
          <div className="h-14 w-14 rounded-full bg-success/15 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2">Check your email</h2>
        <p className="text-sm text-muted-foreground mb-6">
          A password reset link has been sent to{" "}
          <span className="font-medium text-foreground">{email}</span>. Check your spam folder if you don't see it.
        </p>
        <Button variant="outline" className="w-full" onClick={onBack}>
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Reset Password</h2>
        <p className="text-sm text-muted-foreground mt-1">Enter your email and we'll send you a reset link.</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {busy ? "Sending link..." : "Send reset link"}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
          Back to sign in
        </Button>
      </form>
    </div>
  );
}
