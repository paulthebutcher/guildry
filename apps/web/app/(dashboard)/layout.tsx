import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard">
                <h1 className="text-xl font-bold text-accent-blueprint">
                  Guildry
                </h1>
              </Link>
              
              <nav className="flex gap-6">
                <Link
                  href="/dashboard"
                  className="text-slate-700 hover:text-slate-900"
                >
                  Dashboard
                </Link>
                <Link
                  href="/clients"
                  className="text-slate-700 hover:text-slate-900"
                >
                  Clients
                </Link>
              </nav>
            </div>
            
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
