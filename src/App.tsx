import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AddSeriesPage } from '@/routes/AddSeriesPage';
import { HomePage } from '@/routes/HomePage';
import { LoginPage } from '@/routes/LoginPage';
import { OnboardingPage } from '@/routes/OnboardingPage';
import { RequireAuth } from '@/routes/RequireAuth';
import { SeriesDetailPage } from '@/routes/SeriesDetailPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
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
              path="/"
              element={
                <RequireAuth>
                  <HomePage />
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
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
