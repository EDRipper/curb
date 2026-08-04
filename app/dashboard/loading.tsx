import { Skeleton } from "../Skeleton";

export default function DashboardLoading() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-zinc-900">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-48" />

      <div className="mt-8 flex gap-3">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-28" />
      </div>

      <Skeleton className="mt-8 h-20 w-full" />

      <Skeleton className="mt-10 h-4 w-32" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </main>
  );
}
