import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import FamilyDetails from './pages/FamilyDetails.jsx';
import MapPage from './pages/MapPage.jsx';
import Alerts from './pages/Alerts.jsx';
import Inventory from './pages/Inventory.jsx';
import MyMissions from './pages/MyMissions.jsx';
import VisitCheckin from './pages/VisitCheckin.jsx';
import Users from './pages/Users.jsx';

const ADMIN_COORD = ['ADMIN', 'COORDINATOR'];

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={ADMIN_COORD}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-missions"
            element={
              <ProtectedRoute>
                <MyMissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visits/:id/checkin"
            element={
              <ProtectedRoute>
                <VisitCheckin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/families/:id"
            element={
              <ProtectedRoute allowedRoles={ADMIN_COORD}>
                <FamilyDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute allowedRoles={ADMIN_COORD}>
                <MapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute allowedRoles={ADMIN_COORD}>
                <Alerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRoles={ADMIN_COORD}>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
