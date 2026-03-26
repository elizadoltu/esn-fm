import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { useSSE } from "@/hooks/useSSE";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import Navbar from "@/components/Navbar";
import { hasCompletedOnboarding } from "@/lib/onboarding";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const InboxPage = lazy(() => import("@/pages/InboxPage"));
const AskPage = lazy(() => import("@/pages/AskPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const ExplorePage = lazy(() => import("@/pages/ExplorePage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const MessagesPage = lazy(() => import("@/pages/MessagesPage"));
const ConversationPage = lazy(() => import("@/pages/ConversationPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const DailyQArchivePage = lazy(() => import("@/pages/DailyQArchivePage"));
const DailyQDetailPage = lazy(() => import("@/pages/DailyQDetailPage"));

function RequireAuth({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireOnboarding({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && hasCompletedOnboarding(user.id))
    return <Navigate to="/home" replace />;
  return <>{children}</>;
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
  useSSE();
  usePushSubscription();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/ask/:username" element={<AskPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/daily-q/archive" element={<DailyQArchivePage />} />
        <Route path="/daily-q/:id" element={<DailyQDetailPage />} />
        <Route path="/:username" element={<ProfilePage />} />

        {/* Protected */}
        <Route
          path="/home"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/inbox"
          element={
            <RequireAuth>
              <InboxPage />
            </RequireAuth>
          }
        />
        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <NotificationsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/messages"
          element={
            <RequireAuth>
              <MessagesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/messages/:username"
          element={
            <RequireAuth>
              <ConversationPage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />

        {/* Onboarding */}
        <Route
          path="/onboarding"
          element={
            <RequireOnboarding>
              <OnboardingPage />
            </RequireOnboarding>
          }
        />

        {/* Default */}
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? "/home" : "/login"} replace />
          }
        />
      </Routes>
      </Suspense>
    </div>
  );
}
