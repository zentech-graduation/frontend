import AuthBrandPanel from '@/components/auth/AuthBrandPanel';

export default function AuthPageLayout({ children }) {
  return (
    <main className="auth-page">
      <AuthBrandPanel />
      <section className="auth-page__content">{children}</section>
    </main>
  );
}
