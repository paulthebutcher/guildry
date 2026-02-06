import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-900 mb-4">
        Welcome to Guildry
      </h2>
      <p className="text-slate-600 mb-8">
        Your AI-powered client management platform
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/clients">
          <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-accent-blueprint transition-colors cursor-pointer">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Clients
            </h3>
            <p className="text-slate-600">
              Manage your client relationships and information
            </p>
          </div>
        </Link>

        <div className="bg-white border border-slate-200 rounded-lg p-6 opacity-50">
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Conversations
          </h3>
          <p className="text-slate-600">Coming soon</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 opacity-50">
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Analytics
          </h3>
          <p className="text-slate-600">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
