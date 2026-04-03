import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SessionDetail from './pages/SessionDetail';
import ValidatePayment from './pages/ValidatePayment';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminSessionForm from './pages/AdminSessionForm';
import AdminSessionBookings from './pages/AdminSessionBookings';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-laser-dark">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/session/:id" element={<SessionDetail />} />
          <Route path="/validate-payment" element={<ValidatePayment />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions/new"
            element={
              <ProtectedRoute>
                <AdminSessionForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions/:id/edit"
            element={
              <ProtectedRoute>
                <AdminSessionForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions/:id/bookings"
            element={
              <ProtectedRoute>
                <AdminSessionBookings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
