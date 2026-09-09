import Link from "next/link";
import { auth } from "@/auth";
import { listProjectsForCurrentUser } from "@/lib/services/project-structure";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateProjectForm } from "./create-project-form";

const PROJECT_STATUS_VARIANT: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  PLANNING: "secondary",
  KICKED_OFF: "default",
  ON_HOLD: "outline",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

export default async function ProjectsPage() {
  const session = await auth();
  const projects = await listProjectsForCurrentUser();
  const canCreate = session?.user.role === "PM";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          {projects.length} project{projects.length === 1 ? "" : "s"} visible to you.
        </p>
      </div>

      {canCreate && <CreateProjectForm />}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Sub-phases</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No projects yet.
                </TableCell>
              </TableRow>
            )}
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">
                  <Link href={`/projects/${project.id}`} className="hover:underline">
                    {project.code}
                  </Link>
                </TableCell>
                <TableCell>{project.name}</TableCell>
                <TableCell>{project.client ?? "—"}</TableCell>
                <TableCell>{project.location ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={PROJECT_STATUS_VARIANT[project.status] ?? "outline"}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {project._count.subPhases}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
