// frontend/src/App.jsx (Update the top portion)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import LandingPage from './LandingPage';
import Login from './Login'; // <-- Import the new Login component

export default function App() {
  // Check if they have a token in local storage
  const isAuthenticated = !!localStorage.getItem('token'); 

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}