import { useActionState, useRef } from "react";

/**
 * Wraps a Server Action that returns an error string (or undefined on
 * success) so the form resets itself on success. Shared across every
 * "quick add" form in the app — extracted here once a third caller needed
 * it (docs/DECISIONS.md convention: don't abstract until it's needed twice
 * over, but don't duplicate a third time either).
 */
export function useResettingAction(
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
