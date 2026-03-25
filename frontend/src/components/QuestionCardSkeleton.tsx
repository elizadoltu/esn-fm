import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuestionCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        {/* Sender */}
        <Skeleton className="h-3 w-20 rounded" />
        {/* Question text */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
        </div>
        {/* Answer textarea placeholder */}
        <Skeleton className="h-20 w-full rounded-md" />
        {/* Action buttons */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
