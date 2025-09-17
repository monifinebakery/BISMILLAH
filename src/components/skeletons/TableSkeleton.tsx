import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rowCount = 5, columnCount = 5 }) {
  const rows = Array.from({ length: rowCount });
  const columns = Array.from({ length: columnCount });

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      {/* Header and Actions */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Filters */}
       <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-full md:w-64" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
      </div>

      {/* Table */}
      <div className="border rounded-md">
        {/* Table Header */}
        <div className="flex bg-muted/50 p-4 border-b">
          {columns.map((_, i) => (
            <Skeleton key={i} className="h-5 w-full mx-2" />
          ))}
        </div>
        {/* Table Body */}
        <div className="divide-y">
          {rows.map((_, i) => (
            <div key={i} className="flex items-center p-4">
              {columns.map((_, j) => (
                <Skeleton key={j} className="h-6 w-full mx-2" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-end items-center gap-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
}