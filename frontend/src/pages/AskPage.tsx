import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/context/AuthContext';
import { sendQuestion } from '@/api/questions.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AskPage() {
  const { username } = useParams<{ username: string }>();
  const { user: me } = useAuth();

  const { data: profile } = useProfile(username ?? '');

  const [content, setContent] = useState('');
  const [senderName, setSenderName] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      await sendQuestion({
        recipient_username: username,
        content,
        sender_name: anonymous ? undefined : (senderName || me?.display_name),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send question.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4">
        <CheckCircle2 className="h-12 w-12 text-primary" />
        <p className="text-lg font-semibold">Question sent!</p>
        <p className="text-sm text-muted-foreground">
          {profile?.display_name ?? username} will see it in their inbox.
        </p>
        <Button variant="outline" size="sm" asChild>
          <a href={`/${username}`}>Back to profile</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Ask {profile?.display_name ?? username}</CardTitle>
          <CardDescription>@{username}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="content">Your question</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What would you like to ask?"
                maxLength={500}
                rows={4}
                required
              />
              <p className="text-right text-xs text-muted-foreground">{content.length}/500</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="anonymous"
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <Label htmlFor="anonymous" className="cursor-pointer font-normal">
                Send anonymously
              </Label>
            </div>

            {!anonymous && (
              <div className="space-y-1.5">
                <Label htmlFor="senderName">Your name (optional)</Label>
                <Input
                  id="senderName"
                  type="text"
                  placeholder={me?.display_name ?? 'Your name'}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  maxLength={60}
                />
              </div>
            )}

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading || !content.trim()}>
              {loading ? 'Sending…' : 'Send question'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
