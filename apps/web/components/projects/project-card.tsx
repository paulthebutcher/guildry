import Link from "next/link";
import { Project, ProjectStatus, ProjectType } from "@guildry/database";

interface ProjectCardProps {
  project: Project & { client?: { id: string; name: string } | null };
}

const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string }> = {
  [ProjectStatus.DRAFT]: { bg: "bg-slate-100", text: "text-slate-700" },
  [ProjectStatus.SCOPING]: { bg: "bg-yellow-100", text: "text-yellow-800" },
  [ProjectStatus.PROPOSED]: { bg: "bg-blue-100", text: "text-blue-800" },
  [ProjectStatus.ACTIVE]: { bg: "bg-green-100", text: "text-green-800" },
  [ProjectStatus.PAUSED]: { bg: "bg-orange-100", text: "text-orange-800" },
  [ProjectStatus.COMPLETE]: { bg: "bg-emerald-100", text: "text-emerald-800" },
  [ProjectStatus.CANCELLED]: { bg: "bg-red-100", text: "text-red-800" },
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.DRAFT]: "Draft",
  [ProjectStatus.SCOPING]: "Scoping",
  [ProjectStatus.PROPOSED]: "Proposed",
  [ProjectStatus.ACTIVE]: "Active",
  [ProjectStatus.PAUSED]: "Paused",
  [ProjectStatus.COMPLETE]: "Complete",
  [ProjectStatus.CANCELLED]: "Cancelled",
};

const TYPE_LABELS: Record<ProjectType, string> = {
  [ProjectType.NEW_BUILD]: "New Build",
  [ProjectType.REDESIGN]: "Redesign",
  [ProjectType.FIX]: "Fix",
  [ProjectType.AUDIT]: "Audit",
  [ProjectType.RETAINER]: "Retainer",
  [ProjectType.STRATEGY]: "Strategy",
};

export function ProjectCard({ project }: ProjectCardProps) {
  const statusColor = STATUS_COLORS[project.status] || STATUS_COLORS[ProjectStatus.DRAFT];

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-accent-blueprint transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 flex-1 pr-2">
            {project.name}
          </h3>
          <span
            className={`inline-block text-xs px-2 py-1 rounded-full ${statusColor.bg} ${statusColor.text}`}
          >
            {STATUS_LABELS[project.status]}
          </span>
        </div>

        {project.client && (
          <p className="text-sm text-slate-600 mb-3">
            {project.client.name}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          {project.type && (
            <span className="inline-block bg-accent-blueprint/10 text-accent-blueprint text-xs px-2 py-1 rounded">
              {TYPE_LABELS[project.type]}
            </span>
          )}

          {project.tags &&
            project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
        </div>

        <div className="flex items-center justify-between text-sm text-slate-500">
          {project.estimated_hours && (
            <span>{project.estimated_hours}h estimated</span>
          )}
          {project.start_date && (
            <span>
              {new Date(project.start_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
