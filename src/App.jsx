import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './App.css'

// Import pages
import Login from './pages/Login'
import ManagerDashboard from './pages/ManagerDashboard'
import PantryDashboard from './pages/PantryDashboard'
import DeliveryDashboard from './pages/DeliveryDashboard'

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />
  }

  return children
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/manager"
            element={
              <PrivateRoute allowedRoles={['manager']}>
                <ManagerDashboard />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/pantry"
            element={
              <PrivateRoute allowedRoles={['pantry']}>
                <PantryDashboard />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/delivery"
            element={
              <PrivateRoute allowedRoles={['delivery']}>
                <DeliveryDashboard />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/"
            element={
              <Navigate
                to={{
                  '/manager': '/manager',
                  '/pantry': '/pantry',
                  '/delivery': '/delivery'
                }[localStorage.getItem('user')?.role] || '/login'}
              />
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
