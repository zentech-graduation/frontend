import { Outlet } from 'react-router-dom';

/**
 * MainLayout — stub.
 * Replace with actual nav/sidebar/footer when ready.
 */
function MainLayout() {
  return (
    <div>
      <header style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
        <strong>Luvax</strong>
      </header>

      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
