import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LandingPage from './components/LandingPage';
import ClientDashboard from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';
import PaymentUI from './components/PaymentUI';

function App() {
  const [user, setUser] = useState(null); // null = not logged in, 'client' or 'admin'
  const [userProfile, setUserProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '👤',
    product: {
      type: 'Solar Freezer Model SF-200',
      status: 'Active',
      batteryLevel: 85,
      temperature: 3,
      nextPayment: '2025-01-20'
    }
  });

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage setUser={setUser} />} />
          <Route 
            path="/client-dashboard" 
            element={
              user === 'client' ? 
                <ClientDashboard userProfile={userProfile} setUserProfile={setUserProfile} /> : 
                <Navigate to="/" />
            } 
          />
          <Route 
            path="/admin-dashboard" 
            element={
              user === 'admin' ? 
                <AdminDashboard /> : 
                <Navigate to="/" />
            } 
          />
          <Route path="/payment" element={<PaymentUI />} />
          <Route path="/demo-client" element={<ClientDashboard userProfile={userProfile} setUserProfile={setUserProfile} />} />
          <Route path="/demo-admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
