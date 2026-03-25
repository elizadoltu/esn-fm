import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  Inbox,
  User,
  MessageSquare,
  Home,
  Compass,
  Bell,
  Mail,
  Menu,
  X,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useUnreadDmCount } from "@/hooks/useMessages";

function NotificationBadge({ count }: Readonly<{ count: number }>) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: unreadDmCount = 0 } = useUnreadDmCount();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
    setMenuOpen(false);
  }

  function isActive(path: string) {
    if (path === "/home") return location.pathname === "/home";
    if (path.startsWith("/@"))
      return location.pathname === `/${user?.username}`;
    return location.pathname.startsWith(path);
  }

  const activeClass = "bg-primary/15 text-primary font-medium";
  const inactiveClass =
    "text-muted-foreground hover:text-foreground hover:bg-accent";

  const navLinks =
    isAuthenticated && user
      ? [
          { to: "/home", icon: <Home className="h-5 w-5" />, label: "Home" },
          {
            to: "/explore",
            icon: <Compass className="h-5 w-5" />,
            label: "Explore",
          },
          { to: "/inbox", icon: <Inbox className="h-5 w-5" />, label: "Inbox" },
          {
            to: "/messages",
            icon: (
              <span className="relative">
                <Mail className="h-5 w-5" />
                <NotificationBadge count={unreadDmCount} />
              </span>
            ),
            label: "Messages",
          },
          {
            to: "/notifications",
            icon: (
              <span className="relative">
                <Bell className="h-5 w-5" />
                <NotificationBadge count={unreadCount} />
              </span>
            ),
            label: "Notifications",
          },
          {
            to: `/${user.username}`,
            icon: <User className="h-5 w-5" />,
            label: `@${user.username}`,
          },
          {
            to: "/settings",
            icon: <Settings className="h-5 w-5" />,
            label: "Settings",
          },
        ]
      : [];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          {/* Brand */}
          <Link
            to={isAuthenticated ? "/home" : "/"}
            className="flex items-center gap-2 font-bold text-primary"
          >
            <MessageSquare className="h-5 w-5" />
            <span>ESN FM</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {isAuthenticated && user ? (
              <>
                {navLinks.map(({ to, icon, label }) => (
                  <Button
                    key={to}
                    variant="ghost"
                    size="sm"
                    asChild
                    className={isActive(to) ? activeClass : inactiveClass}
                  >
                    <Link to={to} title={label}>
                      {icon}
                    </Link>
                  </Button>
                ))}
                {user && (user.role === "admin" || user.role === "moderator") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className={isActive("/admin") ? activeClass : inactiveClass}
                  >
                    <Link to="/admin" title="Admin Dashboard">
                      <ShieldCheck className="h-5 w-5" />
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </nav>

          {/* Mobile right side */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && (
              <Link to="/messages" className="relative p-1">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <NotificationBadge count={unreadDmCount} />
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/notifications" className="relative p-1">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <NotificationBadge count={unreadCount} />
              </Link>
            )}
            {isAuthenticated ? (
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && isAuthenticated && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 w-full cursor-default bg-black/50 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          {/* Slide-in panel */}
          <div className="fixed top-14 right-0 z-50 flex h-[calc(100dvh-3.5rem)] w-64 flex-col border-l border-border bg-card shadow-xl md:hidden">
            <nav className="flex flex-col gap-1 p-3 flex-1">
              {navLinks.map(({ to, icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive(to) ? activeClass : inactiveClass
                  }`}
                >
                  {icon}
                  {label}
                </Link>
              ))}
            </nav>

            {/* Admin section (admin/moderator only) */}
            {user && (user.role === "admin" || user.role === "moderator") && (
              <div className="border-t border-border p-3">
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Admin
                </p>
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive("/admin") ? activeClass : inactiveClass
                  }`}
                >
                  <ShieldCheck className="h-5 w-5" />
                  Admin Dashboard
                </Link>
              </div>
            )}

            {/* Logout at bottom */}
            <div className="border-t border-border p-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
