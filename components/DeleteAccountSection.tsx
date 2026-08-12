import { deleteAccount } from "@/app/account/actions";

export function DeleteAccountSection() {
  return (
    <details className="mt-10 rounded-md border border-red-200 dark:border-red-900/50">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">
        Delete my account
      </summary>
      <div className="border-t border-red-200 px-4 py-4 dark:border-red-900/50">
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
            className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
          <button
            formAction={deleteAccount}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
          >
            Permanently delete
          </button>
        </form>
      </div>
    </details>
  );
}
