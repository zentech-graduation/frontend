import { useNavigate } from 'react-router-dom';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-8xl font-bold text-muted-foreground">404</h1>
      <p className="text-xl text-muted-foreground">Page not found</p>
      <button
        onClick={() => navigate(-1)}
        className="mt-4 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Go Back
      </button>
    </div>
  );
}

export default NotFoundPage;
