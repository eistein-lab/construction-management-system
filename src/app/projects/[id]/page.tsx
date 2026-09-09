import { notFound } from "next/navigation";
import { auth } from "@/auth";
import {
  getProjectDetail,
  listAllUsers,
} from "@/lib/services/project-structure";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  SubPhaseForm,
  WorkForm,
  AssignUserForm,
  RemoveUserButton,
} from "./forms";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const project = await getProjectDetail(id);
  if (!project) notFound();

  const canEditStructure = session?.user.role === "PPIC";
  const canManageAssignments =
    session?.user.role === "CEO" || session?.user.role === "ADMIN";
  const assignableUsers = canManageAssignments ? await listAllUsers() : [];
  const alreadyAssignedIds = new Set(project.assignments.map((a) => a.userId));

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-muted-foreground">
        {project.client ?? "No client set"} · {project.location ?? "No location set"}
      </p>

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold">Sub-phases &amp; Works</h2>
        {project.subPhases.length === 0 && (
          <p className="text-sm text-muted-foreground">No sub-phases yet.</p>
        )}
        <div className="flex flex-col gap-6">
          {project.subPhases.map((subPhase) => (
            <div key={subPhase.id} className="rounded-md border p-4">
              <h3 className="font-medium">{subPhase.name}</h3>
              <div className="mt-2 flex flex-col gap-1">
                {subPhase.works.length === 0 && (
                  <p className="pl-4 text-sm text-muted-foreground">
                    No Works yet.
                  </p>
                )}
                {subPhase.works.map((work) => (
                  <div
                    key={work.id}
                    className="flex items-center gap-2 pl-4 text-sm"
                  >
                    <span>{work.name}</span>
                    <span className="text-muted-foreground">
                      ({work.unit})
                    </span>
                  </div>
                ))}
              </div>
              {canEditStructure && (
                <div className="mt-3">
                  <WorkForm
                    projectId={project.id}
                    subPhaseId={subPhase.id}
                    nextSequence={subPhase.works.length + 1}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        {canEditStructure && (
          <SubPhaseForm
            projectId={project.id}
            nextSequence={project.subPhases.length + 1}
          />
        )}
      </section>

      {canManageAssignments && (
        <>
          <Separator />
          <section className="flex flex-col gap-4">
            <h2 className="font-semibold">Team assignments</h2>
            <p className="text-sm text-muted-foreground">
              Every role already sees every project by default — only SPV is
              limited to projects they&apos;re explicitly assigned to here.
            </p>
            <div className="flex flex-col gap-2">
              {project.assignments.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No one is explicitly assigned yet.
                </p>
              )}
              {project.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center gap-3 text-sm"
                >
                  <span>{assignment.user.name}</span>
                  <Badge variant="outline">{assignment.role}</Badge>
                  <RemoveUserButton
                    projectId={project.id}
                    userId={assignment.userId}
                  />
                </div>
              ))}
            </div>
            <AssignUserForm
              projectId={project.id}
              users={assignableUsers.filter(
                (user) => !alreadyAssignedIds.has(user.id)
              )}
            />
          </section>
        </>
      )}
    </div>
  );
}
