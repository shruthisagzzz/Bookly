'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Appointment = {
  id: string;
  customerEmail: string;
  startAt: string;
  endAt: string;
  status: string;
  bookingToken: string;
  service: { name: string; durationMin: number };
  tenant: { name: string; slug: string; timezone: string };
};

type Customer = { customerId: string; name: string; email: string };

export default function CustomerPortal() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    const load = async () => {
      const me = await fetch('/api/customer/auth/me');
      if (!me.ok) { router.replace('/customer/login'); return; }
      const md = await me.json();
      setCustomer(md.customer);
      const r = await fetch('/api/customer/appointments');
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Unable to load bookings'); return; }
      setAppointments(d.appointments || []);
    };
    load();
  }, [router]);

  const cancel = async (id: string) => {
    if (!window.confirm('Cancel this appointment?')) return;
    setBusy(id); setError('');
    const r = await fetch(`/api/customer/appointments/${id}/cancel`, { method: 'POST' });
    const d = await r.json();
    if (!r.ok) setError(d.error || 'Unable to cancel booking');
    else setAppointments(items => items.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a));
    setBusy('');
  };

  const logout = async () => {
    await fetch('/api/customer/auth/logout', { method: 'POST' });
    router.replace('/customer/login');
  };

  const upcoming = appointments.filter(a => a.status === 'CONFIRMED' && new Date(a.startAt) > new Date());

  return <main className="dashboard"><div className="container">
    <div className="dashboard-head">
      <div><div className="small muted">CUSTOMER PORTAL</div><h1>{customer ? `Welcome, ${customer.name}` : 'Your bookings'}</h1><p className="muted">View and manage your appointments across businesses.</p></div>
      <div className="nav-links"><a className="btn btn-secondary" href="/">Book an appointment</a><button className="btn btn-ghost" onClick={logout}>Sign out</button></div>
    </div>
    {error && <div className="alert" style={{ marginBottom: 16 }}>{error}</div>}
    <div className="card">
      <div className="row" style={{ marginBottom: 14 }}><div><h2 className="section-title" style={{ marginBottom: 4 }}>My appointments</h2><p className="muted">Bookings for <b>{customer?.email}</b></p></div><span className="pill active">{upcoming.length} upcoming</span></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Business</th><th>Service</th><th>When</th><th>Status</th><th>Action</th></tr></thead><tbody>
        {appointments.map(a => <tr key={a.id}><td><b>{a.tenant.name}</b></td><td>{a.service.name}<div className="small muted">{a.service.durationMin} min</div></td><td>{new Date(a.startAt).toLocaleString()}<div className="small muted">{a.tenant.timezone}</div></td><td><span className={'pill ' + a.status.toLowerCase()}>{a.status.replace('_', ' ')}</span></td><td>{a.status === 'CONFIRMED' && <button className="btn btn-danger" disabled={busy === a.id} onClick={() => cancel(a.id)}>{busy === a.id ? 'Cancelling…' : 'Cancel'}</button>}</td></tr>)}
      </tbody></table>{!appointments.length && <div className="empty">You don't have any bookings yet. <a href="/book/acme-consulting">Book one now →</a></div>}</div>
    </div>
  </div></main>;
}
