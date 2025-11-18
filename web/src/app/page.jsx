"use client";

import { useEffect, useRef, useState } from "react";

export default function HomePage() {
  const iframeRefs = useRef([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Set page title for homepage
  useEffect(() => {
    document.title = "Vox | Finlumina";
  }, []);

  // Smart header scroll behavior - hide on down, show on up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        // Always show header at top
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        // Scrolling down - hide header
        setHeaderVisible(false);
        setMobileMenuOpen(false); // Close mobile menu when hiding
      } else {
        // Scrolling up - show header
        setHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-resize iframes to match their content height
  useEffect(() => {
    const resizeIframe = (iframe) => {
      if (!iframe) return;

      try {
        // Wait for iframe to load
        iframe.onload = () => {
          try {
            // Get the height of the content inside the iframe
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const height = iframeDoc.body.scrollHeight;

            // Set iframe height to content height
            iframe.style.height = height + 'px';
            console.log(`📏 Resized iframe to ${height}px`);
          } catch (e) {
            console.warn('Could not resize iframe:', e);
          }
        };

        // Also try to resize immediately if already loaded
        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          const height = iframeDoc.body.scrollHeight;
          iframe.style.height = height + 'px';
        }
      } catch (e) {
        console.warn('Could not access iframe:', e);
      }
    };

    // Resize all iframes
    iframeRefs.current.forEach(resizeIframe);

    // Re-check after a short delay to catch late-loading content
    const timer = setTimeout(() => {
      iframeRefs.current.forEach(resizeIframe);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
      <div style={{ width: '100%', minHeight: '100vh', background: '#141416' }}>
        {/* Header */}
        <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(253, 98, 98, 0.1)',
        padding: '16px 24px',
        transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-in-out'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/vox-logo.svg"
              alt="Vox Logo"
              style={{
                width: '48px',
                height: '48px',
                filter: 'drop-shadow(0 0 10px rgba(253, 98, 98, 0.3))',
                transform: 'translateY(18px)' // LOWERED MUCH MORE + BIGGER SIZE
              }}
            />
            <span style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              fontFamily: "'Open Sans', sans-serif",
              letterSpacing: '0.5px'
            }}>Vox</span>
          </div>

          {/* Desktop Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Desktop Links - Hidden on mobile */}
            <div style={{
              display: 'none',
              gap: '12px',
              '@media (min-width: 768px)': {
                display: 'flex'
              }
            }} className="desktop-nav">
              <a
                href="https://finlumina.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#b0b0b0',
                  textDecoration: 'none',
                  fontFamily: "'Open Sans', sans-serif",
                  fontWeight: '500',
                  fontSize: '14px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#b0b0b0';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Finlumina
              </a>
              <a
                href="https://finlumina.com/about"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#b0b0b0',
                  textDecoration: 'none',
                  fontFamily: "'Open Sans', sans-serif",
                  fontWeight: '500',
                  fontSize: '14px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#b0b0b0';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                About
              </a>
              <a
                href="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #FD6262 0%, #ff8585 100%)',
                  color: 'white',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontFamily: "'Open Sans', sans-serif",
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ff7272 0%, #ff9595 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(253, 98, 98, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #FD6262 0%, #ff8585 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Login
              </a>
            </div>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-around',
                width: '28px',
                height: '24px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                zIndex: 10
              }}
              className="mobile-menu-btn"
              aria-label="Menu"
            >
              <span style={{
                width: '100%',
                height: '3px',
                background: 'white',
                borderRadius: '10px',
                transition: 'all 0.3s ease',
                transform: mobileMenuOpen ? 'rotate(45deg) translateY(10px)' : 'rotate(0)',
              }}></span>
              <span style={{
                width: '100%',
                height: '3px',
                background: 'white',
                borderRadius: '10px',
                transition: 'all 0.3s ease',
                opacity: mobileMenuOpen ? 0 : 1,
              }}></span>
              <span style={{
                width: '100%',
                height: '3px',
                background: 'white',
                borderRadius: '10px',
                transition: 'all 0.3s ease',
                transform: mobileMenuOpen ? 'rotate(-45deg) translateY(-10px)' : 'rotate(0)',
              }}></span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'rgba(10, 10, 10, 0.98)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(253, 98, 98, 0.1)',
          padding: mobileMenuOpen ? '16px 24px' : '0 24px',
          maxHeight: mobileMenuOpen ? '300px' : '0',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <a
            href="https://finlumina.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#b0b0b0',
              textDecoration: 'none',
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: '500',
              fontSize: '16px',
              padding: '12px',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              background: 'transparent'
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            Finlumina
          </a>
          <a
            href="https://finlumina.com/about"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#b0b0b0',
              textDecoration: 'none',
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: '500',
              fontSize: '16px',
              padding: '12px',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              background: 'transparent'
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </a>
          <a
            href="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #FD6262 0%, #ff8585 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: '600',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              border: 'none',
              cursor: 'pointer'
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Login
          </a>
        </div>
      </header>

      {/* Add spacing for fixed header */}
      <div style={{ height: '72px' }} />

      {/* Hero Section */}
      <iframe
        ref={(el) => (iframeRefs.current[0] = el)}
        src="/homepage-sections/hero.html"
        style={{
          width: '100%',
          minHeight: '100vh',
          border: 'none',
          display: 'block',
          overflow: 'hidden'
        }}
        title="Hero Section"
        scrolling="no"
      />

      {/* How It Works Section */}
      <iframe
        ref={(el) => (iframeRefs.current[1] = el)}
        src="/homepage-sections/how-it-works.html"
        style={{
          width: '100%',
          minHeight: '600px',
          border: 'none',
          display: 'block',
          overflow: 'hidden'
        }}
        title="How It Works Section"
        scrolling="no"
      />

      {/* Features Section */}
      <iframe
        ref={(el) => (iframeRefs.current[2] = el)}
        src="/homepage-sections/features.html"
        style={{
          width: '100%',
          minHeight: '800px',
          border: 'none',
          display: 'block',
          overflow: 'hidden'
        }}
        title="Features Section"
        scrolling="no"
      />

      {/* Use Cases Section */}
      <iframe
        ref={(el) => (iframeRefs.current[3] = el)}
        src="/homepage-sections/use-cases.html"
        style={{
          width: '100%',
          minHeight: '900px',
          border: 'none',
          display: 'block',
          overflow: 'hidden'
        }}
        title="Use Cases Section"
        scrolling="no"
      />

      {/* Trust & Speed Section */}
      <iframe
        ref={(el) => (iframeRefs.current[4] = el)}
        src="/homepage-sections/trust.html"
        style={{
          width: '100%',
          minHeight: '700px',
          border: 'none',
          display: 'block',
          overflow: 'hidden'
        }}
        title="Trust Section"
        scrolling="no"
      />

      {/* Comparison Section */}
      <iframe
        ref={(el) => (iframeRefs.current[5] = el)}
        src="/homepage-sections/comparison.html"
        style={{
          width: '100%',
          minHeight: '700px',
          border: 'none',
          display: 'block',
          overflow: 'hidden'
        }}
        title="Comparison Section"
        scrolling="no"
      />

      {/* Voices Section */}
      <iframe
        ref={(el) => (iframeRefs.current[6] = el)}
        src="/homepage-sections/voices.html"
        style={{
          width: '100%',
          minHeight: '700px',
          border: 'none',
          display: 'block',
          overflow: 'hidden'
        }}
        title="Voices Section"
        scrolling="no"
      />

      {/* FAQ Section */}
      <iframe
        ref={(el) => (iframeRefs.current[7] = el)}
        src="/homepage-sections/faq.html"
        style={{
          width: '100%',
          minHeight: '900px',
          border: 'none',
          display: 'block',
          overflow: 'hidden'
        }}
        title="FAQ Section"
        scrolling="no"
      />

      {/* Final CTA Section */}
      <iframe
        ref={(el) => (iframeRefs.current[8] = el)}
        src="/homepage-sections/cta.html"
        style={{
          width: '100%',
          minHeight: '500px',
          border: 'none',
          display: 'block',
          overflow: 'hidden'
        }}
        title="CTA Section"
        scrolling="no"
      />

      {/* Footer */}
      <footer style={{
        background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
        borderTop: '1px solid rgba(253, 98, 98, 0.1)',
        padding: '60px 24px 30px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Footer Content */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '40px',
            marginBottom: '40px'
          }}>
            {/* Brand Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <img
                  src="/vox-logo.svg"
                  alt="Vox Logo"
                  style={{
                    width: '36px',
                    height: '36px',
                    filter: 'drop-shadow(0 0 10px rgba(253, 98, 98, 0.3))',
                    transform: 'translateY(2px)' // Original position - DON'T TOUCH
                  }}
                />
                <span style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white',
                  fontFamily: "'Open Sans', sans-serif"
                }}>Vox</span>
              </div>
              <p style={{
                color: '#888',
                fontSize: '14px',
                lineHeight: '1.6',
                fontFamily: "'Open Sans', sans-serif"
              }}>
                AI-powered voice assistant for restaurants. Handle orders, answer questions, and delight customers 24/7.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '16px',
                fontFamily: "'Open Sans', sans-serif"
              }}>Quick Links</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a href="https://finlumina.com" style={{ color: '#888', textDecoration: 'none', fontSize: '14px', fontFamily: "'Open Sans', sans-serif" }}>Finlumina</a>
                <a href="https://finlumina.com/about" style={{ color: '#888', textDecoration: 'none', fontSize: '14px', fontFamily: "'Open Sans', sans-serif" }}>About</a>
                <a href="/login" style={{ color: '#FD6262', textDecoration: 'none', fontSize: '14px', fontFamily: "'Open Sans', sans-serif", fontWeight: '600' }}>Dashboard Login</a>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 style={{
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '16px',
                fontFamily: "'Open Sans', sans-serif"
              }}>Contact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a href="mailto:sales@vox.finlumina.com" style={{ color: '#888', textDecoration: 'none', fontSize: '14px', fontFamily: "'Open Sans', sans-serif" }}>sales@vox.finlumina.com</a>
                <p style={{ color: '#888', fontSize: '14px', margin: 0, fontFamily: "'Open Sans', sans-serif" }}>Available 24/7</p>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <p style={{
              color: '#666',
              fontSize: '14px',
              margin: 0,
              fontFamily: "'Open Sans', sans-serif"
            }}>
              © 2025 Vox. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: '24px' }}>
              <a href="#" style={{ color: '#888', textDecoration: 'none', fontSize: '14px', fontFamily: "'Open Sans', sans-serif" }}>Privacy Policy</a>
              <a href="#" style={{ color: '#888', textDecoration: 'none', fontSize: '14px', fontFamily: "'Open Sans', sans-serif" }}>Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
