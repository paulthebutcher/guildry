import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { getDb, ProjectStatus, ProjectType, PhaseStatus } from "@/lib/db";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-slate-100", text: "text-slate-700" },
  scoping: { bg: "bg-yellow-100", text: "text-yellow-800" },
  proposed: { bg: "bg-blue-100", text: "text-blue-800" },
  active: { bg: "bg-green-100", text: "text-green-800" },
  paused: { bg: "bg-orange-100", text: "text-orange-800" },
  complete: { bg: "bg-emerald-100", text: "text-emerald-800" },
  cancelled: { bg: "bg-red-100", text: "text-red-800" },
};

const TYPE_LABELS: Record<string, string> = {
  new_build: "New Build",
  redesign: "Redesign",
  fix: "Fix",
  audit: "Audit",
  retainer: "Retainer",
  strategy: "Strategy",
};

const PHASE_STATUS_COLORS: Record<string, string> = {
  planned: "bg-slate-200",
  active: "bg-blue-500",
  complete: "bg-green-500",
};

interface Phase {
  id: string;
  name: string;
  sort_order: number;
  estimated_hours: number | null;
  actual_hours: number | null;
  status: string;
}

interface ProjectWithDetails {
  id: string;
  name: string;
  description: string | null;
  status: string;
  type: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  start_date: string | null;
  end_date: string | null;
  tags: string[] | null;
  client: { id: string; name: string } | null;
  phases: Phase[];
  created_at: string;
  updated_at: string;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await getAuthContext();

  const db = getDb();
  const { data: project, error } = await db
    .from("projects")
    .select(
      "*, client:clients(id, name), phases(id, name, sort_order, estimated_hours, actual_hours, status)"
    )
    .eq("id", id)
    .eq("org_id", orgId)
    .order("sort_order", { referencedTable: "phases", ascending: true })
    .single<ProjectWithDetails>();

  if (error || !project) {
    console.error("Project not found:", error);
    notFound();
  }

  const statusColor = STATUS_COLORS[project.status] || STATUS_COLORS.draft;
  const totalEstimatedPhaseHours = project.phases?.reduce(
    (sum, p) => sum + (p.estimated_hours || 0),
    0
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/projects" className="hover:text-slate-700">
            Projects
          </Link>
          <span>/</span>
          <span className="text-slate-900">{project.name}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
            {project.client && (
              <Link
                href={`/clients/${project.client.id}`}
                className="text-slate-600 hover:text-accent-blueprint"
              >
                {project.client.name}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-block text-sm px-3 py-1 rounded-full ${statusColor.bg} ${statusColor.text}`}
            >
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-500 mb-1">Type</p>
          <p className="text-lg font-semibold text-slate-900">
            {project.type ? TYPE_LABELS[project.type] : "—"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-500 mb-1">Estimated Hours</p>
          <p className="text-lg font-semibold text-slate-900">
            {project.estimated_hours || totalEstimatedPhaseHours || "—"}h
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-500 mb-1">Start Date</p>
          <p className="text-lg font-semibold text-slate-900">
            {project.start_date
              ? new Date(project.start_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-500 mb-1">End Date</p>
          <p className="text-lg font-semibold text-slate-900">
            {project.end_date
              ? new Date(project.end_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Description</h2>
          <p className="text-slate-600 whitespace-pre-wrap">{project.description}</p>
        </div>
      )}

      {/* Phases */}
      {project.phases && project.phases.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Phases</h2>

          <div className="space-y-3">
            {project.phases.map((phase) => (
              <div
                key={phase.id}
                className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${PHASE_STATUS_COLORS[phase.status]}`}
                  />
                  <span className="text-slate-900">{phase.name}</span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  {phase.estimated_hours && (
                    <span className="text-slate-500">
                      {phase.estimated_hours}h estimated
                    </span>
                  )}
                  {phase.actual_hours && (
                    <span className="text-slate-700 font-medium">
                      {phase.actual_hours}h actual
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      phase.status === "complete"
                        ? "bg-green-100 text-green-800"
                        : phase.status === "active"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {phase.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Phase summary */}
          <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between text-sm">
            <span className="text-slate-500">Total</span>
            <span className="font-medium text-slate-900">
              {totalEstimatedPhaseHours}h estimated
            </span>
          </div>
        </div>
      )}

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-500 mb-2">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="inline-block bg-slate-100 text-slate-700 text-sm px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-6 border-t border-slate-200">
        {project.status === "draft" && (
          <button className="bg-accent-blueprint text-white px-4 py-2 rounded-lg hover:opacity-90">
            Start Scoping
          </button>
        )}
        {project.status === "active" && (
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:opacity-90">
            Complete Project
          </button>
        )}
        <Link
          href="/projects"
          className="text-slate-600 hover:text-slate-900 px-4 py-2"
        >
          Back to Projects
        </Link>
      </div>
    </div>
  );
}
