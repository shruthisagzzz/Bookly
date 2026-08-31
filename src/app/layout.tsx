import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bookly',
  description: 'Appointment Booking Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}