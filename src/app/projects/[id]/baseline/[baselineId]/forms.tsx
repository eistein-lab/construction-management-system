"use client";

import {
  addPlanningLineAction,
  deletePlanningLineAction,
  submitBaselineAction,
  approveBaselineAction,
  rejectBaselineAction,
  createBaselineAction,
  createFormulaApplicationAction,
  commitFormulaApplicationAction,
  discardFormulaApplicationAction,
} from "../actions";
import { useResettingAction } from "@/hooks/use-resetting-action";
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
  const { formRef, error, formAction, isPending } =
    useResettingAction(addPlanningLineAction);

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
  const { formRef, error, formAction, isPending } =
    useResettingAction(rejectBaselineAction);

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

type FormulaOption = { id: string; name: string; outputUnit: string };

export function ApplyFormulaForm({
  projectId,
  baselineId,
  works,
  formulas,
}: {
  projectId: string;
  baselineId: string;
  works: WorkOption[];
  formulas: FormulaOption[];
}) {
  const { formRef, error, formAction, isPending } = useResettingAction(
    createFormulaApplicationAction
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-1 gap-3 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="baselineId" value={baselineId} />

      <div className="flex flex-col gap-1.5">
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

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Formula</label>
        <Select name="formulaId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a Formula">
              {(value: string | null) => {
                const f = formulas.find((f) => f.id === value);
                return f ? f.name : "Select a Formula";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {formulas.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name} (per {f.outputUnit})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Base quantity</label>
        <Input name="baseQuantity" type="number" step="any" min="0" required />
      </div>

      <Button type="submit" disabled={isPending} className="lg:w-fit">
        {isPending ? "Applying…" : "Preview application"}
      </Button>
      {error && (
        <p className="text-sm text-destructive lg:col-span-4" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function CommitFormulaApplicationButton({
  applicationId,
  projectId,
  baselineId,
}: {
  applicationId: string;
  projectId: string;
  baselineId: string;
}) {
  return (
    <form
      action={commitFormulaApplicationAction.bind(null, applicationId, projectId, baselineId)}
    >
      <Button type="submit" size="sm">
        Commit — add lines to baseline
      </Button>
    </form>
  );
}

export function DiscardFormulaApplicationButton({
  applicationId,
  projectId,
  baselineId,
}: {
  applicationId: string;
  projectId: string;
  baselineId: string;
}) {
  return (
    <form
      action={discardFormulaApplicationAction.bind(null, applicationId, projectId, baselineId)}
    >
      <Button type="submit" size="sm" variant="ghost">
        Discard
      </Button>
    </form>
  );
}
