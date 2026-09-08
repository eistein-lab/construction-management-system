import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export async function NavBar() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          Construction Management System
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{session.user.name}</span>
          <Badge variant="secondary">{session.user.role}</Badge>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
