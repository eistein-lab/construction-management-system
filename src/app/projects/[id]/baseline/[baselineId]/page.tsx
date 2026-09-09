import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getBaselineDetail, listBaselinesForProject } from "@/lib/services/ppic-baseline";
import { getProjectDetail } from "@/lib/services/project-structure";
import {
  listFormulas,
  listFormulaApplicationsForProject,
} from "@/lib/services/qs-formula";
import { calculateBaselineTotals } from "@/lib/calculations/baseline";
import { calculateFormulaBreakdown, calculateFormulaBreakdownTotal } from "@/lib/calculations/formula";
import { formatRupiah, formatQuantity } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AddPlanningLineForm,
  DeletePlanningLineButton,
  SubmitBaselineButton,
  ApproveBaselineButton,
  RejectBaselineForm,
  StartRevisionButton,
  ApplyFormulaForm,
  CommitFormulaApplicationButton,
  DiscardFormulaApplicationButton,
} from "./forms";

const STATUS_VARIANT: Record<
  string,
  "secondary" | "success" | "warning" | "outline"
> = {
  DRAFT: "secondary",
  SUBMITTED: "warning",
  APPROVED: "success",
  SUPERSEDED: "outline",
};

export default async function BaselineDetailPage({
  params,
}: {
  params: Promise<{ id: string; baselineId: string }>;
}) {
  const { id: projectId, baselineId } = await params;
  const session = await auth();
  const role = session?.user.role;

  const project = await getProjectDetail(projectId);
  if (!project) notFound();

  const { baseline, isLatest, hasActiveRevision } = await getBaselineDetail(baselineId);
  if (!baseline) notFound();

  const versions = await listBaselinesForProject(projectId);
  const totals = calculateBaselineTotals(baseline.lines);

  const works = project.subPhases.flatMap((sp) =>
    sp.works.map((w) => ({ id: w.id, name: w.name, subPhaseName: sp.name }))
  );

  const isPM = role === "PM";
  const isCEO = role === "CEO";
  const isQS = role === "QS";
  const canEditLines = isPM && baseline.status === "DRAFT";
  const canSubmit = isPM && baseline.status === "DRAFT" && baseline.lines.length > 0;
  const canDecide = isCEO && baseline.status === "SUBMITTED";
  const canStartRevision =
    isPM && baseline.status === "APPROVED" && isLatest && !hasActiveRevision;
  const canApplyFormula = isQS && baseline.status === "DRAFT";

  const formulas = canApplyFormula ? await listFormulas() : [];
  const allApplications = canApplyFormula
    ? await listFormulaApplicationsForProject(projectId)
    : [];
  const pendingApplications = allApplications.filter((a) => a.status === "DRAFT");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Baseline v{baseline.version}
          </h2>
          <Badge variant={STATUS_VARIANT[baseline.status]}>{baseline.status}</Badge>
          {baseline.isOriginal && <Badge variant="outline">Original</Badge>}
          {!isLatest && (
            <span className="text-sm text-muted-foreground">
              (superseded by a later version)
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Created by {baseline.createdBy.name}
          {baseline.approvedBy &&
            ` · Approved by ${baseline.approvedBy.name} on ${baseline.approvedAt?.toLocaleDateString("id-ID")}`}
        </p>
        {baseline.rejectionReason && (
          <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">
            Last rejected: {baseline.rejectionReason}
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Work</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              {canEditLines && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {baseline.lines.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No lines yet.
                </TableCell>
              </TableRow>
            )}
            {baseline.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>
                  {line.work.subPhase.name} — {line.work.name}
                </TableCell>
                <TableCell>
                  {line.itemDescription}
                  {line.source === "QS_FORMULA" ? (
                    <Badge variant="outline" className="ml-2 text-xs">
                      via Formula
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="ml-2 text-xs">
                      Manual — not from formula library
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{line.unit}</TableCell>
                <TableCell className="text-right">{formatQuantity(line.quantity.toString())}</TableCell>
                <TableCell className="text-right">{formatRupiah(line.unitPrice.toString())}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatRupiah(line.totalValue.toString())}
                </TableCell>
                {canEditLines && (
                  <TableCell>
                    <DeletePlanningLineButton
                      lineId={line.id}
                      projectId={projectId}
                      baselineId={baselineId}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-end border-t bg-muted/30 px-4 py-2 text-sm">
          <span className="font-semibold">
            Total: {formatRupiah(totals.totalValue)} ({totals.lineCount} lines)
          </span>
        </div>
      </div>

      {canEditLines && (
        <AddPlanningLineForm
          projectId={projectId}
          baselineId={baselineId}
          works={works}
          nextSequence={baseline.lines.length + 1}
        />
      )}

      {canApplyFormula && (
        <section className="flex flex-col gap-4">
          <h2 className="font-semibold">QS Formula</h2>

          {pendingApplications.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Pending applications — review the breakdown, then commit to add
                these lines to the baseline.
              </p>
              {pendingApplications.map((app) => {
                const breakdown = calculateFormulaBreakdown(
                  app.formula.lines,
                  Number(app.baseQuantity)
                );
                const total = calculateFormulaBreakdownTotal(breakdown);
                return (
                  <div key={app.id} className="rounded-md border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {app.work.subPhase.name} — {app.work.name}: {app.formula.name} ×{" "}
                        {formatQuantity(app.baseQuantity.toString())} {app.formula.outputUnit}
                      </p>
                      <div className="flex gap-2">
                        <CommitFormulaApplicationButton
                          applicationId={app.id}
                          projectId={projectId}
                          baselineId={baselineId}
                        />
                        <DiscardFormulaApplicationButton
                          applicationId={app.id}
                          projectId={projectId}
                          baselineId={baselineId}
                        />
                      </div>
                    </div>
                    <div className="mt-3 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {breakdown.map((row) => (
                            <TableRow key={row.formulaLineId}>
                              <TableCell>{row.itemName}</TableCell>
                              <TableCell className="text-right">
                                {formatQuantity(row.quantity)}
                              </TableCell>
                              <TableCell>{row.unit}</TableCell>
                              <TableCell className="text-right">
                                {formatRupiah(row.unitPrice)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatRupiah(row.totalValue)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <p className="mt-1 text-right text-sm font-semibold">
                        Total: {formatRupiah(total)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <ApplyFormulaForm
            projectId={projectId}
            baselineId={baselineId}
            works={works}
            formulas={formulas.map((f) => ({
              id: f.id,
              name: f.name,
              outputUnit: f.outputUnit,
            }))}
          />
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {canSubmit && <SubmitBaselineButton projectId={projectId} baselineId={baselineId} />}
        {isPM && baseline.status === "DRAFT" && baseline.lines.length === 0 && (
          <p className="text-sm text-muted-foreground">Add at least one line to submit.</p>
        )}
        {baseline.status === "SUBMITTED" && !canDecide && (
          <p className="text-sm text-muted-foreground">Awaiting CEO approval.</p>
        )}
        {canDecide && (
          <div className="flex flex-wrap items-start gap-4">
            <ApproveBaselineButton projectId={projectId} baselineId={baselineId} />
            <RejectBaselineForm projectId={projectId} baselineId={baselineId} />
          </div>
        )}
        {canStartRevision && <StartRevisionButton projectId={projectId} />}
      </div>

      {versions.length > 1 && (
        <>
          <Separator />
          <section className="flex flex-col gap-2">
            <h2 className="font-semibold">Version history</h2>
            <div className="flex flex-col gap-1">
              {versions.map((v) => (
                <Link
                  key={v.id}
                  href={`/projects/${projectId}/baseline/${v.id}`}
                  className={`flex items-center gap-3 rounded-md px-2 py-1 text-sm hover:bg-muted ${
                    v.id === baselineId ? "bg-muted font-medium" : ""
                  }`}
                >
                  <span>Version {v.version}</span>
                  <Badge variant={STATUS_VARIANT[v.status]}>{v.status}</Badge>
                  <span className="text-muted-foreground">
                    {v._count.lines} line{v._count.lines === 1 ? "" : "s"}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
