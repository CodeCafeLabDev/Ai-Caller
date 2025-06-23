
import type { Metadata } from 'next';
import { Logo } from '@/components/logo';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Authenticate - AI Caller',
  description: 'Sign in or sign up to AI Caller',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="mb-8">
        <Logo className="text-primary" iconClassName="text-primary" />
      </div>
      {children}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Back to{' '}
        <Link href="/" className="underline hover:text-primary">
          Homepage
        </Link>
      </p>
    </div>
  );
}
