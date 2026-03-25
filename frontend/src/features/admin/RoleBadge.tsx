const ROLE_CLASSES: Record<string, string> = {
  admin: "bg-destructive/20 text-destructive",
  moderator: "bg-primary/20 text-primary",
};

export default function RoleBadge({ role }: Readonly<{ role: string }>) {
  const cls = ROLE_CLASSES[role] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {role}
    </span>
  );
}
