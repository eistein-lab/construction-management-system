"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

/**
 * Section tabs for a project workspace — docs/UI_UX_GUIDELINES.md §Navigation
 * & Wayfinding. New sections land here as later implementation days add them
 * (QS Formula, Procurement, Progress, Stock, ...), rather than being reachable
 * only via a button buried in page content.
 */
export function ProjectSubNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const overviewHref = `/projects/${projectId}`;
  const baselineHref = `/projects/${projectId}/baseline`;

  const tabs = [
    { href: overviewHref, label: "Overview", active: pathname === overviewHref },
    {
      href: baselineHref,
      label: "Planning Baseline",
      active: pathname.startsWith(baselineHref),
    },
  ];

  return (
    <nav className="flex gap-4 border-b" aria-label="Project sections">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "-mb-px border-b-2 px-1 py-2 text-sm font-medium transition-colors",
            tab.active
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
