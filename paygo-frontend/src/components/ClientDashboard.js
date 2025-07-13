import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ClientDashboard = ({ userProfile, setUserProfile }) => {
  const [showProductForm, setShowProductForm] = useState(!userProfile.product);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState({
    productType: '',
    paymentFrequency: 'monthly'
  });

  const productOptions = [
    { value: 'sf-200', label: 'Solar Freezer SF-200', price: 'KSh 500/week' },
    { value: 'sr-150', label: 'Solar Refrigerator SR-150', price: 'KSh 350/week' },
    { value: 'cf-400', label: 'Commercial Freezer CF-400', price: 'KSh 800/week' }
  ];

  const paymentHistory = [
    { date: '2025-01-06', amount: 'KSh 1,500', status: 'Paid', method: 'M-Pesa' },
    { date: '2024-12-06', amount: 'KSh 1,500', status: 'Paid', method: 'M-Pesa' },
    { date: '2024-11-06', amount: 'KSh 1,500', status: 'Paid', method: 'Mobile Money' },
    { date: '2024-10-06', amount: 'KSh 1,500', status: 'Paid', method: 'M-Pesa' }
  ];

  const handleProductSubmit = (e) => {
    e.preventDefault();
    // Simulate sending request to admin
    alert('Your product request has been sent to our admin team. You will be contacted within 24 hours!');
    setShowProductForm(false);
  };

  const handlePayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      alert('Payment successful! Your device status has been updated.');
      setShowPaymentModal(false);
    }, 2000);
  };

  return (
    <div className="client-dashboard">
      {/* Navigation */}
      <nav className="nav">
        <div className="container d-flex justify-between align-center">
          <Link to="/" className="nav-brand">
            🌞 Drop Access PayGo
          </Link>
          <div className="d-flex align-center gap-3">
            <span>Welcome, {userProfile.name} {userProfile.avatar}</span>
            <Link to="/" className="btn btn-outline">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="container" style={{ padding: '40px 20px' }}>
        {/* Welcome Header */}
        <div className="card mb-4">
          <div className="d-flex align-center gap-3 mb-3">
            <div style={{ 
              fontSize: '3rem',
              background: 'var(--cream-bg)',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {userProfile.avatar}
            </div>
            <div>
              <h1>Welcome back, {userProfile.name}!</h1>
              <p style={{ margin: 0, color: 'var(--medium-gray)' }}>
                {userProfile.email}
              </p>
            </div>
          </div>
        </div>

        {/* Product Section */}
        {userProfile.product && !showProductForm ? (
          <div className="grid grid-2">
            {/* Your Product Card */}
            <div className="card">
              <div className="card-header">
                <h3>Your Product</h3>
              </div>
              
              <div className="d-flex align-center gap-3 mb-3">
                <div style={{ fontSize: '3rem' }}>❄️</div>
                <div>
                  <h4>{userProfile.product.type}</h4>
                  <span className={`status ${userProfile.product.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                    {userProfile.product.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-2 gap-2 mb-3">
                <div>
                  <label className="form-label">Battery Level</label>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${userProfile.product.batteryLevel}%` }}
                    ></div>
                  </div>
                  <small>{userProfile.product.batteryLevel}%</small>
                </div>
                <div>
                  <label className="form-label">Internal Temperature</label>
                  <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: '600',
                    color: 'var(--primary-green)'
                  }}>
                    {userProfile.product.temperature}°C
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Next Payment Due</label>
                <div style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: '600',
                  color: 'var(--orange-highlight)'
                }}>
                  {userProfile.product.nextPayment}
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="card">
              <div className="card-header">
                <h3>Quick Actions</h3>
              </div>
              
              <div className="d-flex flex-column gap-3">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowPaymentModal(true)}
                >
                  💳 Make Payment
                </button>
                <button className="btn btn-outline">
                  📊 View Usage History
                </button>
                <button className="btn btn-outline">
                  ⚙️ Update Profile
                </button>
                <button className="btn btn-outline">
                  📞 Contact Support
                </button>
              </div>

              <div className="mt-4">
                <h4>Recent Activity</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li className="d-flex justify-between align-center p-2" style={{ borderBottom: '1px solid var(--light-gray)' }}>
                    <span>Device activated</span>
                    <small>2 hours ago</small>
                  </li>
                  <li className="d-flex justify-between align-center p-2" style={{ borderBottom: '1px solid var(--light-gray)' }}>
                    <span>Payment received</span>
                    <small>1 day ago</small>
                  </li>
                  <li className="d-flex justify-between align-center p-2">
                    <span>Temperature alert resolved</span>
                    <small>3 days ago</small>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* Product Selection Form */
          <div className="card">
            <div className="card-header">
              <h3>Select Your Product</h3>
              <p>Choose a solar refrigeration solution that fits your needs</p>
            </div>
            
            <form onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label className="form-label">Product Type</label>
                <select 
                  className="form-select"
                  value={formData.productType}
                  onChange={(e) => setFormData({...formData, productType: e.target.value})}
                  required
                >
                  <option value="">Select a product...</option>
                  {productOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Frequency</label>
                <div className="d-flex gap-2">
                  {['weekly', 'monthly', 'yearly'].map(freq => (
                    <label key={freq} className="d-flex align-center gap-1">
                      <input 
                        type="radio"
                        name="paymentFrequency"
                        value={freq}
                        checked={formData.paymentFrequency === freq}
                        onChange={(e) => setFormData({...formData, paymentFrequency: e.target.value})}
                      />
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary">
                Submit Request to Admin
              </button>
            </form>
          </div>
        )}

        {/* Payment History */}
        {userProfile.product && (
          <div className="card mt-4">
            <div className="card-header">
              <h3>Payment History</h3>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--light-gray)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--light-gray)' }}>
                      <td style={{ padding: '12px' }}>{payment.date}</td>
                      <td style={{ padding: '12px', fontWeight: '600' }}>{payment.amount}</td>
                      <td style={{ padding: '12px' }}>
                        <span className="status status-active">{payment.status}</span>
                      </td>
                      <td style={{ padding: '12px' }}>{payment.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', margin: 0 }}>
            <div className="card-header d-flex justify-between align-center">
              <h3>Make Payment</h3>
              <button 
                onClick={() => setShowPaymentModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            <div>
              <h4>Payment Amount: KSh 1,500</h4>
              <p>Monthly payment for Solar Freezer SF-200</p>
              
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <div className="d-flex flex-column gap-2">
                  <button className="btn btn-outline d-flex align-center gap-2">
                    📱 M-Pesa STK Push
                  </button>
                  <button className="btn btn-outline d-flex align-center gap-2">
                    💳 Mobile Money
                  </button>
                  <button className="btn btn-outline d-flex align-center gap-2">
                    🏦 Bank Transfer
                  </button>
                </div>
              </div>
              
              <div className="d-flex gap-2 mt-3">
                <button 
                  className="btn btn-primary"
                  onClick={handlePayment}
                  style={{ flex: 1 }}
                >
                  Process Payment
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowPaymentModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard; 