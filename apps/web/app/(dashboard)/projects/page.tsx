import Link from "next/link";
import { getAuthContext } from "@/lib/auth";
import { getDb, Project } from "@/lib/db";
import { ProjectCard } from "@/components/projects";

export default async function ProjectsPage() {
  const { orgId } = await getAuthContext();

  const db = getDb();
  const { data: projects, error } = await db
    .from("projects")
    .select("*, client:clients(id, name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch projects:", error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load projects</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-600 mt-1">Scope, estimate, and track your projects</p>
        </div>
        <Link
          href="/projects/new"
          className="bg-accent-blueprint text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          New Project
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-slate-500 text-center mb-4">
            No projects yet. Create your first project to get started.
          </p>
          <Link
            href="/projects/new"
            className="text-accent-blueprint hover:underline"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: Project & { client?: { id: string; name: string } }) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
