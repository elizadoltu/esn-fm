import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import Navbar from "@/components/Navbar";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProfilePage from "@/pages/ProfilePage";
import InboxPage from "@/pages/InboxPage";
import AskPage from "@/pages/AskPage";
import HomePage from "@/pages/HomePage";
import ExplorePage from "@/pages/ExplorePage";
import NotificationsPage from "@/pages/NotificationsPage";
import MessagesPage from "@/pages/MessagesPage";
import ConversationPage from "@/pages/ConversationPage";
import SettingsPage from "@/pages/SettingsPage";
import AdminPage from "@/pages/AdminPage";

function RequireAuth({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin" && user?.role !== "moderator") {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/ask/:username" element={<AskPage />} />
        <Route path="/:username" element={<ProfilePage />} />

        {/* Protected */}
        <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
        <Route path="/inbox" element={<RequireAuth><InboxPage /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
        <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>} />
        <Route path="/messages/:username" element={<RequireAuth><ConversationPage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />

        {/* Admin */}
        <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />

        {/* Default */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />
      </Routes>
    </div>
  );
}
