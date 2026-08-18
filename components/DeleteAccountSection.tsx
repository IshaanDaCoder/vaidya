import { deleteAccount } from "@/app/account/actions";
import { buttonVariants } from "@/components/ui/styles";

export function DeleteAccountSection() {
  return (
    <details className="mt-10 overflow-hidden rounded-2xl border border-red-200 shadow-sm dark:border-red-900/50">
      <summary className="cursor-pointer px-5 py-3.5 text-sm font-medium text-red-700 dark:text-red-300">
        Delete my account
      </summary>
      <div className="border-t border-red-200 bg-red-50/40 px-5 py-4 dark:border-red-900/50 dark:bg-red-950/20">
        <p className="text-sm text-muted">
          This permanently deletes your account and all associated data —
          profile, availability, consultations, and reviews. This can&apos;t
          be undone.
        </p>
        <form className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="text"
            name="confirm"
            placeholder='Type "DELETE" to confirm'
            required
            className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-foreground outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
          <button formAction={deleteAccount} className={buttonVariants("danger", "sm")}>
            Permanently delete
          </button>
        </form>
      </div>
    </details>
  );
}
