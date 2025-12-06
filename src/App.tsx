import { useAdminStore } from './store';
import { LoginPage, DashboardPage } from './pages';

export default function App() {
  const { isLoggedIn } = useAdminStore();
  
  return isLoggedIn ? <DashboardPage /> : <LoginPage />;
}
