import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
      <Skeleton className="h-[400px] rounded-xl" />
    </div>
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);

export const TableSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-24" />
    </div>
    <div className="border rounded-md">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center p-4 border-b last:border-0 gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  </div>
);
