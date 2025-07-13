import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [pendingRegistrations, setPendingRegistrations] = useState([
    {
      id: 1,
      name: 'Mary Wanjiku',
      email: 'mary@example.com',
      phone: '+254 712 345 678',
      product: 'Solar Freezer SF-200',
      paymentPlan: 'Monthly',
      requestDate: '2025-01-13',
      status: 'pending'
    },
    {
      id: 2,
      name: 'James Ochieng',
      email: 'james@example.com',
      phone: '+254 723 456 789',
      product: 'Solar Refrigerator SR-150',
      paymentPlan: 'Weekly',
      requestDate: '2025-01-12',
      status: 'pending'
    },
    {
      id: 3,
      name: 'Grace Mutua',
      email: 'grace@example.com',
      phone: '+254 734 567 890',
      product: 'Commercial Freezer CF-400',
      paymentPlan: 'Monthly',
      requestDate: '2025-01-11',
      status: 'contacted'
    },
    {
      id: 4,
      name: 'David Kiprop',
      email: 'david@example.com',
      phone: '+254 745 678 901',
      product: 'Solar Freezer SF-200',
      paymentPlan: 'Yearly',
      requestDate: '2025-01-10',
      status: 'approved'
    }
  ]);

  const [metrics] = useState({
    totalClients: 247,
    activeUnits: 198,
    upcomingRenewals: 23,
    monthlyRevenue: 'KSh 2,450,000',
    conversionRate: '78%',
    averagePayment: 'KSh 1,320'
  });

  const handleContactClient = (id) => {
    setPendingRegistrations(prev => 
      prev.map(reg => 
        reg.id === id ? { ...reg, status: 'contacted' } : reg
      )
    );
    alert('Client marked as contacted. Follow-up scheduled.');
  };

  const handleApproveClient = (id) => {
    setPendingRegistrations(prev => 
      prev.map(reg => 
        reg.id === id ? { ...reg, status: 'approved' } : reg
      )
    );
    alert('Client approved! Device will be prepared for delivery.');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'contacted': return 'status-inactive';
      case 'approved': return 'status-active';
      default: return 'status-pending';
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Navigation */}
      <nav className="nav">
        <div className="container d-flex justify-between align-center">
          <Link to="/" className="nav-brand">
            🌞 Drop Access PayGo - Admin
          </Link>
          <div className="d-flex align-center gap-3">
            <span>Admin Panel 👨‍💼</span>
            <Link to="/" className="btn btn-outline">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="container" style={{ padding: '40px 20px' }}>
        {/* Header */}
        <div className="mb-4">
          <h1>Admin Dashboard</h1>
          <p style={{ color: 'var(--medium-gray)' }}>
            Manage client registrations and monitor platform performance
          </p>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-3 mb-4">
          <div className="card text-center">
            <div style={{ 
              fontSize: '3rem', 
              color: 'var(--primary-green)', 
              marginBottom: '1rem' 
            }}>
              👥
            </div>
            <h3 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>
              {metrics.totalClients}
            </h3>
            <p style={{ margin: 0, color: 'var(--medium-gray)' }}>Total Clients</p>
          </div>

          <div className="card text-center">
            <div style={{ 
              fontSize: '3rem', 
              color: 'var(--primary-green)', 
              marginBottom: '1rem' 
            }}>
              ❄️
            </div>
            <h3 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>
              {metrics.activeUnits}
            </h3>
            <p style={{ margin: 0, color: 'var(--medium-gray)' }}>Active Units</p>
          </div>

          <div className="card text-center">
            <div style={{ 
              fontSize: '3rem', 
              color: 'var(--orange-highlight)', 
              marginBottom: '1rem' 
            }}>
              📅
            </div>
            <h3 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>
              {metrics.upcomingRenewals}
            </h3>
            <p style={{ margin: 0, color: 'var(--medium-gray)' }}>Upcoming Renewals</p>
          </div>

          <div className="card text-center">
            <div style={{ 
              fontSize: '3rem', 
              color: 'var(--primary-green)', 
              marginBottom: '1rem' 
            }}>
              💰
            </div>
            <h3 style={{ fontSize: '1.8rem', margin: '0.5rem 0' }}>
              {metrics.monthlyRevenue}
            </h3>
            <p style={{ margin: 0, color: 'var(--medium-gray)' }}>Monthly Revenue</p>
          </div>

          <div className="card text-center">
            <div style={{ 
              fontSize: '3rem', 
              color: 'var(--primary-green)', 
              marginBottom: '1rem' 
            }}>
              📈
            </div>
            <h3 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>
              {metrics.conversionRate}
            </h3>
            <p style={{ margin: 0, color: 'var(--medium-gray)' }}>Conversion Rate</p>
          </div>

          <div className="card text-center">
            <div style={{ 
              fontSize: '3rem', 
              color: 'var(--primary-green)', 
              marginBottom: '1rem' 
            }}>
              💳
            </div>
            <h3 style={{ fontSize: '1.8rem', margin: '0.5rem 0' }}>
              {metrics.averagePayment}
            </h3>
            <p style={{ margin: 0, color: 'var(--medium-gray)' }}>Avg. Payment</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mb-4">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="d-flex gap-3 flex-wrap">
            <button className="btn btn-primary">
              📊 Generate Report
            </button>
            <button className="btn btn-secondary">
              📤 Export Data
            </button>
            <button className="btn btn-outline">
              ⚙️ System Settings
            </button>
            <button className="btn btn-outline">
              📱 Send Bulk SMS
            </button>
            <button className="btn btn-outline">
              📧 Email Campaign
            </button>
          </div>
        </div>

        {/* Pending Registrations */}
        <div className="card">
          <div className="card-header">
            <h3>Pending Client Registrations</h3>
            <p>Review and approve new client applications</p>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--light-gray)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Client</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Contact</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Payment Plan</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Request Date</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRegistrations.map((registration) => (
                  <tr key={registration.id} style={{ borderBottom: '1px solid var(--light-gray)' }}>
                    <td style={{ padding: '12px' }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{registration.name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--medium-gray)' }}>
                          {registration.email}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '0.875rem' }}>
                        📞 {registration.phone}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '500' }}>{registration.product}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        background: 'var(--cream-bg)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}>
                        {registration.paymentPlan}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {registration.requestDate}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`status ${getStatusColor(registration.status)}`}>
                        {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div className="d-flex gap-1">
                        {registration.status === 'pending' && (
                          <button 
                            className="btn btn-outline"
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: '6px 12px',
                              minWidth: 'auto'
                            }}
                            onClick={() => handleContactClient(registration.id)}
                          >
                            Contact
                          </button>
                        )}
                        {(registration.status === 'pending' || registration.status === 'contacted') && (
                          <button 
                            className="btn btn-primary"
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: '6px 12px',
                              minWidth: 'auto'
                            }}
                            onClick={() => handleApproveClient(registration.id)}
                          >
                            Approve
                          </button>
                        )}
                        {registration.status === 'approved' && (
                          <span style={{ 
                            fontSize: '0.875rem', 
                            color: 'var(--primary-green)',
                            fontWeight: '500'
                          }}>
                            ✅ Complete
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-2 mt-4">
          <div className="card">
            <div className="card-header">
              <h3>Recent Activity</h3>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li className="d-flex justify-between align-center p-2" style={{ borderBottom: '1px solid var(--light-gray)' }}>
                <span>💳 Payment received from John Doe</span>
                <small>5 min ago</small>
              </li>
              <li className="d-flex justify-between align-center p-2" style={{ borderBottom: '1px solid var(--light-gray)' }}>
                <span>📝 New registration: Sarah Kenya</span>
                <small>1 hour ago</small>
              </li>
              <li className="d-flex justify-between align-center p-2" style={{ borderBottom: '1px solid var(--light-gray)' }}>
                <span>❄️ Device activated for Mike Ouma</span>
                <small>2 hours ago</small>
              </li>
              <li className="d-flex justify-between align-center p-2" style={{ borderBottom: '1px solid var(--light-gray)' }}>
                <span>🔧 Maintenance scheduled for Unit #SF-198</span>
                <small>3 hours ago</small>
              </li>
              <li className="d-flex justify-between align-center p-2">
                <span>📊 Monthly report generated</span>
                <small>1 day ago</small>
              </li>
            </ul>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>System Health</h3>
            </div>
            <div className="d-flex flex-column gap-3">
              <div>
                <div className="d-flex justify-between align-center mb-1">
                  <span>Server Status</span>
                  <span className="status status-active">Online</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '98%' }}></div>
                </div>
                <small>98% uptime</small>
              </div>

              <div>
                <div className="d-flex justify-between align-center mb-1">
                  <span>Payment Gateway</span>
                  <span className="status status-active">Connected</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '95%' }}></div>
                </div>
                <small>95% success rate</small>
              </div>

              <div>
                <div className="d-flex justify-between align-center mb-1">
                  <span>Device Connectivity</span>
                  <span className="status status-active">Good</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '92%' }}></div>
                </div>
                <small>92% devices online</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 