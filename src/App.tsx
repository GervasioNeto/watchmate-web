import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AddSeriesPage } from '@/routes/AddSeriesPage';
import { AppLayout } from '@/routes/AppLayout';
import { CouplePage } from '@/routes/CouplePage';
import { HomePage } from '@/routes/HomePage';
import { InboxPage } from '@/routes/InboxPage';
import { LoginPage } from '@/routes/LoginPage';
import { MyListPage } from '@/routes/MyListPage';
import { OnboardingPage } from '@/routes/OnboardingPage';
import { ProfilePage } from '@/routes/ProfilePage';
import { RequireAuth } from '@/routes/RequireAuth';
import { RootLayout } from '@/routes/RootLayout';
import { SeriesDetailPage } from '@/routes/SeriesDetailPage';

const queryClient = new QueryClient();

// As páginas de quem já entrou ficam dentro do AppLayout (a barra de destinos); a entrada,
// o login e a escolha da dupla ficam fora, em tela cheia.
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      {
        path: '/onboarding',
        element: (
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        ),
      },
      {
        element: <AppLayout />,
        children: [
          { path: '/my-list', element: <MyListPage /> },
          { path: '/series/add', element: <AddSeriesPage /> },
          { path: '/series/:seriesId', element: <SeriesDetailPage /> },
          { path: '/couple', element: <CouplePage /> },
          { path: '/inbox', element: <InboxPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
