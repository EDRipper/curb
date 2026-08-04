import type { Metadata } from "next";
import Link from "next/link";
import { WarningIcon } from "../WarningIcon";

export const metadata: Metadata = {
  title: "sign-in didn't work — curb",
};

export default function LoginError() {
  return (
    <div className="dot-grid-bg flex min-h-screen flex-col bg-[#fdfaf3] text-zinc-900">
      <header className="mx-auto w-full max-w-2xl px-6 pt-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          curb
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6">
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
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold underline"
          >
            report an issue
          </a>
        </div>
      </main>
    </div>
  );
}
