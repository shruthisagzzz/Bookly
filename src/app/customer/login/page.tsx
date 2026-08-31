'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerLogin() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    const endpoint = mode === 'login' ? '/api/customer/auth/login' : '/api/customer/auth/register';
    const body = mode === 'login' ? { email: form.email, password: form.password } : form;
    const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) { setError(d.error || 'Unable to continue'); setBusy(false); return; }
    router.replace('/customer');
  };

  return <main className="login-shell"><form className="login-card stack" onSubmit={submit}>
    <div><a className="brand" href="/">Bookly<span>.</span></a><h1>{mode === 'login' ? 'Customer sign in' : 'Create your account'}</h1><p className="muted">{mode === 'login' ? 'See your bookings and cancel upcoming appointments.' : 'Keep all your Bookly appointments in one place.'}</p></div>
    {error && <div className="alert">{error}</div>}
    {mode === 'register' && <><div className="field"><label>Name</label><input required minLength={2} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div><div className="field"><label>Phone <span className="muted">(optional)</span></label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div></>}
    <div className="field"><label>Email</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
    <div className="field"><label>Password</label><input required minLength={8} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
    <button className="btn btn-primary" disabled={busy}>{busy ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign in' : 'Create account')}</button>
    <button type="button" className="btn btn-secondary" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'New customer? Create an account' : 'Already have an account? Sign in'}</button>
    <a className="small muted" href="/login">Business Admin / System Owner login →</a>
  </form></main>;
}
