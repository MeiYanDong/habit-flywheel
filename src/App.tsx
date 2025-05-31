import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppStateProvider } from "./contexts/AppStateContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Index from "./pages/Index";
import Groups from "./pages/Groups";
import Habits from "./pages/Habits";
import Rewards from "./pages/Rewards";
import History from "./pages/History";
import GroupDetail from "./pages/GroupDetail";
import Today from "./pages/Today";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// 社区相关页面
import Community from "./pages/Community";
import PostDetail from "./pages/PostDetail";
import UserProfile from "./pages/UserProfile";
import ProfileEdit from "./pages/ProfileEdit";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <AppStateProvider>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Today />} />
                      <Route path="/groups" element={<Groups />} />
                      <Route path="/habits" element={<Habits />} />
                      <Route path="/rewards" element={<Rewards />} />
                      <Route path="/history" element={<History />} />
                      <Route path="/group/:id" element={<GroupDetail />} />
                      
                      {/* 社区相关路由 */}
                      <Route path="/community" element={<Community />} />
                      <Route path="/community/post/:id" element={<PostDetail />} />
                      <Route path="/community/user/:id" element={<UserProfile />} />
                      <Route path="/community/profile/edit" element={<ProfileEdit />} />
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </AppStateProvider>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

