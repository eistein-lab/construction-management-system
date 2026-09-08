"use client";

import { useActionState, useRef } from "react";
import {
  createSubPhaseAction,
  createWorkAction,
  assignUserAction,
  removeUserAction,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function useResettingAction(
  action: (
    prevState: string | undefined,
    formData: FormData
  ) => Promise<string | undefined>
) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, formAction, isPending] = useActionState(
    async (prevState: string | undefined, formData: FormData) => {
      const result = await action(prevState, formData);
      if (!result) formRef.current?.reset();
      return result;
    },
    undefined
  );
  return { formRef, error, formAction, isPending };
}

export function SubPhaseForm({
  projectId,
  nextSequence,
}: {
  projectId: string;
  nextSequence: number;
}) {
  const { formRef, error, formAction, isPending } =
    useResettingAction(createSubPhaseAction);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="sequence" value={nextSequence} />
      <Input name="name" placeholder="Sub-phase name (e.g. Structure)" required className="w-64" />
      <Button type="submit" size="sm" disabled={isPending} variant="outline">
        {isPending ? "Adding…" : "Add sub-phase"}
      </Button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </form>
  );
}

export function WorkForm({
  projectId,
  subPhaseId,
  nextSequence,
}: {
  projectId: string;
  subPhaseId: string;
  nextSequence: number;
}) {
  const { formRef, error, formAction, isPending } =
    useResettingAction(createWorkAction);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2 pl-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="subPhaseId" value={subPhaseId} />
      <input type="hidden" name="sequence" value={nextSequence} />
      <Input name="name" placeholder="Work name" required className="w-56" />
      <Input name="unit" placeholder="Unit (m², m³, ls…)" required className="w-32" />
      <Button type="submit" size="sm" variant="ghost" disabled={isPending}>
        {isPending ? "Adding…" : "+ Work"}
      </Button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </form>
  );
}

export function AssignUserForm({
  projectId,
  users,
}: {
  projectId: string;
  users: { id: string; name: string; role: string }[];
}) {
  const { formRef, error, formAction, isPending } =
    useResettingAction(assignUserAction);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <Select name="userId" required>
        <SelectTrigger className="w-64">
          {/* Base UI's SelectValue shows the raw value unless given a label lookup —
              unlike Radix, it doesn't infer the label from SelectItem's children. */}
          <SelectValue placeholder="Select a user to assign">
            {(value: string | null) =>
              users.find((user) => user.id === value)?.name ??
              "Select a user to assign"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name} ({user.role})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? "Assigning…" : "Assign"}
      </Button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </form>
  );
}

export function RemoveUserButton({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) {
  return (
    <form action={removeUserAction.bind(null, projectId, userId)}>
      <Button type="submit" size="sm" variant="ghost">
        Remove
      </Button>
    </form>
  );
}
