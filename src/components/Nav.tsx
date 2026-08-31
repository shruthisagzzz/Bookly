'use client';
import { useRouter } from 'next/navigation';
export function Nav({ title='Bookly' }: { title?: string }) { const router=useRouter(); const logout=async()=>{await fetch('/api/auth/logout',{method:'POST'});router.push('/login')}; return <nav className="nav"><div className="container nav-inner"><div className="brand">{title}<span>.</span></div><div className="nav-links"><button className="btn btn-ghost" onClick={logout}>Sign out</button></div></div></nav>; }
