"use client";

import { Menu } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between md:hidden">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-slate-100 rounded-lg"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6 text-slate-700" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      </div>
      <UserButton />
    </header>
  );
}
