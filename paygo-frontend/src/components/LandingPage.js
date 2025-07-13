import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = ({ setUser }) => {
  const featuredProducts = [
    {
      id: 1,
      title: "Solar Freezer SF-200",
      description: "200L capacity solar-powered freezer perfect for small businesses. Keep your products fresh with reliable cold storage.",
      image: "🧊",
      price: "Starting at KSh 500/week"
    },
    {
      id: 2,
      title: "Solar Refrigerator SR-150",
      description: "150L solar refrigerator ideal for households. Energy-efficient cooling powered entirely by the sun.",
      image: "❄️",
      price: "Starting at KSh 350/week"
    },
    {
      id: 3,
      title: "Commercial Freezer CF-400",
      description: "400L commercial-grade freezer with backup battery. Perfect for restaurants and food vendors.",
      image: "🏪",
      price: "Starting at KSh 800/week"
    }
  ];

  const howItWorksSteps = [
    {
      step: 1,
      title: "Choose a Product",
      description: "Browse our selection of solar-powered refrigeration solutions",
      icon: "🛒"
    },
    {
      step: 2,
      title: "Register",
      description: "Sign up with Drop Access and select your payment plan",
      icon: "📝"
    },
    {
      step: 3,
      title: "Pay",
      description: "Make easy installments via M-Pesa or mobile money",
      icon: "💳"
    },
    {
      step: 4,
      title: "Activate & Own",
      description: "Receive your product and start benefiting immediately",
      icon: "✅"
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="nav">
        <div className="container d-flex justify-between align-center">
          <Link to="/" className="nav-brand">
            🌞 Drop Access PayGo
          </Link>
          <div className="d-flex gap-2">
            <Link 
              to="/demo-client" 
              className="btn btn-outline"
              onClick={() => setUser('client')}
            >
              Demo Client
            </Link>
            <Link 
              to="/demo-admin" 
              className="btn btn-primary"
              onClick={() => setUser('admin')}
            >
              Demo Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" style={{
        background: 'linear-gradient(135deg, var(--primary-green) 0%, var(--light-green) 100%)',
        color: 'white',
        padding: '120px 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="container text-center">
          <div style={{
            fontSize: '4rem',
            marginBottom: '2rem'
          }}>
            🌞❄️
          </div>
          <h1 style={{ 
            fontSize: '3.5rem', 
            marginBottom: '1.5rem',
            color: 'white',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            Own a Solar Refrigerator Through Small Installments
          </h1>
          <p style={{ 
            fontSize: '1.5rem', 
            marginBottom: '3rem',
            color: 'rgba(255,255,255,0.9)',
            maxWidth: '600px',
            margin: '0 auto 3rem'
          }}>
            Affordable PayGo-powered cold storage, powered by Drop Access. 
            Keep your business running with reliable solar refrigeration.
          </p>
          <div className="d-flex justify-center gap-3 flex-wrap">
            <a 
              href="https://dropaccess.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '1.2rem', padding: '16px 32px' }}
            >
              Get Started with Drop Access
            </a>
            <Link 
              to="/demo-client"
              className="btn btn-outline"
              style={{ 
                fontSize: '1.2rem', 
                padding: '16px 32px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '2px solid white',
                color: 'white'
              }}
              onClick={() => setUser('client')}
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products" style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="text-center mb-4">
            <h2>Featured Solar Refrigeration Products</h2>
            <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
              Choose from our range of solar-powered cooling solutions designed for African businesses and households
            </p>
          </div>
          
          <div className="grid grid-3">
            {featuredProducts.map(product => (
              <div key={product.id} className="card text-center">
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                  {product.image}
                </div>
                <h3>{product.title}</h3>
                <p>{product.description}</p>
                <div style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '600', 
                  color: 'var(--primary-green)',
                  marginBottom: '1.5rem'
                }}>
                  {product.price}
                </div>
                <a 
                  href="https://dropaccess.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Get it with PayGo Installments
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" style={{ 
        padding: '80px 0',
        backgroundColor: 'white'
      }}>
        <div className="container">
          <div className="text-center mb-4">
            <h2>How It Works</h2>
            <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
              Simple steps to get your solar refrigeration solution
            </p>
          </div>
          
          <div className="grid grid-4">
            {howItWorksSteps.map(step => (
              <div key={step.step} className="card text-center">
                <div style={{ 
                  fontSize: '3rem', 
                  marginBottom: '1rem',
                  background: 'var(--cream-bg)',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  {step.icon}
                </div>
                <div style={{
                  background: 'var(--primary-green)',
                  color: 'white',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  {step.step}
                </div>
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        background: 'var(--dark-gray)',
        color: 'white',
        padding: '60px 0 30px'
      }}>
        <div className="container">
          <div className="grid grid-3 mb-4">
            <div>
              <h4 style={{ color: 'white', marginBottom: '1rem' }}>Drop Access PayGo</h4>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                Empowering African communities with affordable solar refrigeration solutions through innovative PayGo technology.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'white', marginBottom: '1rem' }}>Contact</h4>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                📧 info@dropaccess.org<br/>
                📞 +254 700 123 456<br/>
                🌍 Nairobi, Kenya
              </p>
            </div>
            <div>
              <h4 style={{ color: 'white', marginBottom: '1rem' }}>Follow Us</h4>
              <div className="d-flex gap-2">
                <a href="#" style={{ color: 'var(--yellow-accent)', fontSize: '1.5rem' }}>📘</a>
                <a href="#" style={{ color: 'var(--yellow-accent)', fontSize: '1.5rem' }}>🐦</a>
                <a href="#" style={{ color: 'var(--yellow-accent)', fontSize: '1.5rem' }}>📸</a>
                <a href="#" style={{ color: 'var(--yellow-accent)', fontSize: '1.5rem' }}>💼</a>
              </div>
            </div>
          </div>
          <div style={{ 
            borderTop: '1px solid rgba(255,255,255,0.2)',
            paddingTop: '2rem',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)'
          }}>
            <p>&copy; 2025 Drop Access. All rights reserved. Powered by solar energy and innovation.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 