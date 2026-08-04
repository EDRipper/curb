"use client";

import { useEffect } from "react";
import Link from "next/link";
import { WarningIcon } from "./WarningIcon";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="dot-grid-bg flex min-h-screen flex-col bg-[#fdfaf3] text-zinc-900">
      <header className="mx-auto w-full max-w-2xl px-6 pt-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          curb
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6">
        <WarningIcon className="h-8 w-8 text-red-600" />
        <h1 className="mt-4 text-2xl font-bold">something broke</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          that&apos;s on us, not you. try again, or head back and try a
          different page.
        </p>
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => retry()}
            className="text-sm font-semibold underline"
          >
            try again
          </button>
          <Link href="/" className="text-sm font-semibold underline">
            back to curb
          </Link>
        </div>
      </main>
    </div>
  );
}
