import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/constants';
import { v } from '@/config/tokens';
import { LxBtn } from './primitives';
import { useAuthStore } from '@/store/useAuthStore';
import { useUpdateMyProfile } from '../hooks/useUsers';
import { useMediaUpload } from '../hooks/useMediaUpload';

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

export function EditProfileScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const updateProfile = useUpdateMyProfile();

  const [form, setForm] = useState({
    displayName: user?.displayName || user?.firstName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [formError, setFormError] = useState('');
  const { uploadMedia, isUploading } = useMediaUpload();
  const fileInputRef = useRef(null);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleAvatarFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('please choose an image file for your avatar.');
      return;
    }
    setFormError('');
    try {
      // The avatar goes through the same pre-signed upload as post media, then its
      // CDN URL is saved as the profile's avatarUrl.
      const result = await uploadMedia(file);
      const cdnUrl = result?.cdnUrl || result?.data?.cdnUrl;
      if (cdnUrl) update('avatarUrl', cdnUrl);
      else setFormError("we couldn't read the uploaded image. try again.");
    } catch (error) {
      setFormError(error?.uploadMessage || "we couldn't upload that image. try again.");
    }
  };

  const handleSave = () => {
    setFormError('');

    updateProfile.mutate(
      {
        displayName: form.displayName,
        username: form.username,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
      },
      {
        onSuccess: (data) => {
          const updatedUser = data?.data || data;
          setUser({ ...user, ...updatedUser });
          navigate(ROUTES.PROFILE);
        },
        onError: (error) => {
          setFormError(error.message || "we couldn't save your profile. try again.");
        },
      }
    );
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 32px', background: v.base }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarFile} style={{ display: 'none' }} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="upload a new avatar"
          disabled={isUploading}
          style={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            background: form.avatarUrl ? `url(${form.avatarUrl}) center/cover no-repeat` : v.avatar0,
            border: `2px solid ${v.border}`,
            cursor: isUploading ? 'default' : 'pointer',
            padding: 0,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', color: v.white, fontFamily: v.fontMono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {isUploading ? 'uploading' : 'change'}
          </span>
        </button>
        <LxBtn variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          {isUploading ? 'uploading...' : 'upload from device'}
        </LxBtn>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <label style={{ display: 'block', fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            or paste an image url
          </label>
          <input value={form.avatarUrl} onChange={(e) => update('avatarUrl', e.target.value)} placeholder="https://..." style={fieldStyle()} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520, margin: '0 auto' }}>
        <div>
          <label style={{ display: 'block', fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            display name
          </label>
          <input value={form.displayName} onChange={(e) => update('displayName', e.target.value)} placeholder="your name" style={fieldStyle()} />
        </div>

        <div>
          <label style={{ display: 'block', fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            username
          </label>
          <input value={form.username} onChange={(e) => update('username', e.target.value.toLowerCase())} placeholder="your.handle" style={fieldStyle()} />
        </div>

        <div>
          <label style={{ display: 'block', fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            bio
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => update('bio', e.target.value.slice(0, 160))}
            placeholder="say something real..."
            style={{ ...fieldStyle(), resize: 'none', minHeight: 96, lineHeight: 1.5 }}
          />
          <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, marginTop: 6, textAlign: 'right' }}>{160 - form.bio.length}</div>
        </div>

        {formError ? (
          <div style={{ fontFamily: v.fontBody, fontSize: 13, color: v.error }}>{formError}</div>
        ) : null}

        <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
          <LxBtn variant="ghost" onClick={() => navigate(ROUTES.PROFILE)} style={{ flex: 1 }} disabled={updateProfile.isPending}>
            cancel
          </LxBtn>
          <LxBtn variant="primary" onClick={handleSave} style={{ flex: 1 }} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'saving...' : 'save profile'}
          </LxBtn>
        </div>
      </div>
    </div>
  );
}
