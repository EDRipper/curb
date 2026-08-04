import Link from "next/link";

export default function LoginError() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 text-zinc-900">
      <h1 className="text-2xl font-bold">sign-in didn&apos;t work</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        something went wrong talking to hack club auth. try again, or ping
        us on slack if it keeps happening.
      </p>
      <Link href="/login" className="mt-6 text-sm font-semibold underline">
        try again
      </Link>
    </div>
  );
}
