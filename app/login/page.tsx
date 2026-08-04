import Link from "next/link";

export default function Login() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 text-zinc-900">
      <Link href="/" className="mb-8 text-sm text-zinc-500 hover:text-zinc-900">
        &larr; back
      </Link>
      <h1 className="text-2xl font-bold">sign-in is being wired up</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        curb signs in with{" "}
        <a href="https://auth.hackclub.com" className="underline">
          Hack Club Auth
        </a>{" "}
        so we can verify you&apos;re a teen and pull your slack id — no
        separate account needed. the oauth flow lands in the next build
        pass.
      </p>
    </div>
  );
}
