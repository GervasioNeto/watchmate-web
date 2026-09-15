import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AddSeriesPage } from '@/routes/AddSeriesPage';
import { HomePage } from '@/routes/HomePage';
import { LoginPage } from '@/routes/LoginPage';
import { MyListPage } from '@/routes/MyListPage';
import { OnboardingPage } from '@/routes/OnboardingPage';
import { ProfilePage } from '@/routes/ProfilePage';
import { RequireAuth } from '@/routes/RequireAuth';
import { SeriesDetailPage } from '@/routes/SeriesDetailPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/onboarding"
              element={
                <RequireAuth>
                  <OnboardingPage />
                </RequireAuth>
              }
            />
            <Route
              path="/my-list"
              element={
                <RequireAuth>
                  <MyListPage />
                </RequireAuth>
              }
            />
            <Route
              path="/series/add"
              element={
                <RequireAuth>
                  <AddSeriesPage />
                </RequireAuth>
              }
            />
            <Route
              path="/series/:seriesId"
              element={
                <RequireAuth>
                  <SeriesDetailPage />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
