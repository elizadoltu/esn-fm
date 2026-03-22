import { Link, useNavigate } from "react-router-dom";
import { LogOut, Inbox, User, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-bold text-primary">
          <MessageSquare className="h-5 w-5" />
          <span>ESN FM</span>
        </Link>

        {/* Nav actions */}
        <nav className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link
                  to={`/${user.username}`}
                  className="flex items-center gap-1.5"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">@{user.username}</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/inbox" className="flex items-center gap-1.5">
                  <Inbox className="h-4 w-4" />
                  <span className="hidden sm:inline">Inbox</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
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
      </div>
    </header>
  );
}
