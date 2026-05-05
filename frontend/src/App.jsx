// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Mock components (you can build these out in separate files later)
const Login = () => <div className="p-10 text-white">Login Page (Insert Form Here)</div>
const Dashboard = () => <div className="p-10 text-white">Your SaaS App Goes Here</div>

export default function App() {
  // In reality, this checks your Django Token/Cookie
  const isAuthenticated = false; 

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}