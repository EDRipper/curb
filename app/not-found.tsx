import type { Metadata } from "next";
import Link from "next/link";
import { NotFoundIcon } from "./NotFoundIcon";

export const metadata: Metadata = {
  title: "page not found — curb",
};

export default function NotFound() {
  return (
    <div className="dot-grid-bg flex min-h-screen flex-col bg-[#fdfaf3] text-zinc-900">
      <header className="mx-auto w-full max-w-2xl px-6 pt-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          curb
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6">
        <NotFoundIcon className="h-8 w-8 text-zinc-400" />
        <h1 className="mt-4 text-2xl font-bold">page not found</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          nothing here. probably a bad link.
        </p>
        <Link href="/" className="mt-6 text-sm font-semibold underline">
          back to curb
        </Link>
      </main>
    </div>
  );
}
