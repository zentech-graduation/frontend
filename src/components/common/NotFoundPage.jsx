import { Link } from 'react-router-dom';

import { ROUTES } from '@/config/constants';

export default function NotFoundPage() {
  return (
    <main className="not-found-page">
      <p>404</p>
      <h1>That page does not exist.</h1>
      <Link to={ROUTES.LOGIN}>Back to authentication</Link>
    </main>
  );
}
