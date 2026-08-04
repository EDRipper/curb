import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 text-zinc-900">
      <p className="text-sm text-zinc-500">signed in with hack club</p>
      <h1 className="mt-1 text-2xl font-bold">hey, {session.name}</h1>
      <p className="mt-3 text-sm text-zinc-600">{session.email}</p>
      <p className="mt-6 text-sm leading-6 text-zinc-600">
        the submission form isn&apos;t built yet — this page just proves
        sign-in works end to end.
      </p>
      <a href="/logout" className="mt-6 text-sm font-semibold underline">
        sign out
      </a>
    </div>
  );
}
