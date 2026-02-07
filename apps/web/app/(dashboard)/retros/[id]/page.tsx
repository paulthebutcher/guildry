"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Retrospective } from "@guildry/database";
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Edit,
  Star,
} from "lucide-react";

interface ProjectInfo {
  id: string;
  name: string;
  type?: string;
  description?: string;
  estimated_hours?: number;
  actual_hours?: number;
  client?: { id: string; name: string } | null;
}

interface RetroWithProject extends Retrospective {
  project?: ProjectInfo | null;
}

export default function RetroDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [retrospective, setRetrospective] = useState<RetroWithProject | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRetrospective() {
      try {
        const response = await fetch(`/api/retrospectives/${id}`);
        if (!response.ok) {
          throw new Error("Retrospective not found");
        }
        const { data } = await response.json();
        setRetrospective(data);
      } catch (err) {
        console.error("Failed to fetch retrospective:", err);
        setError("Failed to load retrospective details");
      } finally {
        setLoading(false);
      }
    }

    fetchRetrospective();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-8" />
          <div className="grid grid-cols-4 gap-4">
            <div className="h-24 bg-slate-200 rounded" />
            <div className="h-24 bg-slate-200 rounded" />
            <div className="h-24 bg-slate-200 rounded" />
            <div className="h-24 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !retrospective) {
    return (
      <div className="space-y-6">
        <Link
          href="/retros"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Retros
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error || "Retrospective not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/retros"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Retros
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {retrospective.project?.name || "Unknown Project"} Retro
          </h1>
          {retrospective.project?.client && (
            <p className="text-slate-600 mt-1">
              {retrospective.project.client.name}
            </p>
          )}
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <Edit className="w-4 h-4" />
          Edit
        </button>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            {retrospective.hours_variance_pct &&
            retrospective.hours_variance_pct > 0 ? (
              <TrendingUp className="w-4 h-4 text-red-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-green-500" />
            )}
            <span className="text-sm">Hours Variance</span>
          </div>
          <p
            className={`text-xl font-bold ${
              retrospective.hours_variance_pct &&
              retrospective.hours_variance_pct > 0
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {retrospective.hours_variance_pct !== null
              ? `${retrospective.hours_variance_pct > 0 ? "+" : ""}${
                  retrospective.hours_variance_pct
                }%`
              : "N/A"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Scope Changes</span>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {retrospective.scope_changes_count}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Star className="w-4 h-4" />
            <span className="text-sm">Client Satisfaction</span>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {retrospective.client_satisfaction
              ? `${retrospective.client_satisfaction}/5 ${"⭐".repeat(
                  retrospective.client_satisfaction
                )}`
              : "N/A"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            {retrospective.would_repeat ? (
              <ThumbsUp className="w-4 h-4 text-green-500" />
            ) : (
              <ThumbsDown className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm">Would Repeat</span>
          </div>
          <p
            className={`text-xl font-bold ${
              retrospective.would_repeat ? "text-green-600" : "text-red-600"
            }`}
          >
            {retrospective.would_repeat === null
              ? "N/A"
              : retrospective.would_repeat
              ? "Yes"
              : "No"}
          </p>
        </div>
      </div>

      {/* What worked / What didn't */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-green-500" />
            What Worked
          </h2>
          <p className="text-slate-700 whitespace-pre-wrap">
            {retrospective.what_worked || "No notes recorded"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <ThumbsDown className="w-5 h-5 text-red-500" />
            What Didn&apos;t Work
          </h2>
          <p className="text-slate-700 whitespace-pre-wrap">
            {retrospective.what_didnt || "No notes recorded"}
          </p>
        </div>
      </div>

      {/* Lessons learned */}
      {retrospective.lessons && retrospective.lessons.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Lessons Learned
          </h2>
          <ul className="space-y-3">
            {retrospective.lessons.map((lesson, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg"
              >
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-200 text-yellow-800 text-sm font-medium flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-slate-800">{lesson}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {retrospective.tags && retrospective.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {retrospective.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block bg-accent-retro/10 text-accent-retro px-3 py-1 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          Completed{" "}
          {retrospective.completed_at
            ? new Date(retrospective.completed_at).toLocaleDateString()
            : "Unknown"}
        </div>
        {retrospective.project && (
          <Link
            href={`/projects/${retrospective.project.id}`}
            className="text-accent-blueprint hover:underline"
          >
            View Project →
          </Link>
        )}
      </div>
    </div>
  );
}
