import Link from "next/link";
import { WarningIcon } from "../WarningIcon";

export default function LoginError() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 text-zinc-900">
      <WarningIcon className="h-8 w-8 text-red-600" />
      <h1 className="mt-4 text-2xl font-bold">sign-in didn&apos;t work</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        something went wrong talking to hack club auth. try again, or open
        an issue on github if it keeps happening.
      </p>
      <div className="mt-6 flex gap-4">
        <Link href="/login" className="text-sm font-semibold underline">
          try again
        </Link>
        <a
          href="https://github.com/EDRipper/curb/issues"
          className="text-sm font-semibold underline"
        >
          report an issue
        </a>
      </div>
    </main>
  );
}
