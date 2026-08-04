import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function Dashboard() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const submissions = await db.submission.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-zinc-900">
      <p className="text-sm text-zinc-500">signed in with hack club</p>
      <h1 className="mt-1 text-2xl font-bold">hey, {session.name}</h1>
      <p className="mt-3 text-sm text-zinc-600">{session.email}</p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          new submission
        </Link>
        <a href="/logout" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">
          sign out
        </a>
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        your submissions
      </h2>

      {submissions.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">nothing submitted yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {submissions.map((s) => (
            <li key={s.id} className="rounded-lg border border-zinc-200 p-4">
              <div className="flex items-center justify-between">
                <a
                  href={s.siteUrl}
                  className="font-medium underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.siteUrl}
                </a>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                  {s.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">{s.description}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {s.hoursClaimed}h claimed &middot; submitted{" "}
                {s.createdAt.toISOString().slice(0, 10)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
