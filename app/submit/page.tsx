import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import SubmitForm from "./SubmitForm";

export const metadata: Metadata = {
  title: "submit a fix — curb",
};

export const dynamic = "force-dynamic";

export default async function Submit() {
  const session = await getSession();

  return (
    <div className="dot-grid-bg min-h-screen bg-[#fdfaf3] text-zinc-900">
      <header className="mx-auto max-w-2xl px-6 pt-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          curb
        </Link>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/" className="mb-8 block text-sm text-zinc-500 hover:text-zinc-900">
          &larr; back
        </Link>

        {!session ? (
          <>
            <h1 className="fade-up text-2xl font-bold">sign in to submit</h1>
            <p className="fade-up mt-3 text-sm leading-6 text-zinc-600 [animation-delay:80ms]">
              we need your hack club account to know who to credit (and where
              to ship your reward).
            </p>
            <Link
              href="/login"
              className="fade-up mt-6 inline-block rounded-md bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-700 hover:shadow-lg [animation-delay:160ms]"
            >
              sign in with hack club
            </Link>
          </>
        ) : (
          <>
            <h1 className="fade-up text-2xl font-bold">submit your fix</h1>
            <p className="fade-up mt-3 text-sm leading-6 text-zinc-600 [animation-delay:80ms]">
              after you submit, run the accessibility audit from your
              dashboard — it crawls both urls with a real headless browser
              and scores them with axe-core.
            </p>
            <div className="fade-up [animation-delay:160ms]">
              <SubmitForm />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
