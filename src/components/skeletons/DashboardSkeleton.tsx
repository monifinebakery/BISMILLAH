import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>

      {/* Main Content Area */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart */}
        <div className="col-span-1 lg:col-span-4">
          <Skeleton className="h-[350px] w-full" />
        </div>

        {/* Side Panel / Recent Sales */}
        <div className="col-span-1 lg:col-span-3">
          <Skeleton className="h-[350px] w-full" />
        </div>
      </div>

      {/* Bottom Table / Recent Orders */}
       <div>
          <Skeleton className="h-8 w-40 mb-4" />
          <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}