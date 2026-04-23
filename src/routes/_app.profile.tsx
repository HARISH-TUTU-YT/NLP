import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { UserCircle, Loader2, Eye, EyeOff, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — FraudGuard" }] }),
  component: ProfilePage,
});

function PasswordInput({ id, value, onChange, placeholder, required }: {
  id: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean;
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
        className="pr-10"
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [predCount, setPredCount] = useState<number | null>(null);
  const [memberSince, setMemberSince] = useState<string>("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const isGoogle = user?.app_metadata?.provider === "google";

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || "");
      setEmail(user.email || "");
      setMemberSince(
        user.created_at
          ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
          : ""
      );
      // Fetch prediction count
      supabase
        .from("predictions")
        .select("id", { count: "exact", head: true })
        .then(({ count }) => setPredCount(count ?? 0));
    }
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileBusy(true);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    });
    setProfileBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated!");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("New passwords do not match."); return; }
    if (newPassword.length < 6) { toast.error("New password must be at least 6 characters."); return; }

    setPasswordBusy(true);
    // Re-authenticate then update
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email ?? "",
      password: currentPassword,
    });
    if (signInError) {
      setPasswordBusy(false);
      toast.error("Current password is incorrect.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password changed successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      toast.error('Type "DELETE" to confirm account deletion.');
      return;
    }
    setDeleteBusy(true);
    // Delete all user predictions first, then sign out
    await supabase.from("predictions").delete().eq("user_id", user?.id ?? "");
    await signOut();
    toast.success("Account data cleared. Contact support to fully remove your account.");
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences.</p>
      </div>

      {/* Account card */}
      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm space-y-6">
        {/* Avatar + stats */}
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
            <UserCircle className="h-12 w-12" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold truncate">{user?.user_metadata?.display_name || "User"}</h2>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {memberSince && <span>Member since {memberSince}</span>}
              {predCount !== null && <span>· {predCount} prediction{predCount !== 1 ? "s" : ""}</span>}
              {isGoogle && (
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Google account
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Profile form */}
        <form onSubmit={saveProfile} className="space-y-4">
          <h3 className="font-semibold">Account Information</h3>
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email" className="text-muted-foreground">
              Email Address {isGoogle && <span className="text-xs">(managed by Google)</span>}
            </Label>
            <Input id="profile-email" value={email} readOnly disabled className="bg-muted" />
          </div>
          <Button type="submit" disabled={profileBusy}>
            {profileBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {profileBusy ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>

      {/* Change password — only shown for email users */}
      {!isGoogle && (
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <form onSubmit={changePassword} className="space-y-4">
            <h3 className="font-semibold">Change Password</h3>
            <div className="space-y-2">
              <Label htmlFor="current-pw">Current Password</Label>
              <PasswordInput id="current-pw" value={currentPassword} onChange={setCurrentPassword} required placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">New Password</Label>
              <PasswordInput id="new-pw" value={newPassword} onChange={setNewPassword} required placeholder="Min. 6 characters" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-pw">Confirm New Password</Label>
              <PasswordInput id="confirm-new-pw" value={confirmPassword} onChange={setConfirmPassword} required />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-danger">Passwords do not match</p>
              )}
            </div>
            <Button type="submit" disabled={passwordBusy}>
              {passwordBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {passwordBusy ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </div>
      )}

      {/* Danger zone */}
      <div className="rounded-xl border border-danger/30 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-danger" />
          <h3 className="font-semibold text-danger">Danger Zone</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Clearing your data will permanently delete all your predictions. This cannot be undone. Type <strong>DELETE</strong> to confirm.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Type DELETE to confirm"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            className="border-danger/30 focus-visible:ring-danger/30"
          />
          <Button
            variant="outline"
            className="border-danger/50 text-danger hover:bg-danger/10 shrink-0"
            disabled={deleteBusy}
            onClick={deleteAccount}
          >
            {deleteBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Clear data"}
          </Button>
        </div>
      </div>
    </div>
  );
}
