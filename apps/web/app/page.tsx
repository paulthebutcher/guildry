import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-accent-blueprint">Guildry</h1>
        <p className="text-xl text-slate-600">
          Your platform for building and managing guilds
        </p>
        <div className="pt-4">
          <Link
            href="/sign-in"
            className="inline-block bg-accent-blueprint text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
