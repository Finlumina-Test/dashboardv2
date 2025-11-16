"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function HomePage() {
  const navigate = useNavigate();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedBackend = localStorage.getItem("restaurant_backend");
    if (storedBackend) {
      navigate(`/dashboard/${storedBackend}`);
    }
  }, [navigate]);

  // Modal functions
  const openDemoModal = () => {
    setIsDemoModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeDemoModal = () => {
    setIsDemoModalOpen(false);
    document.body.style.overflow = '';
  };

  const handleCallClick = (e) => {
    if (window.innerWidth > 768) {
      e.preventDefault();
      navigator.clipboard.writeText('+14788008311').then(() => {
        alert('📋 Phone number copied!\n\n+1 (478) 800-8311\n\nDial this number from your phone.');
      }).catch(() => {
        alert('📞 Call: +1 (478) 800-8311');
      });
    }
  };

  // FAQ toggle
  const toggleFAQ = (index) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };

  // Audio player functions
  const toggleAudio = (audioId) => {
    const audio = document.querySelector(`[data-audio="${audioId}"] audio`);
    if (!audio) return;

    if (currentAudio && currentAudio !== audio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    if (audio.paused) {
      audio.play();
      setCurrentAudio(audio);
    } else {
      audio.pause();
      setCurrentAudio(null);
    }
  };

  useEffect(() => {
    // Close modal on ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') closeDemoModal();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // Scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('vox-animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.vox-fade-in').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: '#141416', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;600&family=Open+Sans:wght@300;400;600&display=swap" rel="stylesheet" />

      {/* Include the CSS */}
      <style jsx global>{`
        ${getStyles()}
      `}</style>

      {/* Hero Section */}
      <div className="vox-hero-section">
        <div className="vox-hero-content">
          <h1>
            AI Voice Agents.<br/>
            <span className="accent">Zero Wait Times.</span>
          </h1>

          <p>
            Handle thousands of calls simultaneously with human-quality conversations.
            Built on OpenAI Realtime API for instant, natural responses.
          </p>

          <div className="vox-cta-group">
            <button onClick={openDemoModal} className="vox-btn-primary">
              <svg style={{ width: '18px', height: '18px', marginRight: '8px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Call Live Demo & Monitor
            </button>

            <a href="https://finlumina.com/contact" target="_top" className="vox-btn-secondary">
              Get Started
            </a>
          </div>

          <div className="vox-stats-row">
            <div className="vox-stat-item">
              <span className="vox-stat-number">1,247</span>
              <span className="vox-stat-label">Calls Today</span>
            </div>
            <div className="vox-stat-item">
              <span className="vox-stat-number">&lt; 500ms</span>
              <span className="vox-stat-label">Response Time</span>
            </div>
            <div className="vox-stat-item">
              <span className="vox-stat-number">24/7</span>
              <span className="vox-stat-label">Uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="vox-features-section vox-fade-in">
        <div className="vox-container">
          <h2 className="vox-section-title">Why VOX?</h2>
          <p className="vox-section-subtitle">Built for businesses that value customer experience</p>

          <div className="vox-features-grid">
            <div className="vox-feature-card">
              <div className="vox-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <h3>Instant Response</h3>
              <p>No hold music, no wait times. Every call answered in under 500ms with natural, human-quality voice.</p>
            </div>

            <div className="vox-feature-card">
              <div className="vox-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3>Enterprise Security</h3>
              <p>Bank-grade encryption, SOC 2 compliant infrastructure. Your data is safe and never shared.</p>
            </div>

            <div className="vox-feature-card">
              <div className="vox-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
              <h3>Unlimited Scale</h3>
              <p>Handle 10 calls or 10,000 simultaneously. No capacity limits, no busy signals ever.</p>
            </div>

            <div className="vox-feature-card">
              <div className="vox-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
              </div>
              <h3>Real-time Analytics</h3>
              <p>Live dashboards showing every conversation, order, and metric. Full transcripts and recordings.</p>
            </div>

            <div className="vox-feature-card">
              <div className="vox-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <h3>Pay Per Use</h3>
              <p>Only pay for completed calls. No monthly fees, no contracts. Cancel anytime.</p>
            </div>

            <div className="vox-feature-card">
              <div className="vox-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <h3>Fully Customizable</h3>
              <p>Custom voices, greetings, scripts, and integrations. Sounds exactly like your brand.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="vox-use-cases-section vox-fade-in">
        <div className="vox-container">
          <h2 className="vox-section-title">Perfect For</h2>
          <p className="vox-section-subtitle">Industries seeing 10x ROI with VOX</p>

          <div className="vox-use-cases-grid">
            <div className="vox-use-case-card">
              <div className="vox-use-case-icon">🏥</div>
              <h3>Medical & Healthcare</h3>
              <p>24/7 appointment scheduling, prescription refills, and patient inquiries. HIPAA compliant.</p>
              <ul>
                <li>Appointment booking & reminders</li>
                <li>Insurance verification</li>
                <li>Prescription refill requests</li>
                <li>Patient triage & routing</li>
              </ul>
            </div>

            <div className="vox-use-case-card vox-highlight">
              <div className="vox-use-case-icon">🍕</div>
              <h3>Restaurants & Food</h3>
              <p>Take orders, answer menu questions, handle reservations. Never miss a sale during rush hour.</p>
              <ul>
                <li>Order taking & modification</li>
                <li>Reservation management</li>
                <li>Delivery coordination</li>
                <li>Menu questions & specials</li>
              </ul>
              <div className="vox-badge">Most Popular</div>
            </div>

            <div className="vox-use-case-card">
              <div className="vox-use-case-icon">💇</div>
              <h3>Salons & Spas</h3>
              <p>Booking, rescheduling, and customer service. Your staff focuses on clients, not phones.</p>
              <ul>
                <li>Appointment scheduling</li>
                <li>Service recommendations</li>
                <li>Cancellation & rescheduling</li>
                <li>Membership inquiries</li>
              </ul>
            </div>

            <div className="vox-use-case-card vox-custom">
              <h3>Your Industry?</h3>
              <p>VOX adapts to any business that handles phone calls. Custom training for your specific needs.</p>
              <a href="https://finlumina.com/contact" className="vox-link-arrow">
                Talk to us about your use case →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Speed Section */}
      <section className="vox-trust-section vox-fade-in">
        <div className="vox-container">
          <h2 className="vox-section-title">The Speed Difference</h2>
          <p className="vox-section-subtitle">Traditional phone systems vs VOX</p>

          <div className="vox-speed-comparison">
            <div className="vox-comparison-row">
              <div className="vox-comparison-label">Traditional IVR</div>
              <div className="vox-comparison-bar-container">
                <div className="vox-comparison-bar vox-traditional" style={{ width: '95%' }}>
                  <span>45-90 seconds</span>
                </div>
              </div>
            </div>

            <div className="vox-comparison-row">
              <div className="vox-comparison-label">Human Agent</div>
              <div className="vox-comparison-bar-container">
                <div className="vox-comparison-bar vox-human" style={{ width: '75%' }}>
                  <span>30-60 seconds</span>
                </div>
              </div>
            </div>

            <div className="vox-comparison-row">
              <div className="vox-comparison-label">VOX AI</div>
              <div className="vox-comparison-bar-container">
                <div className="vox-comparison-bar vox-vox" style={{ width: '2%' }}>
                  <span>&lt; 500ms</span>
                </div>
              </div>
            </div>
          </div>

          <div className="vox-trust-badges">
            <div className="vox-trust-badge">
              <div className="vox-trust-badge-icon">🔒</div>
              <div className="vox-trust-badge-text">SOC 2 Compliant</div>
            </div>
            <div className="vox-trust-badge">
              <div className="vox-trust-badge-icon">⚡</div>
              <div className="vox-trust-badge-text">99.99% Uptime</div>
            </div>
            <div className="vox-trust-badge">
              <div className="vox-trust-badge-icon">🌐</div>
              <div className="vox-trust-badge-text">Global CDN</div>
            </div>
            <div className="vox-trust-badge">
              <div className="vox-trust-badge-icon">🎯</div>
              <div className="vox-trust-badge-text">OpenAI Powered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="vox-comparison-section vox-fade-in">
        <div className="vox-container">
          <h2 className="vox-section-title">VOX vs Traditional Systems</h2>

          <div className="vox-comparison-table">
            <div className="vox-comparison-header">
              <div className="vox-comparison-col"></div>
              <div className="vox-comparison-col vox-highlight-col">VOX</div>
              <div className="vox-comparison-col">Traditional</div>
            </div>

            <div className="vox-comparison-body">
              <div className="vox-comparison-row-table">
                <div className="vox-comparison-col vox-feature-name">Response Time</div>
                <div className="vox-comparison-col vox-highlight-col">
                  <span className="vox-check">✓</span> &lt; 500ms
                </div>
                <div className="vox-comparison-col">
                  <span className="vox-cross">✗</span> 30-90 sec
                </div>
              </div>

              <div className="vox-comparison-row-table">
                <div className="vox-comparison-col vox-feature-name">Concurrent Calls</div>
                <div className="vox-comparison-col vox-highlight-col">
                  <span className="vox-check">✓</span> Unlimited
                </div>
                <div className="vox-comparison-col">
                  <span className="vox-cross">✗</span> Limited
                </div>
              </div>

              <div className="vox-comparison-row-table">
                <div className="vox-comparison-col vox-feature-name">Natural Voice</div>
                <div className="vox-comparison-col vox-highlight-col">
                  <span className="vox-check">✓</span> Human-quality
                </div>
                <div className="vox-comparison-col">
                  <span className="vox-cross">✗</span> Robotic
                </div>
              </div>

              <div className="vox-comparison-row-table">
                <div className="vox-comparison-col vox-feature-name">Setup Time</div>
                <div className="vox-comparison-col vox-highlight-col">
                  <span className="vox-check">✓</span> 24 hours
                </div>
                <div className="vox-comparison-col">
                  <span className="vox-cross">✗</span> Weeks
                </div>
              </div>

              <div className="vox-comparison-row-table">
                <div className="vox-comparison-col vox-feature-name">Monthly Cost</div>
                <div className="vox-comparison-col vox-highlight-col">
                  <span className="vox-check">✓</span> Pay per use
                </div>
                <div className="vox-comparison-col">
                  <span className="vox-cross">✗</span> $500-5000+
                </div>
              </div>

              <div className="vox-comparison-row-table">
                <div className="vox-comparison-col vox-feature-name">Real-time Analytics</div>
                <div className="vox-comparison-col vox-highlight-col">
                  <span className="vox-check">✓</span> Full dashboard
                </div>
                <div className="vox-comparison-col">
                  <span className="vox-cross">✗</span> Basic logs
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Voice Showcase */}
      <section className="vox-voices-section vox-fade-in">
        <div className="vox-container">
          <h2 className="vox-section-title">Hear The Difference</h2>
          <p className="vox-section-subtitle">Crystal-clear AI voices powered by OpenAI</p>

          <div className="vox-voices-grid">
            <div className="vox-voice-card" data-audio="alloy">
              <div className="vox-voice-avatar">🎤</div>
              <h3>Alloy</h3>
              <p>Professional & friendly</p>
              <button onClick={() => toggleAudio('alloy')} className="vox-play-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play Sample
              </button>
              <audio src="/voices/alloy-sample.mp3" />
            </div>

            <div className="vox-voice-card" data-audio="echo">
              <div className="vox-voice-avatar">🎧</div>
              <h3>Echo</h3>
              <p>Warm & welcoming</p>
              <button onClick={() => toggleAudio('echo')} className="vox-play-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play Sample
              </button>
              <audio src="/voices/echo-sample.mp3" />
            </div>

            <div className="vox-voice-card" data-audio="nova">
              <div className="vox-voice-avatar">🔊</div>
              <h3>Nova</h3>
              <p>Energetic & clear</p>
              <button onClick={() => toggleAudio('nova')} className="vox-play-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play Sample
              </button>
              <audio src="/voices/nova-sample.mp3" />
            </div>

            <div className="vox-voice-card" data-audio="shimmer">
              <div className="vox-voice-avatar">✨</div>
              <h3>Shimmer</h3>
              <p>Sophisticated & smooth</p>
              <button onClick={() => toggleAudio('shimmer')} className="vox-play-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play Sample
              </button>
              <audio src="/voices/shimmer-sample.mp3" />
            </div>
          </div>

          <p className="vox-voices-note">Don't like these? We can clone your own voice or create a custom one.</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="vox-faq-section vox-fade-in">
        <div className="vox-container">
          <h2 className="vox-section-title">Frequently Asked Questions</h2>

          <div className="vox-faq-list">
            <div className={`vox-faq-item ${activeFAQ === 0 ? 'active' : ''}`} onClick={() => toggleFAQ(0)}>
              <div className="vox-faq-question">
                <h3>How quickly can I get started?</h3>
                <span className="vox-faq-icon">{activeFAQ === 0 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 0 && (
                <div className="vox-faq-answer">
                  <p>Most businesses are live within 24 hours. We provide a dedicated phone number, help you customize the voice and script, and integrate with your existing systems. You can start taking calls the same day you sign up.</p>
                </div>
              )}
            </div>

            <div className={`vox-faq-item ${activeFAQ === 1 ? 'active' : ''}`} onClick={() => toggleFAQ(1)}>
              <div className="vox-faq-question">
                <h3>How much does it cost?</h3>
                <span className="vox-faq-icon">{activeFAQ === 1 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 1 && (
                <div className="vox-faq-answer">
                  <p>We charge per completed call, typically $0.50-2.00 depending on length and complexity. No monthly fees, no contracts. Most restaurants save 70-90% compared to hiring phone staff.</p>
                </div>
              )}
            </div>

            <div className={`vox-faq-item ${activeFAQ === 2 ? 'active' : ''}`} onClick={() => toggleFAQ(2)}>
              <div className="vox-faq-question">
                <h3>Can it handle complex orders?</h3>
                <span className="vox-faq-icon">{activeFAQ === 2 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 2 && (
                <div className="vox-faq-answer">
                  <p>Yes! VOX handles modifications, substitutions, special instructions, multiple items, and even difficult accents. It's trained on thousands of real conversations and gets smarter over time.</p>
                </div>
              )}
            </div>

            <div className={`vox-faq-item ${activeFAQ === 3 ? 'active' : ''}`} onClick={() => toggleFAQ(3)}>
              <div className="vox-faq-question">
                <h3>What if the AI can't handle a call?</h3>
                <span className="vox-faq-icon">{activeFAQ === 3 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 3 && (
                <div className="vox-faq-answer">
                  <p>VOX can seamlessly transfer to a human agent anytime. You have a dashboard showing all live calls and can jump in with one click. Customers won't even know they switched.</p>
                </div>
              )}
            </div>

            <div className={`vox-faq-item ${activeFAQ === 4 ? 'active' : ''}`} onClick={() => toggleFAQ(4)}>
              <div className="vox-faq-question">
                <h3>Do I need special equipment?</h3>
                <span className="vox-faq-icon">{activeFAQ === 4 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 4 && (
                <div className="vox-faq-answer">
                  <p>No equipment needed. We provide a phone number that works immediately. Want to use your existing number? We can port it or forward calls to VOX.</p>
                </div>
              )}
            </div>

            <div className={`vox-faq-item ${activeFAQ === 5 ? 'active' : ''}`} onClick={() => toggleFAQ(5)}>
              <div className="vox-faq-question">
                <h3>Is my customer data safe?</h3>
                <span className="vox-faq-icon">{activeFAQ === 5 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 5 && (
                <div className="vox-faq-answer">
                  <p>Absolutely. We're SOC 2 compliant, use bank-grade encryption, and never share or sell your data. For healthcare, we're HIPAA compliant. All recordings are stored securely and can be auto-deleted per your policy.</p>
                </div>
              )}
            </div>

            <div className={`vox-faq-item ${activeFAQ === 6 ? 'active' : ''}`} onClick={() => toggleFAQ(6)}>
              <div className="vox-faq-question">
                <h3>Can I customize the voice and script?</h3>
                <span className="vox-faq-icon">{activeFAQ === 6 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 6 && (
                <div className="vox-faq-answer">
                  <p>100% customizable. Choose from multiple voices, adjust tone and speed, write your own greetings and responses, or even clone your own voice. Update anytime through the dashboard.</p>
                </div>
              )}
            </div>

            <div className={`vox-faq-item ${activeFAQ === 7 ? 'active' : ''}`} onClick={() => toggleFAQ(7)}>
              <div className="vox-faq-question">
                <h3>What integrations do you support?</h3>
                <span className="vox-faq-icon">{activeFAQ === 7 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 7 && (
                <div className="vox-faq-answer">
                  <p>We integrate with most POS systems (Square, Toast, Clover), CRMs (Salesforce, HubSpot), calendars (Google, Outlook), and can connect to any system via webhook or API.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="vox-final-cta vox-fade-in">
        <div className="vox-container">
          <h2>Try VOX Risk-Free</h2>
          <p>Call our live demo right now. No signup, no commitment.</p>

          <button onClick={openDemoModal} className="vox-btn-primary vox-btn-large">
            <svg style={{ width: '24px', height: '24px', marginRight: '10px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Call +1 (478) 800-8311
          </button>

          <p className="vox-final-note">Already convinced? <a href="https://finlumina.com/contact">Talk to sales →</a></p>
        </div>
      </section>

      {/* Restaurant Login CTA */}
      <div style={{ textAlign: 'center', padding: '40px 20px', background: '#0a0a0a' }}>
        <a
          href="/login"
          className="inline-block bg-white text-black font-semibold py-4 px-8 rounded-lg hover:bg-gray-100 transition-all text-lg"
          style={{
            display: 'inline-block',
            background: 'white',
            color: 'black',
            padding: '16px 32px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontFamily: "'Open Sans', sans-serif",
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
        >
          Restaurant Login →
        </a>
      </div>

      {/* Demo Modal */}
      {isDemoModalOpen && (
        <div
          className="vox-modal-overlay active"
          onClick={(e) => e.target.className.includes('vox-modal-overlay') && closeDemoModal()}
        >
          <div className="vox-modal" onClick={(e) => e.stopPropagation()}>
            <button className="vox-modal-close" onClick={closeDemoModal}>&times;</button>

            <div className="vox-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#FD6262" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>

            <h2>Try <span>VOX Live</span></h2>
            <p className="vox-modal-subtitle">
              Call our AI agent and get your personal dashboard to watch the conversation in real-time
            </p>

            <div className="vox-modal-steps">
              <div className="vox-modal-step">
                <div className="vox-modal-step-number">1</div>
                <div className="vox-modal-step-content">
                  <h4>Call The Number</h4>
                  <p>Dial <code>+1 (478) 800-8311</code> from any phone</p>
                </div>
              </div>

              <div className="vox-modal-step">
                <div className="vox-modal-step-number">2</div>
                <div className="vox-modal-step-content">
                  <h4>Get Your Dashboard Link</h4>
                  <p>Voice will say: <code>vox.finlumina.com/demo/abc123</code></p>
                </div>
              </div>

              <div className="vox-modal-step">
                <div className="vox-modal-step-number">3</div>
                <div className="vox-modal-step-content">
                  <h4>Open Dashboard</h4>
                  <p>Type the URL in your browser to watch live transcripts</p>
                </div>
              </div>

              <div className="vox-modal-step">
                <div className="vox-modal-step-number">4</div>
                <div className="vox-modal-step-content">
                  <h4>Start Your Demo</h4>
                  <p>Press any key on your phone. You have <strong style={{ color: '#FEB0B0' }}>60 seconds</strong> to try VOX!</p>
                </div>
              </div>
            </div>

            <div className="vox-modal-actions">
              <a href="tel:+14788008311" className="vox-modal-btn vox-modal-btn-primary" onClick={handleCallClick}>
                <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                Call Now: +1 (478) 800-8311
              </a>
              <button onClick={closeDemoModal} className="vox-modal-btn vox-modal-btn-secondary">
                Maybe Later
              </button>
            </div>

            <p className="vox-modal-note">
              Free demo • No signup required • Available 24/7<br/>
              International rates may apply
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Complete CSS styles
function getStyles() {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: #141416;
      font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #fff;
      overflow-x: hidden;
    }

    .vox-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Hero Section */
    .vox-hero-section {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a1c 0%, #0a0a0a 100%);
      position: relative;
      overflow: hidden;
      padding: 60px 20px;
    }

    .vox-hero-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 50% 50%, rgba(253, 98, 98, 0.1) 0%, transparent 50%);
      pointer-events: none;
    }

    .vox-hero-content {
      position: relative;
      z-index: 1;
      text-align: center;
      max-width: 900px;
    }

    .vox-hero-content h1 {
      font-family: 'Poppins', sans-serif;
      font-size: clamp(2.5rem, 6vw, 4.5rem);
      font-weight: 600;
      line-height: 1.2;
      margin-bottom: 24px;
      color: #fff;
    }

    .vox-hero-content h1 .accent {
      background: linear-gradient(135deg, #FD6262 0%, #FF8A8A 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .vox-hero-content > p {
      font-size: clamp(1.1rem, 2vw, 1.3rem);
      color: #b0b0b0;
      margin-bottom: 40px;
      line-height: 1.6;
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
    }

    .vox-cta-group {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 60px;
    }

    .vox-btn-primary,
    .vox-btn-secondary {
      padding: 16px 32px;
      border-radius: 12px;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 1.05rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      border: none;
    }

    .vox-btn-primary {
      background: linear-gradient(135deg, #FD6262 0%, #FF8A8A 100%);
      color: white;
      box-shadow: 0 8px 24px rgba(253, 98, 98, 0.3);
    }

    .vox-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(253, 98, 98, 0.4);
    }

    .vox-btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
    }

    .vox-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }

    .vox-btn-large {
      padding: 20px 40px;
      font-size: 1.2rem;
    }

    .vox-stats-row {
      display: flex;
      gap: 48px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .vox-stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .vox-stat-number {
      font-family: 'Poppins', sans-serif;
      font-size: 2.5rem;
      font-weight: 600;
      background: linear-gradient(135deg, #FD6262 0%, #FF8A8A 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .vox-stat-label {
      font-size: 0.95rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Section Styles */
    .vox-features-section,
    .vox-use-cases-section,
    .vox-trust-section,
    .vox-comparison-section,
    .vox-voices-section,
    .vox-faq-section,
    .vox-final-cta {
      padding: 100px 20px;
      background: #0a0a0a;
    }

    .vox-features-section {
      background: linear-gradient(180deg, #0a0a0a 0%, #141416 100%);
    }

    .vox-section-title {
      font-family: 'Poppins', sans-serif;
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 600;
      text-align: center;
      margin-bottom: 16px;
      color: #fff;
    }

    .vox-section-subtitle {
      text-align: center;
      font-size: 1.2rem;
      color: #888;
      margin-bottom: 60px;
    }

    /* Features Grid */
    .vox-features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      margin-top: 60px;
    }

    .vox-feature-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 36px;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .vox-feature-card:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(253, 98, 98, 0.3);
      transform: translateY(-4px);
    }

    .vox-feature-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #FD6262 0%, #FF8A8A 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }

    .vox-feature-icon svg {
      width: 32px;
      height: 32px;
      stroke: white;
    }

    .vox-feature-card h3 {
      font-family: 'Poppins', sans-serif;
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: #fff;
    }

    .vox-feature-card p {
      font-size: 1rem;
      line-height: 1.7;
      color: #b0b0b0;
    }

    /* Use Cases Grid */
    .vox-use-cases-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 30px;
      margin-top: 60px;
    }

    .vox-use-case-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 36px;
      transition: all 0.3s ease;
      position: relative;
    }

    .vox-use-case-card:hover {
      transform: translateY(-4px);
      border-color: rgba(253, 98, 98, 0.3);
    }

    .vox-use-case-card.vox-highlight {
      background: rgba(253, 98, 98, 0.08);
      border-color: rgba(253, 98, 98, 0.3);
    }

    .vox-use-case-icon {
      font-size: 3rem;
      margin-bottom: 20px;
    }

    .vox-use-case-card h3 {
      font-family: 'Poppins', sans-serif;
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: #fff;
    }

    .vox-use-case-card p {
      font-size: 1rem;
      line-height: 1.6;
      color: #b0b0b0;
      margin-bottom: 20px;
    }

    .vox-use-case-card ul {
      list-style: none;
      padding: 0;
    }

    .vox-use-case-card ul li {
      padding: 8px 0;
      color: #888;
      font-size: 0.95rem;
      padding-left: 24px;
      position: relative;
    }

    .vox-use-case-card ul li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #FD6262;
      font-weight: bold;
    }

    .vox-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      background: linear-gradient(135deg, #FD6262 0%, #FF8A8A 100%);
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .vox-use-case-card.vox-custom {
      background: linear-gradient(135deg, rgba(253, 98, 98, 0.1) 0%, rgba(253, 98, 98, 0.05) 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .vox-link-arrow {
      color: #FD6262;
      text-decoration: none;
      font-weight: 600;
      margin-top: 16px;
      display: inline-block;
      transition: all 0.3s ease;
    }

    .vox-link-arrow:hover {
      transform: translateX(4px);
    }

    /* Speed Comparison */
    .vox-speed-comparison {
      max-width: 800px;
      margin: 60px auto;
    }

    .vox-comparison-row {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
    }

    .vox-comparison-label {
      width: 160px;
      font-weight: 600;
      color: #b0b0b0;
      font-size: 0.95rem;
    }

    .vox-comparison-bar-container {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      height: 48px;
      position: relative;
      overflow: hidden;
    }

    .vox-comparison-bar {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 16px;
      font-weight: 600;
      font-size: 0.9rem;
      border-radius: 8px;
      transition: width 1.5s ease;
    }

    .vox-comparison-bar.vox-traditional {
      background: rgba(255, 255, 255, 0.1);
      color: #888;
    }

    .vox-comparison-bar.vox-human {
      background: rgba(255, 255, 255, 0.15);
      color: #aaa;
    }

    .vox-comparison-bar.vox-vox {
      background: linear-gradient(135deg, #FD6262 0%, #FF8A8A 100%);
      color: white;
      font-weight: 700;
      justify-content: center;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.9;
      }
    }

    .vox-trust-badges {
      display: flex;
      justify-content: center;
      gap: 32px;
      flex-wrap: wrap;
      margin-top: 60px;
    }

    .vox-trust-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .vox-trust-badge-icon {
      font-size: 2.5rem;
    }

    .vox-trust-badge-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: #b0b0b0;
      text-align: center;
    }

    /* Comparison Table */
    .vox-comparison-table {
      max-width: 900px;
      margin: 60px auto;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      overflow: hidden;
    }

    .vox-comparison-header,
    .vox-comparison-row-table {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 20px;
      padding: 20px 32px;
    }

    .vox-comparison-header {
      background: rgba(255, 255, 255, 0.05);
      font-weight: 700;
      text-align: center;
      font-size: 1.1rem;
    }

    .vox-comparison-header .vox-highlight-col {
      color: #FD6262;
    }

    .vox-comparison-row-table {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .vox-comparison-row-table:last-child {
      border-bottom: none;
    }

    .vox-comparison-col {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .vox-feature-name {
      justify-content: flex-start;
      font-weight: 600;
      color: #fff;
    }

    .vox-check {
      color: #4CAF50;
      font-size: 1.2rem;
      margin-right: 8px;
    }

    .vox-cross {
      color: #F44336;
      font-size: 1.2rem;
      margin-right: 8px;
    }

    .vox-highlight-col {
      background: rgba(253, 98, 98, 0.08);
      border-radius: 8px;
      font-weight: 600;
    }

    /* Voices Grid */
    .vox-voices-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
      margin-top: 60px;
    }

    .vox-voice-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      transition: all 0.3s ease;
    }

    .vox-voice-card:hover {
      border-color: rgba(253, 98, 98, 0.3);
      transform: translateY(-4px);
    }

    .vox-voice-avatar {
      font-size: 3rem;
      margin-bottom: 16px;
    }

    .vox-voice-card h3 {
      font-family: 'Poppins', sans-serif;
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: #fff;
    }

    .vox-voice-card p {
      color: #888;
      margin-bottom: 20px;
      font-size: 0.95rem;
    }

    .vox-play-btn {
      background: linear-gradient(135deg, #FD6262 0%, #FF8A8A 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
    }

    .vox-play-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 24px rgba(253, 98, 98, 0.3);
    }

    .vox-play-btn svg {
      width: 16px;
      height: 16px;
    }

    .vox-voices-note {
      text-align: center;
      color: #888;
      margin-top: 40px;
      font-style: italic;
    }

    /* FAQ Section */
    .vox-faq-list {
      max-width: 800px;
      margin: 60px auto;
    }

    .vox-faq-item {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      margin-bottom: 16px;
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .vox-faq-item:hover {
      border-color: rgba(253, 98, 98, 0.3);
    }

    .vox-faq-item.active {
      border-color: rgba(253, 98, 98, 0.5);
      background: rgba(253, 98, 98, 0.05);
    }

    .vox-faq-question {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 32px;
    }

    .vox-faq-question h3 {
      font-family: 'Poppins', sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      color: #fff;
      margin: 0;
    }

    .vox-faq-icon {
      font-size: 1.8rem;
      color: #FD6262;
      font-weight: 300;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .vox-faq-answer {
      padding: 0 32px 24px 32px;
      animation: slideDown 0.3s ease;
    }

    .vox-faq-answer p {
      color: #b0b0b0;
      line-height: 1.7;
      font-size: 1rem;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Final CTA */
    .vox-final-cta {
      background: linear-gradient(135deg, #1a1a1c 0%, #0a0a0a 100%);
      text-align: center;
      padding: 120px 20px;
    }

    .vox-final-cta h2 {
      font-family: 'Poppins', sans-serif;
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 600;
      margin-bottom: 16px;
    }

    .vox-final-cta > p {
      font-size: 1.2rem;
      color: #888;
      margin-bottom: 40px;
    }

    .vox-final-note {
      margin-top: 32px;
      color: #888;
      font-size: 1rem;
    }

    .vox-final-note a {
      color: #FD6262;
      text-decoration: none;
      font-weight: 600;
    }

    .vox-final-note a:hover {
      text-decoration: underline;
    }

    /* Modal Styles */
    .vox-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
      opacity: 0;
      animation: fadeIn 0.3s ease forwards;
    }

    @keyframes fadeIn {
      to {
        opacity: 1;
      }
    }

    .vox-modal {
      background: #1a1a1c;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 48px;
      max-width: 700px;
      width: 100%;
      position: relative;
      animation: slideUp 0.3s ease;
      max-height: 90vh;
      overflow-y: auto;
    }

    @keyframes slideUp {
      from {
        transform: translateY(40px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .vox-modal-close {
      position: absolute;
      top: 20px;
      right: 20px;
      background: none;
      border: none;
      color: #888;
      font-size: 2rem;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .vox-modal-close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .vox-modal-icon {
      width: 80px;
      height: 80px;
      background: rgba(253, 98, 98, 0.1);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .vox-modal-icon svg {
      width: 40px;
      height: 40px;
    }

    .vox-modal h2 {
      font-family: 'Poppins', sans-serif;
      font-size: 2rem;
      font-weight: 600;
      text-align: center;
      margin-bottom: 12px;
      color: #fff;
    }

    .vox-modal h2 span {
      background: linear-gradient(135deg, #FD6262 0%, #FF8A8A 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .vox-modal-subtitle {
      text-align: center;
      color: #888;
      font-size: 1rem;
      margin-bottom: 40px;
      line-height: 1.6;
    }

    .vox-modal-steps {
      margin-bottom: 32px;
    }

    .vox-modal-step {
      display: flex;
      gap: 20px;
      margin-bottom: 24px;
      align-items: flex-start;
    }

    .vox-modal-step-number {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #FD6262 0%, #FF8A8A 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .vox-modal-step-content h4 {
      font-family: 'Poppins', sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 6px;
      color: #fff;
    }

    .vox-modal-step-content p {
      color: #b0b0b0;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .vox-modal-step-content code {
      background: rgba(253, 98, 98, 0.1);
      color: #FD6262;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }

    .vox-modal-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }

    .vox-modal-btn {
      flex: 1;
      padding: 16px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      border: none;
    }

    .vox-modal-btn-primary {
      background: linear-gradient(135deg, #FD6262 0%, #FF8A8A 100%);
      color: white;
    }

    .vox-modal-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(253, 98, 98, 0.3);
    }

    .vox-modal-btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      color: #888;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .vox-modal-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    .vox-modal-note {
      text-align: center;
      color: #666;
      font-size: 0.85rem;
      line-height: 1.6;
    }

    /* Animations */
    .vox-fade-in {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.8s ease;
    }

    .vox-fade-in.vox-animate-in {
      opacity: 1;
      transform: translateY(0);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .vox-features-grid,
      .vox-use-cases-grid,
      .vox-voices-grid {
        grid-template-columns: 1fr;
      }

      .vox-comparison-header,
      .vox-comparison-row-table {
        grid-template-columns: 1.5fr 1fr 1fr;
        gap: 10px;
        padding: 16px;
        font-size: 0.9rem;
      }

      .vox-comparison-label {
        width: 120px;
        font-size: 0.85rem;
      }

      .vox-modal {
        padding: 32px 24px;
      }

      .vox-modal-actions {
        flex-direction: column;
      }

      .vox-stats-row {
        gap: 32px;
      }

      .vox-cta-group {
        flex-direction: column;
      }

      .vox-btn-primary,
      .vox-btn-secondary {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .vox-hero-section,
      .vox-features-section,
      .vox-use-cases-section,
      .vox-trust-section,
      .vox-comparison-section,
      .vox-voices-section,
      .vox-faq-section,
      .vox-final-cta {
        padding: 60px 20px;
      }

      .vox-feature-card,
      .vox-use-case-card,
      .vox-voice-card {
        padding: 24px;
      }

      .vox-faq-question {
        padding: 20px;
      }

      .vox-faq-answer {
        padding: 0 20px 20px 20px;
      }
    }
  `;
}
