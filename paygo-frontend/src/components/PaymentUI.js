import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const PaymentUI = () => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paymentForm, setPaymentForm] = useState({
    mpesaPhone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    amount: '1500'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const paymentMethods = [
    {
      id: 'mpesa',
      name: 'M-Pesa',
      icon: '📱',
      description: 'Pay using M-Pesa STK Push',
      popular: true
    },
    {
      id: 'mobile-money',
      name: 'Mobile Money',
      icon: '💳',
      description: 'Airtel Money, T-Kash, etc.',
      popular: false
    },
    {
      id: 'card',
      name: 'Visa/Mastercard',
      icon: '💳',
      description: 'Pay with your debit/credit card',
      popular: false
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: '🏦',
      description: 'Direct bank transfer',
      popular: false
    }
  ];

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
    }, 3000);
  };

  if (paymentSuccess) {
    return (
      <div className="payment-ui">
        <nav className="nav">
          <div className="container d-flex justify-between align-center">
            <Link to="/" className="nav-brand">
              🌞 Drop Access PayGo
            </Link>
          </div>
        </nav>

        <div className="container" style={{ padding: '40px 20px', minHeight: '70vh' }}>
          <div className="d-flex justify-center align-center" style={{ minHeight: '50vh' }}>
            <div className="card text-center" style={{ maxWidth: '500px', width: '100%' }}>
              <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>
                ✅
              </div>
              <h1 style={{ color: 'var(--primary-green)', marginBottom: '1rem' }}>
                Payment Successful!
              </h1>
              <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
                Your payment of <strong>KSh {paymentForm.amount}</strong> has been processed successfully.
                Your solar device will be activated shortly.
              </p>
              
              <div className="card" style={{ 
                background: 'var(--cream-bg)', 
                marginBottom: '2rem',
                textAlign: 'left'
              }}>
                <h4>Payment Details</h4>
                <div className="d-flex justify-between mb-2">
                  <span>Amount:</span>
                  <span style={{ fontWeight: '600' }}>KSh {paymentForm.amount}</span>
                </div>
                <div className="d-flex justify-between mb-2">
                  <span>Method:</span>
                  <span style={{ fontWeight: '600' }}>
                    {paymentMethods.find(m => m.id === selectedMethod)?.name || 'M-Pesa'}
                  </span>
                </div>
                <div className="d-flex justify-between mb-2">
                  <span>Transaction ID:</span>
                  <span style={{ fontWeight: '600' }}>TXN{Date.now()}</span>
                </div>
                <div className="d-flex justify-between">
                  <span>Date:</span>
                  <span style={{ fontWeight: '600' }}>{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <div className="d-flex gap-2">
                <Link to="/demo-client" className="btn btn-primary" style={{ flex: 1 }}>
                  View Dashboard
                </Link>
                <button 
                  onClick={() => window.print()} 
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-ui">
      {/* Navigation */}
      <nav className="nav">
        <div className="container d-flex justify-between align-center">
          <Link to="/" className="nav-brand">
            🌞 Drop Access PayGo
          </Link>
          <Link to="/demo-client" className="btn btn-outline">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="d-flex justify-center">
          <div style={{ maxWidth: '600px', width: '100%' }}>
            {/* Payment Header */}
            <div className="card mb-4">
              <div className="text-center">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
                <h1>Make Payment</h1>
                <p>Pay for your Solar Freezer SF-200 subscription</p>
                
                <div className="card" style={{ 
                  background: 'var(--cream-bg)', 
                  marginTop: '2rem'
                }}>
                  <div className="d-flex justify-between align-center">
                    <span style={{ fontSize: '1.2rem' }}>Amount Due:</span>
                    <span style={{ 
                      fontSize: '2rem', 
                      fontWeight: '700',
                      color: 'var(--primary-green)'
                    }}>
                      KSh {paymentForm.amount}
                    </span>
                  </div>
                  <div className="d-flex justify-between align-center mt-2">
                    <span>Due Date:</span>
                    <span style={{ fontWeight: '600' }}>January 20, 2025</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="card mb-4">
              <div className="card-header">
                <h3>Select Payment Method</h3>
              </div>
              
              <div className="grid grid-2 gap-3">
                {paymentMethods.map(method => (
                  <div
                    key={method.id}
                    className={`card ${selectedMethod === method.id ? 'border-primary' : ''}`}
                    style={{
                      cursor: 'pointer',
                      border: selectedMethod === method.id ? '2px solid var(--primary-green)' : '1px solid var(--light-gray)',
                      background: selectedMethod === method.id ? 'rgba(0, 120, 68, 0.05)' : 'white',
                      position: 'relative'
                    }}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    {method.popular && (
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '16px',
                        background: 'var(--orange-highlight)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        POPULAR
                      </div>
                    )}
                    
                    <div className="d-flex align-center gap-3">
                      <div style={{ fontSize: '2rem' }}>{method.icon}</div>
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>{method.name}</h4>
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>
                          {method.description}
                        </p>
                      </div>
                    </div>
                    
                    {selectedMethod === method.id && (
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        color: 'var(--primary-green)',
                        fontSize: '1.5rem'
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Form */}
            {selectedMethod && (
              <div className="card">
                <div className="card-header">
                  <h3>Payment Details</h3>
                </div>
                
                <form onSubmit={handlePayment}>
                  {selectedMethod === 'mpesa' && (
                    <div>
                      <div className="form-group">
                        <label className="form-label">M-Pesa Phone Number</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="254712345678"
                          value={paymentForm.mpesaPhone}
                          onChange={(e) => setPaymentForm({
                            ...paymentForm,
                            mpesaPhone: e.target.value
                          })}
                          required
                        />
                        <small style={{ color: 'var(--medium-gray)' }}>
                          Enter your M-Pesa registered phone number
                        </small>
                      </div>
                      
                      <div className="card" style={{ background: 'var(--cream-bg)' }}>
                        <h4>📱 How it works:</h4>
                        <ol style={{ paddingLeft: '1.5rem', margin: 0 }}>
                          <li>Enter your M-Pesa phone number</li>
                          <li>Click "Pay Now" to initiate STK Push</li>
                          <li>Check your phone for the M-Pesa prompt</li>
                          <li>Enter your M-Pesa PIN to complete payment</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'card' && (
                    <div>
                      <div className="form-group">
                        <label className="form-label">Cardholder Name</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="John Doe"
                          value={paymentForm.cardName}
                          onChange={(e) => setPaymentForm({
                            ...paymentForm,
                            cardName: e.target.value
                          })}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Card Number</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="1234 5678 9012 3456"
                          value={paymentForm.cardNumber}
                          onChange={(e) => setPaymentForm({
                            ...paymentForm,
                            cardNumber: e.target.value
                          })}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-2 gap-2">
                        <div className="form-group">
                          <label className="form-label">Expiry Date</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="MM/YY"
                            value={paymentForm.expiryDate}
                            onChange={(e) => setPaymentForm({
                              ...paymentForm,
                              expiryDate: e.target.value
                            })}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">CVV</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="123"
                            value={paymentForm.cvv}
                            onChange={(e) => setPaymentForm({
                              ...paymentForm,
                              cvv: e.target.value
                            })}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'bank' && (
                    <div className="card" style={{ background: 'var(--cream-bg)' }}>
                      <h4>🏦 Bank Transfer Instructions</h4>
                      <div style={{ marginBottom: '1rem' }}>
                        <strong>Account Details:</strong><br/>
                        Bank: Equity Bank Kenya<br/>
                        Account Name: Drop Access PayGo Ltd<br/>
                        Account Number: 1234567890<br/>
                        Branch: Westlands<br/>
                        Swift Code: EQBLKENA
                      </div>
                      <p style={{ margin: 0 }}>
                        Please use your phone number as the reference when making the transfer.
                        Payment confirmation may take 1-2 business days.
                      </p>
                    </div>
                  )}

                  {selectedMethod === 'mobile-money' && (
                    <div>
                      <div className="form-group">
                        <label className="form-label">Mobile Money Provider</label>
                        <select className="form-select" required>
                          <option value="">Select provider...</option>
                          <option value="airtel">Airtel Money</option>
                          <option value="tkash">T-Kash</option>
                          <option value="equitel">Equitel Money</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="254712345678"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {selectedMethod !== 'bank' && (
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '16px' }}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <span>
                          🔄 Processing Payment...
                        </span>
                      ) : (
                        <span>
                          💳 Pay KSh {paymentForm.amount} Now
                        </span>
                      )}
                    </button>
                  )}
                </form>
                
                <div className="mt-3 text-center">
                  <small style={{ color: 'var(--medium-gray)' }}>
                    🔒 Your payment information is secure and encrypted
                  </small>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="card mt-4" style={{ background: 'var(--cream-bg)' }}>
              <div className="d-flex align-center gap-2 mb-3">
                <span style={{ fontSize: '1.5rem' }}>🔒</span>
                <h4 style={{ margin: 0 }}>Secure Payment</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                Your payment is protected by industry-standard encryption. 
                We never store your card details or personal payment information.
                All transactions are processed through certified payment gateways.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
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
          <div className="card text-center">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
            <h3>Processing Payment...</h3>
            <p>Please wait while we process your payment securely.</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: '60%',
                  animation: 'pulse 1.5s ease-in-out infinite alternate'
                }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentUI; 