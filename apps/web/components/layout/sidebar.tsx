"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageSquare } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Conversations", href: "/conversations", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-slate-200">
        <Link href="/dashboard">
          <h1 className="text-xl font-bold text-accent-blueprint">Guildry</h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent-blueprint/10 text-accent-blueprint"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <UserButton />
          <span className="text-sm text-slate-600">Account</span>
        </div>
      </div>
    </div>
  );
}
