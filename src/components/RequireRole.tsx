import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const RequireRole: React.FC<{ role: UserRole; children: React.ReactNode }> = ({
  role,
  children,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-teal-700 animate-pulse">Checking your account…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location, openAuth: true }} replace />;
  }

  if (user.role !== role) {
    return <Navigate to={user.role === 'host' ? '/host/dashboard' : '/discover'} replace />;
  }

  return <>{children}</>;
};

export const RoleHomeRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-teal-700 animate-pulse">Loading Gotham…</p>
      </div>
    );
  }

  if (user?.role === 'host') {
    return <Navigate to="/host/dashboard" replace />;
  }

  return <Navigate to="/discover" replace />;
};
