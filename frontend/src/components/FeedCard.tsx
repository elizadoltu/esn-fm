import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FeedItem } from "@/api/answers.api";

interface FeedCardProps {
  item: FeedItem;
  onLike: (answerId: string) => void;
  isAuthenticated: boolean;
}

export default function FeedCard({
  item,
  onLike,
  isAuthenticated,
}: FeedCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        {/* Question */}
        <div className="mb-4 rounded-lg bg-muted/60 px-4 py-3">
          <p className="mb-1 text-xs text-muted-foreground">
            {item.sender_name ? item.sender_name : "Anonymous"} asked
          </p>
          <p className="text-sm font-medium text-foreground">{item.question}</p>
        </div>

        {/* Answer */}
        <p className="text-sm text-foreground">{item.answer}</p>

        {/* Footer */}
        <div className="mt-4 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => isAuthenticated && onLike(item.answer_id)}
            className={
              item.liked_by_me
                ? "text-primary hover:text-primary"
                : "text-muted-foreground hover:text-primary"
            }
            disabled={!isAuthenticated}
            title={isAuthenticated ? undefined : "Sign in to like"}
          >
            <Heart
              className={`h-4 w-4 ${item.liked_by_me ? "fill-current" : ""}`}
            />
            <span className="text-xs">{item.likes}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
