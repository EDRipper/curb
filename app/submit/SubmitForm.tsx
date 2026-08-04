"use client";

import { useActionState } from "react";
import { createSubmission } from "./actions";

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1";

export default function SubmitForm() {
  const [state, formAction, pending] = useActionState(createSubmission, undefined);

  return (
    <form action={formAction} className="mt-8 space-y-8">
      <div className="space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          the fix
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="beforeUrl" className="text-sm font-medium text-zinc-700">
              before url (live, unfixed)
            </label>
            <input
              id="beforeUrl"
              name="beforeUrl"
              type="url"
              required
              placeholder="https://old-version.example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="afterUrl" className="text-sm font-medium text-zinc-700">
              after url (live, fixed)
            </label>
            <input
              id="afterUrl"
              name="afterUrl"
              type="url"
              required
              placeholder="https://example.com"
              className={inputClass}
            />
          </div>
        </div>
        <p className="!mt-1 text-xs text-zinc-500">
          both need to be real, currently-live pages we can visit — the audit
          crawls them directly. a PR preview deploy works great for the
          &quot;before&quot; url if the live site has already moved on.
        </p>

        <div>
          <label htmlFor="diffUrl" className="text-sm font-medium text-zinc-700">
            diff / PR url
          </label>
          <input
            id="diffUrl"
            name="diffUrl"
            type="url"
            required
            placeholder="https://github.com/you/repo/pull/1"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="description" className="text-sm font-medium text-zinc-700">
            what did you fix?
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            placeholder="keyboard nav was broken on the nav menu, added focus trapping and visible focus states"
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-5 border-t border-zinc-200 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          proof <span className="normal-case text-zinc-400">(optional)</span>
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="beforeScreenshotUrl" className="text-sm font-medium text-zinc-700">
              before screenshot url
            </label>
            <input
              id="beforeScreenshotUrl"
              name="beforeScreenshotUrl"
              type="url"
              placeholder="https://..."
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="afterScreenshotUrl" className="text-sm font-medium text-zinc-700">
              after screenshot url
            </label>
            <input
              id="afterScreenshotUrl"
              name="afterScreenshotUrl"
              type="url"
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="space-y-5 border-t border-zinc-200 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          hours
        </h2>
        <div>
          <label htmlFor="hoursClaimed" className="text-sm font-medium text-zinc-700">
            hours claimed
          </label>
          <input
            id="hoursClaimed"
            name="hoursClaimed"
            type="number"
            step="0.5"
            min="0.5"
            required
            placeholder="5"
            className={inputClass}
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-700 hover:shadow-lg disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? "submitting…" : "submit"}
      </button>
    </form>
  );
}
