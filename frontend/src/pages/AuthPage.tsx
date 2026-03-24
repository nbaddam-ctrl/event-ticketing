import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { motion, useReducedMotion } from 'framer-motion';
import { login as apiLogin, register as apiRegister } from '../services/attendeeApi';
import { useAuth } from '../contexts/AuthContext';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Input,
  Button,
  Alert,
  AlertDescription,
} from '../components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui';
import { LogIn, UserPlus, Ticket } from 'lucide-react';

export function AuthPage() {
  useDocumentTitle('Sign In');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: string } | null)?.from || '/';
  const prefersReducedMotion = useReducedMotion();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const authCall = mode === 'login' ? apiLogin : apiRegister;
      const result = await authCall({ email, password, displayName });
      login(result.user, result.token);
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-start justify-center pt-8 sm:pt-16">
      <motion.div
        className="w-full max-w-md space-y-6"
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError('')}>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="overflow-hidden">
          {/* Branded header */}
          <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-6 py-8 text-center text-primary-foreground">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Ticket className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome to EventTix</h1>
            <p className="mt-1 text-sm text-white/80">Sign in to purchase tickets and access your bookings</p>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'register')}>
            <CardHeader className="pb-3 pt-4">
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">
                  <LogIn className="mr-1.5 h-4 w-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1">
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Register
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="login">
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" loading={loading}>
                    Sign In
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    autoComplete="new-password"
                  />
                  <Input
                    label="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    required
                    autoComplete="name"
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" loading={loading}>
                    Create Account
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
}
