import Link from "next/link";

export default function Submit() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 text-zinc-900">
      <Link href="/" className="mb-8 text-sm text-zinc-500 hover:text-zinc-900">
        &larr; back
      </Link>
      <h1 className="text-2xl font-bold">submission form is being built</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        this will collect the site you fixed, your diff/PR link, before and
        after screenshots, and trigger an automated accessibility audit to
        score the improvement. sign-in and the audit pipeline land in the
        next few build passes — check back soon or watch the repo.
      </p>
      <a
        href="https://github.com/EDRipper/curb"
        className="mt-6 text-sm font-semibold text-zinc-900 underline"
      >
        follow progress on github
      </a>
    </div>
  );
}
