import { useState } from 'react';
import { v } from '../constants/tokens';
import { LxBtn } from './primitives';

function fieldStyle() {
  return {
    width: '100%',
    fontFamily: v.fontBody,
    fontSize: 15,
    color: v.ink,
    background: v.surfaceSunken,
    border: `1px solid ${v.border}`,
    borderRadius: 8,
    padding: '11px 14px',
    outline: 'none',
    boxSizing: 'border-box',
  };
}

export function ChangePasswordScreen({ navigate }) {
  const [form, setForm] = useState({
    currentPassword: '',
    nextPassword: '',
    confirmPassword: '',
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const isValid =
    form.currentPassword.length >= 8 &&
    form.nextPassword.length >= 8 &&
    form.nextPassword === form.confirmPassword;

  const handleSave = () => {
    if (!isValid) return;
    navigate('settings');
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 32px', background: v.base }}>
      <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            current password
          </label>
          <input type="password" value={form.currentPassword} onChange={(e) => update('currentPassword', e.target.value)} placeholder="current password" style={fieldStyle()} />
        </div>

        <div>
          <label style={{ display: 'block', fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            new password
          </label>
          <input type="password" value={form.nextPassword} onChange={(e) => update('nextPassword', e.target.value)} placeholder="at least 8 characters" style={fieldStyle()} />
        </div>

        <div>
          <label style={{ display: 'block', fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            confirm password
          </label>
          <input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="repeat your new password" style={fieldStyle()} />
        </div>

        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: isValid || form.confirmPassword.length === 0 ? v.ink3 : v.errorText }}>
          {form.confirmPassword.length === 0 ? 'new password must match confirmation' : isValid ? 'password looks good' : 'passwords do not match'}
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
          <LxBtn variant="ghost" onClick={() => navigate('settings')} style={{ flex: 1 }}>
            cancel
          </LxBtn>
          <LxBtn variant="primary" onClick={handleSave} disabled={!isValid} style={{ flex: 1 }}>
            update password
          </LxBtn>
        </div>
      </div>
    </div>
  );
}
