import { Link } from 'react-router-dom';

import AuthBrandPanel from '@/components/auth/AuthBrandPanel';
import { ROUTES } from '@/config/constants';

export default function AuthPageLayout({ children }) {
  return (
    <main className="auth-page auth-page--standalone">
      <AuthBrandPanel />
      <section className="auth-page__overlay">
        <div className="auth-page__content">
          <div className="auth-modal-shell">
            <Link to={ROUTES.HOME} className="auth-modal-close" aria-label="Back to home">
              x
            </Link>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
