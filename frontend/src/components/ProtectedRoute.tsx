import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, isInitializing } = useAuth();
  const location = useLocation();
  if (isInitializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if(!user){
    return <Navigate to="/login" state={{from:location}} replace/>;
  }

  return <Outlet />;
}