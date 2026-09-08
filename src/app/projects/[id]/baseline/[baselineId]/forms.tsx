"use client";

import { useActionState, useRef } from "react";
import {
  addPlanningLineAction,
  deletePlanningLineAction,
  submitBaselineAction,
  approveBaselineAction,
  rejectBaselineAction,
  createBaselineAction,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WorkOption = { id: string; name: string; subPhaseName: string };

export function AddPlanningLineForm({
  projectId,
  baselineId,
  works,
  nextSequence,
}: {
  projectId: string;
  baselineId: string;
  works: WorkOption[];
  nextSequence: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, formAction, isPending] = useActionState(
    async (prevState: string | undefined, formData: FormData) => {
      const result = await addPlanningLineAction(prevState, formData);
      if (!result) formRef.current?.reset();
      return result;
    },
    undefined
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-1 gap-3 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="baselineId" value={baselineId} />
      <input type="hidden" name="sequence" value={nextSequence} />

      <div className="flex flex-col gap-1.5 lg:col-span-2">
        <label className="text-sm font-medium">Work</label>
        <Select name="workId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a Work">
              {(value: string | null) => {
                const w = works.find((w) => w.id === value);
                return w ? `${w.subPhaseName} — ${w.name}` : "Select a Work";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {works.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.subPhaseName} — {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 lg:col-span-2">
        <label className="text-sm font-medium">Item description</label>
        <Input name="itemDescription" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Unit</label>
        <Input name="unit" placeholder="m², m³, ls…" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Quantity</label>
        <Input name="quantity" type="number" step="any" min="0" required />
      </div>

      <div className="flex flex-col gap-1.5 lg:col-span-2">
        <label className="text-sm font-medium">Unit price (Rp)</label>
        <Input name="unitPrice" type="number" step="1" min="0" required />
      </div>

      <Button type="submit" disabled={isPending} className="lg:col-span-6 lg:w-fit">
        {isPending ? "Adding…" : "Add line"}
      </Button>
      {error && (
        <p className="text-sm text-destructive lg:col-span-6" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function DeletePlanningLineButton({
  lineId,
  projectId,
  baselineId,
}: {
  lineId: string;
  projectId: string;
  baselineId: string;
}) {
  return (
    <form
      action={deletePlanningLineAction.bind(null, lineId, projectId, baselineId)}
    >
      <Button type="submit" size="sm" variant="ghost">
        Remove
      </Button>
    </form>
  );
}

export function SubmitBaselineButton({
  projectId,
  baselineId,
}: {
  projectId: string;
  baselineId: string;
}) {
  return (
    <form action={submitBaselineAction.bind(null, projectId, baselineId)}>
      <Button type="submit">Submit for approval</Button>
    </form>
  );
}

export function ApproveBaselineButton({
  projectId,
  baselineId,
}: {
  projectId: string;
  baselineId: string;
}) {
  return (
    <form action={approveBaselineAction.bind(null, projectId, baselineId)}>
      <Button type="submit">Approve</Button>
    </form>
  );
}

export function RejectBaselineForm({
  projectId,
  baselineId,
}: {
  projectId: string;
  baselineId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, formAction, isPending] = useActionState(
    async (prevState: string | undefined, formData: FormData) => {
      const result = await rejectBaselineAction(prevState, formData);
      if (!result) formRef.current?.reset();
      return result;
    },
    undefined
  );

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="baselineId" value={baselineId} />
      <Textarea
        name="reason"
        placeholder="Reason for rejection (required)"
        required
        className="w-80"
      />
      <Button type="submit" variant="destructive" disabled={isPending} className="w-fit">
        {isPending ? "Rejecting…" : "Reject"}
      </Button>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function StartRevisionButton({ projectId }: { projectId: string }) {
  return (
    <form action={createBaselineAction.bind(null, projectId)}>
      <Button type="submit" variant="outline">
        Start a revision
      </Button>
    </form>
  );
}
