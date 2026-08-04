import { Skeleton } from "../Skeleton";

export default function ReviewLoading() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16 text-zinc-900">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>

      <Skeleton className="mt-8 h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-56" />

      <Skeleton className="mt-8 h-4 w-40" />
      <div className="mt-3 space-y-4">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    </main>
  );
}
