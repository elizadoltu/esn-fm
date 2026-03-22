import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { register } from '@/api/auth.api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function RegisterPage() {
  const { login: saveLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    display_name: '',
    invite_code: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await register(form);
      saveLogin(res.token, res.user);
      navigate(`/${res.user.username}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const fields: Array<{
    name: keyof typeof form;
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    autoComplete?: string;
  }> = [
    { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', required: true, autoComplete: 'email' },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Min 8 characters', required: true, autoComplete: 'new-password' },
    { name: 'username', label: 'Username', placeholder: 'lowercase_only', required: true, autoComplete: 'username' },
    { name: 'display_name', label: 'Display name', placeholder: 'Your full name', required: true },
    { name: 'invite_code', label: 'Invite code', placeholder: 'Leave empty if not required' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">ESN FM</h1>
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Fill in your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map(({ name, label, type = 'text', placeholder, required = false, autoComplete }) => (
                <div key={name} className="space-y-1.5">
                  <Label htmlFor={name}>{label}</Label>
                  <Input
                    id={name}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    value={form[name]}
                    onChange={handleChange}
                    required={required}
                    autoComplete={autoComplete}
                  />
                </div>
              ))}

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
