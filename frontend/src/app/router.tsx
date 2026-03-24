import { createBrowserRouter, Navigate, useLocation, Link } from 'react-router-dom';
import { EventListPage } from '../pages/EventListPage';
import { EventDetailsPage } from '../pages/EventDetailsPage';
import { AuthPage } from '../pages/AuthPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { MyBookingsPage } from '../pages/MyBookingsPage';
import { OrganizerDashboardPage } from '../pages/OrganizerDashboardPage';
import { RequestOrganizerPage } from '../pages/RequestOrganizerPage';
import { AdminOrganizerRequestsPage } from '../pages/AdminOrganizerRequestsPage';
import { useAuth } from '../contexts/AuthContext';
import { AppShell } from '../components/app/AppShell';
import { ErrorBoundary } from '../components/app/ErrorBoundary';
import { EmptyState, Button } from '../components/ui';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function RequireRole({ role, children }: { role: string; children: JSX.Element }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (!user.roles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RedirectIfAuth({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function NotFoundPage() {
  return (
    <EmptyState
      title="Page Not Found"
      description="The page you're looking for doesn't exist or has been moved."
      action={<Link to="/"><Button>Go Home</Button></Link>}
    />
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <ErrorBoundary><AppShell /></ErrorBoundary>,
    children: [
      { index: true, element: <EventListPage /> },
      { path: 'events/:eventId', element: <EventDetailsPage /> },
      {
        path: 'checkout/:eventId/:tierId',
        element: (
          <RequireAuth>
            <CheckoutPage />
          </RequireAuth>
        )
      },
      { path: 'auth', element: <RedirectIfAuth><AuthPage /></RedirectIfAuth> },
      {
        path: 'my-bookings',
        element: (
          <RequireAuth>
            <MyBookingsPage />
          </RequireAuth>
        )
      },
      {
        path: 'organizer',
        element: (
          <RequireRole role="organizer">
            <OrganizerDashboardPage />
          </RequireRole>
        )
      },
      {
        path: 'request-organizer',
        element: (
          <RequireAuth>
            <RequestOrganizerPage />
          </RequireAuth>
        )
      },
      {
        path: 'admin/organizer-requests',
        element: (
          <RequireRole role="admin">
            <AdminOrganizerRequestsPage />
          </RequireRole>
        )
      },
      { path: '*', element: <NotFoundPage /> }
    ]
  }
]);
