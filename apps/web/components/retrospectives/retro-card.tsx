import Link from "next/link";
import { Retrospective } from "@guildry/database";

interface ProjectInfo {
  id: string;
  name: string;
  type?: string;
  client?: { id: string; name: string } | null;
}

interface RetroCardProps {
  retrospective: Retrospective & { project?: ProjectInfo | null };
}

export function RetroCard({ retrospective }: RetroCardProps) {
  // Determine sentiment based on data
  const getSentiment = () => {
    if (retrospective.would_repeat === false) return "negative";
    if (
      retrospective.hours_variance_pct &&
      retrospective.hours_variance_pct > 20
    )
      return "warning";
    if (retrospective.client_satisfaction && retrospective.client_satisfaction >= 4)
      return "positive";
    return "neutral";
  };

  const sentiment = getSentiment();
  const sentimentColors = {
    positive: "border-l-green-500",
    warning: "border-l-yellow-500",
    negative: "border-l-red-500",
    neutral: "border-l-slate-300",
  };

  return (
    <Link href={`/retros/${retrospective.id}`}>
      <div
        className={`bg-white border border-slate-200 border-l-4 ${sentimentColors[sentiment]} rounded-lg p-6 hover:border-accent-retro transition-colors cursor-pointer`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {retrospective.project?.name || "Unknown Project"}
            </h3>
            {retrospective.project?.client && (
              <p className="text-sm text-slate-500">
                {retrospective.project.client.name}
              </p>
            )}
          </div>
          {retrospective.client_satisfaction && (
            <div className="flex items-center gap-1">
              <span className="text-lg">
                {"⭐".repeat(retrospective.client_satisfaction)}
              </span>
            </div>
          )}
        </div>

        {/* Metrics row */}
        <div className="flex flex-wrap gap-4 mb-3 text-sm">
          {retrospective.hours_variance_pct !== null && (
            <div
              className={`${
                retrospective.hours_variance_pct > 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {retrospective.hours_variance_pct > 0 ? "+" : ""}
              {retrospective.hours_variance_pct}% hours
            </div>
          )}
          {retrospective.scope_changes_count > 0 && (
            <div className="text-slate-600">
              {retrospective.scope_changes_count} scope change
              {retrospective.scope_changes_count !== 1 ? "s" : ""}
            </div>
          )}
          {retrospective.would_repeat !== null && (
            <div
              className={
                retrospective.would_repeat ? "text-green-600" : "text-red-600"
              }
            >
              {retrospective.would_repeat ? "Would repeat" : "Would not repeat"}
            </div>
          )}
        </div>

        {/* Lessons preview */}
        {retrospective.lessons && retrospective.lessons.length > 0 && (
          <div className="mb-3">
            <p className="text-sm text-slate-600 line-clamp-2">
              💡 {retrospective.lessons[0]}
              {retrospective.lessons.length > 1 &&
                ` (+${retrospective.lessons.length - 1} more)`}
            </p>
          </div>
        )}

        {/* Tags */}
        {retrospective.tags && retrospective.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {retrospective.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block bg-accent-retro/10 text-accent-retro text-xs px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
            {retrospective.tags.length > 3 && (
              <span className="text-xs text-slate-400">
                +{retrospective.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Date */}
        <div className="mt-3 text-xs text-slate-400">
          {retrospective.completed_at
            ? new Date(retrospective.completed_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "No date"}
        </div>
      </div>
    </Link>
  );
}
