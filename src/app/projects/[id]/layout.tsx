import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProjectSummary } from "@/lib/services/project-structure";
import { Badge } from "@/components/ui/badge";
import { ProjectSubNav } from "@/components/project-sub-nav";

/**
 * Chrome shared by every page under a project — docs/UI_UX_GUIDELINES.md
 * §Navigation & Wayfinding: a back link to the projects list, the project's
 * identity (name/code/status) so it's never ambiguous which project a nested
 * page belongs to, and section tabs so modules are reachable without hunting
 * for a button in page content.
 */
export default async function ProjectLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const project = await getProjectSummary(id).catch(() => null);
  if (!project) notFound();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-3">
        <Link
          href="/projects"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Projects
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
          <Badge variant="secondary">{project.code}</Badge>
          <Badge>{project.status}</Badge>
        </div>
        <ProjectSubNav projectId={project.id} />
      </div>
      {children}
    </div>
  );
}
