import Link from "next/link";
import { getSession } from "@/lib/auth";
import SubmitForm from "./SubmitForm";

export const dynamic = "force-dynamic";

export default async function Submit() {
  const session = await getSession();

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-zinc-900">
      <Link href="/" className="mb-8 block text-sm text-zinc-500 hover:text-zinc-900">
        &larr; back
      </Link>

      {!session ? (
        <>
          <h1 className="text-2xl font-bold">sign in to submit</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            we need your hack club account to know who to credit (and where
            to ship your reward).
          </p>
          <a
            href="/login"
            className="mt-6 inline-block rounded-md bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            sign in with hack club
          </a>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">submit your fix</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            after you submit, run the accessibility audit from your
            dashboard — it crawls both urls with a real headless browser
            and scores them with axe-core.
          </p>
          <SubmitForm />
        </>
      )}
    </div>
  );
}
