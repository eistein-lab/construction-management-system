import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listBaselinesForProject } from "@/lib/services/ppic-baseline";
import { Button } from "@/components/ui/button";
import { createBaselineAction } from "./actions";

export default async function BaselineIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const session = await auth();

  const baselines = await listBaselinesForProject(projectId);
  if (baselines.length > 0) {
    redirect(`/projects/${projectId}/baseline/${baselines[0].id}`);
  }

  const canCreate = session?.user.role === "PM";

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-sm text-muted-foreground">
        No baseline exists for this project yet.
      </p>
      {canCreate ? (
        <form action={createBaselineAction.bind(null, projectId)}>
          <Button type="submit">Create baseline (version 1)</Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only PM can create a baseline.
        </p>
      )}
    </div>
  );
}
