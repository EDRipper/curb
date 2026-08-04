"use client";

import { useEffect } from "react";
import Link from "next/link";

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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 text-zinc-900">
      <h1 className="text-2xl font-bold">something broke</h1>
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
  );
}
