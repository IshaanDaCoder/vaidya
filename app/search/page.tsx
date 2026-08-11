import { requireRole } from "@/utils/require-role";
import { logout } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function SearchPage() {
  const user = await requireRole("patient");

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Find a doctor</h1>
        <ThemeToggle />
      </div>
      <p className="mt-2 text-sm text-muted">Signed in as {user.email}</p>
      <p className="mt-6 text-sm text-muted">
        Doctor search and booking land here on Days 8–9.
      </p>
      <form className="mt-8">
        <button
          formAction={logout}
          className="rounded-md border border-line px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
        >
          Log out
        </button>
      </form>
    </main>
  );
}
