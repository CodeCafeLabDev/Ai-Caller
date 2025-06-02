import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo'; // Assuming logo component will be created

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Logo className="text-primary" />
        </div>
        <h1 className="text-5xl font-bold font-headline text-foreground">
          Welcome to Voxaiomni
        </h1>
        <p className="text-xl text-muted-foreground max-w-xl">
          The next generation platform for seamless voice integration and omni-channel communication management.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild size="lg">
            <Link href="/signin">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
      <footer className="absolute bottom-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Voxaiomni. All rights reserved.
      </footer>
    </div>
  );
}
