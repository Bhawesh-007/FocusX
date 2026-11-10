'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button, Input } from '@focus/ui';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { apiFetch, ApiClientError } from '@/lib/api';

type FieldName = 'name' | 'email' | 'password' | 'confirmPassword';
type FieldErrors = Partial<Record<FieldName, string>>;

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = 'Name is required.';
    if (!email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    else if (password.length > 72) next.password = 'Password must be 72 characters or fewer.';
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setPending(true);
    try {
      const timezone =
        typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

      await apiFetch<{ id: string; email: string; name: string | null }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, timezone }),
      });

      // Sign the new user in straight away.
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (result?.error) {
        router.push('/login');
        return;
      }

      router.push('/user/dashboard');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === 'EMAIL_IN_USE') setFieldErrors({ email: err.message });
        else setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setPending(false);
    }
  }

  const inputClass = (field: FieldName) =>
    fieldErrors[field] ? 'border-destructive focus-visible:ring-destructive' : undefined;

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur-sm"
      noValidate
    >
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium leading-none">
          Name
        </label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          aria-invalid={Boolean(fieldErrors.name)}
          className={inputClass('name')}
        />
        {fieldErrors.name ? <p className="text-sm text-destructive">{fieldErrors.name}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium leading-none">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-invalid={Boolean(fieldErrors.email)}
          className={inputClass('email')}
        />
        {fieldErrors.email ? <p className="text-sm text-destructive">{fieldErrors.email}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium leading-none">
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            aria-invalid={Boolean(fieldErrors.password)}
            className={`pr-10 ${inputClass('password') ?? ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        </div>
        {fieldErrors.password ? (
          <p className="text-sm text-destructive">{fieldErrors.password}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">
          Confirm password
        </label>
        <Input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          aria-invalid={Boolean(fieldErrors.confirmPassword)}
          className={inputClass('confirmPassword')}
        />
        {fieldErrors.confirmPassword ? (
          <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Create account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
