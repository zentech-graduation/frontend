import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="not-found-page">
      <p>404</p>
      <h1>That page does not exist.</h1>
      <Link to="/login">Back to authentication</Link>
    </main>
  );
}
