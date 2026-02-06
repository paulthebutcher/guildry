import { UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-accent-blueprint">Guildry</h1>
            <UserButton />
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          Welcome to Guildry
        </h2>
        <p className="text-slate-600">
          Your dashboard is ready. We&apos;ll build the real features here soon.
        </p>
      </main>
    </div>
  );
}
