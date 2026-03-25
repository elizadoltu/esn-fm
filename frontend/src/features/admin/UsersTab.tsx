import { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { useAdminUsers, useUpdateUserRole } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RoleBadge from "@/features/admin/RoleBadge";
import DeleteUserModal from "@/features/admin/DeleteUserModal";
import type { DeleteUserTarget } from "@/types/admin";
import { useAuth } from "@/context/useAuth";

interface UsersTabProps {
  isAdmin: boolean;
}

export default function UsersTab({ isAdmin }: Readonly<UsersTabProps>) {
  const { user: me } = useAuth();
  const [userSearch, setUserSearch] = useState("");
  const [userOffset, setUserOffset] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<DeleteUserTarget | null>(
    null
  );

  const {
    data: usersData,
    isLoading,
    error,
  } = useAdminUsers({
    q: userSearch || undefined,
    offset: userOffset,
  });
  const updateRole = useUpdateUserRole();

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={userSearch}
          onChange={(e) => {
            setUserSearch(e.target.value);
            setUserOffset(0);
          }}
          placeholder="Search by username, name, or email…"
          className="pl-9"
        />
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      )}
      {error && (
        <p className="text-sm text-destructive">Failed to load users.</p>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {["User", "Email", "Role", "Answers", "Joined", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {usersData?.users.map((u) => (
              <tr
                key={u.id}
                className="border-t border-border hover:bg-accent/30"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{u.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      @{u.username}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-4 py-3">{u.answer_count}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <select
                        value={u.role}
                        onChange={(e) =>
                          updateRole.mutate({
                            id: u.id,
                            role: e.target.value as
                              | "user"
                              | "moderator"
                              | "admin",
                          })
                        }
                        className="rounded border border-border bg-background px-2 py-1 text-xs"
                      >
                        <option value="user">user</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                    {isAdmin && u.id !== me?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        title="Delete account"
                        onClick={() =>
                          setDeleteTarget({
                            id: u.id,
                            display_name: u.display_name,
                            username: u.username,
                            email: u.email,
                          })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          {usersData?.total ?? 0} total users
        </p>
        <div className="flex gap-2">
          {userOffset > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserOffset((o) => o - 20)}
            >
              Previous
            </Button>
          )}
          {(usersData?.users.length ?? 0) === 20 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserOffset((o) => o + 20)}
            >
              Next
            </Button>
          )}
        </div>
      </div>

      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
