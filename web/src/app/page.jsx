"use client";

export default function HomePage() {
  // Don't redirect logged-in users - let them see the homepage

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#141416' }}>
      {/* Hero Section Iframe */}
      <iframe
        src="/homepage-sections/hero.html"
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          display: 'block'
        }}
        title="Hero Section"
      />

      {/* Features Section Iframe */}
      <iframe
        src="/homepage-sections/features.html"
        style={{
          width: '100%',
          height: '800px',
          border: 'none',
          display: 'block'
        }}
        title="Features Section"
      />

      {/* Use Cases Section Iframe */}
      <iframe
        src="/homepage-sections/use-cases.html"
        style={{
          width: '100%',
          height: '900px',
          border: 'none',
          display: 'block'
        }}
        title="Use Cases Section"
      />

      {/* Trust & Speed Section Iframe */}
      <iframe
        src="/homepage-sections/trust.html"
        style={{
          width: '100%',
          height: '700px',
          border: 'none',
          display: 'block'
        }}
        title="Trust Section"
      />

      {/* Comparison Section Iframe */}
      <iframe
        src="/homepage-sections/comparison.html"
        style={{
          width: '100%',
          height: '700px',
          border: 'none',
          display: 'block'
        }}
        title="Comparison Section"
      />

      {/* Voices Section Iframe */}
      <iframe
        src="/homepage-sections/voices.html"
        style={{
          width: '100%',
          height: '700px',
          border: 'none',
          display: 'block'
        }}
        title="Voices Section"
      />

      {/* FAQ Section Iframe */}
      <iframe
        src="/homepage-sections/faq.html"
        style={{
          width: '100%',
          height: '900px',
          border: 'none',
          display: 'block'
        }}
        title="FAQ Section"
      />

      {/* Final CTA Section Iframe */}
      <iframe
        src="/homepage-sections/cta.html"
        style={{
          width: '100%',
          height: '500px',
          border: 'none',
          display: 'block'
        }}
        title="CTA Section"
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
