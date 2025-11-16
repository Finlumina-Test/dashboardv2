"use client";

import { useEffect, useRef } from "react";

export default function HomePage() {
  const iframeRefs = useRef([]);

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

      {/* Restaurant Login Link */}
      <div style={{ textAlign: 'center', padding: '40px 20px', background: '#0a0a0a' }}>
        <a
          href="/login"
          style={{
            display: 'inline-block',
            background: 'white',
            color: 'black',
            padding: '16px 32px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontFamily: "'Open Sans', sans-serif",
            fontWeight: '600',
            fontSize: '18px'
          }}
        >
          Restaurant Login →
        </a>
      </div>
    </div>
  );
}
