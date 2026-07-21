import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskPage from './pages/TaskPage';

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'hsl(224, 25%, 12%)',
                color: 'hsl(210, 40%, 98%)',
                border: '1px solid hsl(224, 20%, 20%)',
                borderRadius: '12px',
                fontSize: '0.9rem',
              },
              success: { iconTheme: { primary: 'hsl(145, 63%, 45%)', secondary: 'hsl(224, 25%, 12%)' } },
              error: { iconTheme: { primary: 'hsl(355, 78%, 56%)', secondary: 'hsl(224, 25%, 12%)' } },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/project/:id/tasks" element={<PrivateRoute><TaskPage /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
