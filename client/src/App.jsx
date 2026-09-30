import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContext } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import MyRegistrations from './pages/MyRegistrations';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/admin/Dashboard';
import ManageEvents from './pages/admin/ManageEvents';
import Registrations from './pages/admin/Registrations';

/**
 * ProtectedRoute — redirects to /admin/login when adminToken is absent.
 */
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  function handleToastClose() {
    setToast(null);
  }

  return (
    <ToastContext.Provider value={showToast}>
      <BrowserRouter>
        <Routes>
          {/* Auth pages — no Navbar/Footer wrapper */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/admin/login" element={<AuthPage />} />

          {/* Everything else gets Navbar + Footer */}
          <Route
            path="*"
            element={
              <>
                <Navbar />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/:id" element={<EventDetail />} />
                  <Route path="/my-registrations" element={<MyRegistrations />} />

                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/events"
                    element={
                      <ProtectedRoute>
                        <ManageEvents />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/registrations"
                    element={
                      <ProtectedRoute>
                        <Registrations />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Footer />
              </>
            }
          />
        </Routes>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={handleToastClose}
          />
        )}
      </BrowserRouter>
    </ToastContext.Provider>
  );
}
