"use client";

import { useActionState, useRef } from "react";
import { createProjectAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CreateProjectForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [errorMessage, formAction, isPending] = useActionState(
    async (prevState: string | undefined, formData: FormData) => {
      const result = await createProjectAction(prevState, formData);
      if (!result) formRef.current?.reset();
      return result;
    },
    undefined
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New project</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={formAction}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" placeholder="PRJ-001" required />
          </div>
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client">Client</Label>
            <Input id="client" name="client" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" />
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className="lg:col-span-5 lg:w-fit"
          >
            {isPending ? "Creating…" : "Create project"}
          </Button>
          {errorMessage && (
            <p className="text-sm text-destructive lg:col-span-5" role="alert">
              {errorMessage}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
