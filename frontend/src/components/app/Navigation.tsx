import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Ticket, Menu, X, LogIn, LogOut, LayoutDashboard, Shield, BookOpen, UserCheck, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { NotificationBell } from './NotificationBell';

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const isLoggedIn = !!user;
  const userHasRole = (role: string) => !!user?.roles.includes(role);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navItems = [
    { to: '/', label: 'Events', icon: <Ticket className="h-4 w-4" />, show: () => true },
    { to: '/auth', label: 'Auth', icon: <LogIn className="h-4 w-4" />, show: () => !isLoggedIn },
    { to: '/my-bookings', label: 'My Bookings', icon: <BookOpen className="h-4 w-4" />, show: () => isLoggedIn },
    {
      to: '/organizer',
      label: 'Organizer',
      icon: <LayoutDashboard className="h-4 w-4" />,
      show: () => isLoggedIn && userHasRole('organizer'),
    },
    {
      to: '/request-organizer',
      label: 'Become Organizer',
      icon: <UserCheck className="h-4 w-4" />,
      show: () => isLoggedIn && !userHasRole('organizer') && !userHasRole('admin'),
    },
    {
      to: '/admin/organizer-requests',
      label: 'Approvals',
      icon: <Shield className="h-4 w-4" />,
      show: () => isLoggedIn && userHasRole('admin'),
    },
  ];

  function handleLogout() {
    logout();
    setMobileOpen(false);
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground transition-colors hover:text-primary">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Ticket className="h-4.5 w-4.5" />
          </div>
          <span className="hidden sm:inline">EventTix</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navItems.filter((n) => n.show()).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground',
                location.pathname === item.to
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          {user && (
            <>
              <NotificationBell />
              <span className="ml-3 text-xs text-muted-foreground">{user.email}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>

        {/* Mobile menu button */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t bg-background px-4 py-3 md:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-1">
            {navItems.filter((n) => n.show()).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground',
                  location.pathname === item.to
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            {user && (
              <>
                <div className="px-3 py-1">
                  <NotificationBell />
                </div>
                <span className="px-3 py-1 text-xs text-muted-foreground">Signed in as {user.email}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
