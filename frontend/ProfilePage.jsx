import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/authApi";
import { PageHeader } from "../components/common/PageHeader";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { FieldGroup, TextInput, FieldRow } from "../components/ui/FormFields";
import { useToast } from "../context/ToastContext";
import { getErrorMessage, getFieldErrors } from "../utils/errorUtils";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [profileForm, setProfileForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "" });
  const [pwError, setPwError] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileErrors({});
    try {
      const res = await authApi.updateMe(profileForm);
      setUser(res.data.data);
      toast.success("Profile updated.");
    } catch (err) {
      setProfileErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setSavingPw(true);
    setPwError("");
    try {
      await authApi.changePassword(pwForm);
      setPwForm({ current_password: "", new_password: "" });
      toast.success("Password changed.");
    } catch (err) {
      setPwError(getErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  }

  if (!user) return null;

  return (
    <div className="page-container">
      <PageHeader title="My profile" subtitle="Manage your personal details and security." />

      <div className="flex-col gap-4" style={{ maxWidth: 480 }}>
        <div className="card card-pad">
          <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
            <Avatar name={user.name} size="lg" />
            <div className="flex-col">
              <strong>{user.name}</strong>
              <span className="text-muted text-sm">{user.email} · {user.role}</span>
            </div>
          </div>
          <form onSubmit={handleProfileSubmit}>
            <FieldGroup label="Full name" error={profileErrors.name}>
              <TextInput value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="Phone" error={profileErrors.phone}>
              <TextInput value={profileForm.phone || ""} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+1 555 0100" />
            </FieldGroup>
            <Button type="submit" loading={savingProfile}>Save profile</Button>
          </form>
        </div>

        <div className="card card-pad">
          <h3 style={{ marginBottom: 14 }}>Change password</h3>
          {pwError && <div className="alert-banner alert-error">{pwError}</div>}
          <form onSubmit={handlePasswordSubmit}>
            <FieldGroup label="Current password" required>
              <TextInput
                type="password"
                required
                value={pwForm.current_password}
                onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
              />
            </FieldGroup>
            <FieldGroup label="New password" required hint="At least 8 characters.">
              <TextInput
                type="password"
                required
                minLength={8}
                value={pwForm.new_password}
                onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
              />
            </FieldGroup>
            <Button type="submit" loading={savingPw}>Update password</Button>
          </form>
        </div>
      </div>
    </div>
  );
}