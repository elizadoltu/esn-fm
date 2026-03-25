import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeedCardSkeleton({
  showAuthor = false,
}: {
  showAuthor?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        {/* Author row */}
        {showAuthor && (
          <div className="mb-3 flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        )}

        {/* Question box */}
        <div className="mb-4 rounded-lg bg-muted/60 px-4 py-3 space-y-2">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>

        {/* Answer lines */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>

        {/* Footer actions */}
        <div className="mt-4 flex items-center gap-2">
          <Skeleton className="h-7 w-14 rounded-md" />
          <Skeleton className="h-7 w-14 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
