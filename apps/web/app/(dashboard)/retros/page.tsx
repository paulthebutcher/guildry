"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Retrospective } from "@guildry/database";
import { RetroCard } from "@/components/retrospectives/retro-card";
import { Plus, Lightbulb } from "lucide-react";

interface ProjectInfo {
  id: string;
  name: string;
  type?: string;
  client?: { id: string; name: string } | null;
}

interface RetroWithProject extends Retrospective {
  project?: ProjectInfo | null;
}

export default function RetrosPage() {
  const [retrospectives, setRetrospectives] = useState<RetroWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRetrospectives() {
      try {
        const response = await fetch("/api/retrospectives");
        const { data } = await response.json();
        setRetrospectives(data || []);
      } catch (error) {
        console.error("Failed to fetch retrospectives:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRetrospectives();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Retros</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-lg p-6 animate-pulse"
            >
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Retros</h1>
          <p className="text-slate-600 mt-1">
            Retrospectives and lessons learned from completed projects
          </p>
        </div>
        <Link
          href="/retros/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent-retro text-white rounded-lg hover:bg-accent-retro/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Retro
        </Link>
      </div>

      {retrospectives.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No retrospectives yet
          </h3>
          <p className="text-slate-600 mb-6">
            Run a retro after completing a project to capture lessons learned
            and improve future estimates.
          </p>
          <Link
            href="/retros/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-retro text-white rounded-lg hover:bg-accent-retro/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Run Your First Retro
          </Link>
        </div>
      ) : (
        <>
          {/* Stats summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-600 mb-1">Total Retros</div>
              <div className="text-2xl font-bold text-slate-900">
                {retrospectives.length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-600 mb-1">Avg Hours Variance</div>
              <div className="text-2xl font-bold text-slate-900">
                {(() => {
                  const withVariance = retrospectives.filter(
                    (r) => r.hours_variance_pct !== null
                  );
                  if (withVariance.length === 0) return "N/A";
                  const avg =
                    withVariance.reduce(
                      (sum, r) => sum + (r.hours_variance_pct || 0),
                      0
                    ) / withVariance.length;
                  return `${avg > 0 ? "+" : ""}${avg.toFixed(0)}%`;
                })()}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-600 mb-1">Would Repeat</div>
              <div className="text-2xl font-bold text-slate-900">
                {(() => {
                  const withRepeat = retrospectives.filter(
                    (r) => r.would_repeat !== null
                  );
                  if (withRepeat.length === 0) return "N/A";
                  const repeatCount = withRepeat.filter(
                    (r) => r.would_repeat
                  ).length;
                  return `${Math.round(
                    (repeatCount / withRepeat.length) * 100
                  )}%`;
                })()}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-600 mb-1">Total Lessons</div>
              <div className="text-2xl font-bold text-slate-900">
                {retrospectives.reduce(
                  (sum, r) => sum + (r.lessons?.length || 0),
                  0
                )}
              </div>
            </div>
          </div>

          {/* Retro cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {retrospectives.map((retro) => (
              <RetroCard key={retro.id} retrospective={retro} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
