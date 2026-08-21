import { useNavigate } from 'react-router-dom';
import { v } from '@/config/tokens';
import { ROUTES } from '@/config/constants';
import { LxBtn } from './primitives';

// [BLOCKED BY: BE auth/change-password endpoint]
// ApiConstants.Auth.CHANGE_PASSWORD ("/change-password") is declared as a
// path constant in the backend and listed in SecurityConfig's authenticated
// route matcher, but no controller method implements it (confirmed: no
// @PostMapping binds to it anywhere in AuthController/AuthApi as of this
// fix). This form stays disabled until that endpoint ships — it must not
// call a route that does not exist.
export function ChangePasswordScreen() {
  const navigate = useNavigate();
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 32px', background: v.base }}>
      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink2, lineHeight: 1.5 }}>
          changing your password isn't available yet. check back soon.
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
          <LxBtn variant="ghost" onClick={() => navigate(ROUTES.SETTINGS)} style={{ flex: 1 }}>
            back to settings
          </LxBtn>
          <LxBtn variant="primary" disabled style={{ flex: 1 }}>
            coming soon
          </LxBtn>
        </div>
      </div>
    </div>
  );
}
