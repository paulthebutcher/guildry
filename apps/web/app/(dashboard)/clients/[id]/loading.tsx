import { Skeleton } from "@/components/ui";

export default function ClientDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link skeleton */}
      <div className="mb-6">
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Card skeleton */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <Skeleton className="h-9 w-64 mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
          <Skeleton className="h-8 w-16" />
        </div>

        {/* Fields */}
        <div className="space-y-6">
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
