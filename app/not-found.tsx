import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 text-zinc-900">
      <h1 className="text-2xl font-bold">page not found</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        nothing here. probably a bad link.
      </p>
      <Link href="/" className="mt-6 text-sm font-semibold underline">
        back to curb
      </Link>
    </main>
  );
}
