import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Landing.css';

const sampleMedicines = [
  {
    id: 1,
    name: 'Augmentin 625 Duo',
    genericName: 'Amoxicillin + Potassium Clavulanate',
    profile: 'Arthur (Grandpa)',
    status: 'expiring',
    statusText: 'Expiring in 5 Days',
    badgeClass: 'badge-warning',
    qty: 4,
    threshold: 6,
    expiry: 'Oct 18, 2026',
    timing: '8:00 AM & 8:00 PM',
    lastTaken: 'Today, 8:04 AM',
    taken: true,
  },
  {
    id: 2,
    name: 'Metformin 500mg SR',
    genericName: 'Metformin Hydrochloride',
    profile: 'Arthur (Grandpa)',
    status: 'ok',
    statusText: 'Fresh & Valid',
    badgeClass: 'badge-success',
    qty: 28,
    threshold: 10,
    expiry: 'Mar 15, 2027',
    timing: '1:30 PM with Lunch',
    lastTaken: 'Pending today',
    taken: false,
  },
  {
    id: 3,
    name: 'Calpol 250mg Suspension',
    genericName: 'Paracetamol Paediatric',
    profile: 'Leo (Child)',
    status: 'lowstock',
    statusText: 'Low Stock Alert',
    badgeClass: 'badge-danger',
    qty: 1,
    threshold: 2,
    expiry: 'Jul 30, 2027',
    timing: 'SOS on Fever (>99.5°F)',
    lastTaken: '3 days ago',
    taken: false,
  },
  {
    id: 4,
    name: 'Thyronorm 50mcg',
    genericName: 'Levothyroxine Sodium',
    profile: 'Sarah (Mother)',
    status: 'ok',
    statusText: 'Fresh & Valid',
    badgeClass: 'badge-success',
    qty: 45,
    threshold: 15,
    expiry: 'Dec 2027',
    timing: '6:30 AM Empty Stomach',
    lastTaken: 'Today, 6:32 AM',
    taken: true,
  }
];

const faqs = [
  {
    q: 'How does the AI Packaging Scanner work?',
    a: 'Simply hold any blister strip, medicine box, or bottle up to your phone or webcam. MediCabinet’s neural OCR engine scans the packaging in under 1.5 seconds, extracting the trade name, active composition, batch number, and expiry date without manual typing.'
  },
  {
    q: 'Will I get email alerts before medicines expire?',
    a: 'Yes! MediCabinet continuously runs a 24/7 background radar. The moment a medication is nearing its expiry date or falls below your designated safety threshold, you receive a crisp, actionable email alert straight to your inbox.'
  },
  {
    q: 'Can I manage multiple family members separately?',
    a: 'Absolutely. You can create distinct profiles for Grandparents, Parents, Kids, or even Pets. Each profile maintains its own medication catalog, custom dosing schedule, and safety reminders to prevent accidental mix-ups.'
  },
  {
    q: 'Is MediCabinet free to use?',
    a: 'Yes, our core family medicine management suite—including automated email expiry alerts, profile management, and packaging scanning—is completely free for households.'
  },
  {
    q: 'Is my health data secure and private?',
    a: 'Your security is paramount. All communication is encrypted via TLS/SSL, authentication uses secure cryptographic tokens, and we never sell or share your family’s medical records with third-party advertisers.'
  }
];

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [interactiveMeds, setInteractiveMeds] = useState(sampleMedicines);
  const [activeFaq, setActiveFaq] = useState(0);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSimulateDose = (id) => {
    setInteractiveMeds(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          taken: !m.taken,
          lastTaken: !m.taken ? 'Just now ✓' : 'Pending today',
          qty: !m.taken ? Math.max(0, m.qty - 1) : m.qty + 1
        };
      }
      return m;
    }));
  };

  const runSampleScan = () => {
    setShowScanModal(true);
    setScanStep(1);
    setTimeout(() => setScanStep(2), 1200);
    setTimeout(() => setScanStep(3), 2200);
  };

  const filteredMeds = interactiveMeds.filter(m => {
    if (activeTab === 'all') return true;
    if (activeTab === 'expiring') return m.status === 'expiring';
    if (activeTab === 'lowstock') return m.status === 'lowstock';
    if (activeTab === 'arthur') return m.profile.includes('Arthur');
    return true;
  });

  return (
    <div className="landing-page">
      {/* ── Background Ambient Light Orbs ── */}
      <div className="ambient-orb orb-1" aria-hidden="true" />
      <div className="ambient-orb orb-2" aria-hidden="true" />
      <div className="ambient-orb orb-3" aria-hidden="true" />

      {/* ── Sticky Top Navigation ── */}
      <header className={`landing-nav ${navScrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <Link to="/" className="landing-brand">
            <span className="brand-icon-wrapper">
              <span className="brand-icon">💊</span>
              <span className="brand-pulse-dot" />
            </span>
            <div className="brand-text-block">
              <span className="brand-title">Medi<span className="text-red">Cabinet</span></span>
              <span className="brand-tagline">Intelligent Health</span>
            </div>
          </Link>

          <nav className={`landing-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#interactive-demo" onClick={() => setMobileMenuOpen(false)}>Live Demo</a>
            <a href="#scanner" onClick={() => setMobileMenuOpen(false)}>AI Scanner</a>
            <a href="#family" onClick={() => setMobileMenuOpen(false)}>Family Hub</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
          </nav>

          <div className="landing-nav-actions">
            {user ? (
              <div className="auth-pill-group">
                <span className="user-greeting">Hi, {user.name?.split(' ')[0]}</span>
                <button 
                  className="btn-landing-primary pulse-btn" 
                  onClick={() => navigate('/dashboard')}
                  id="nav-btn-cabinet"
                >
                  Open Cabinet <span className="arrow-icon">→</span>
                </button>
              </div>
            ) : (
              <div className="guest-nav-group">
                <Link to="/login" className="btn-landing-ghost" id="nav-btn-login">Sign In</Link>
                <Link to="/register" className="btn-landing-primary" id="nav-btn-register">
                  Get Started Free <span className="arrow-icon">→</span>
                </Link>
              </div>
            )}
            <button 
              className="mobile-toggle-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-pill-badge">
              <span className="badge-sparkle">✨</span>
              <span>AI-Powered Family Medication & Expiry Watchdog</span>
              <span className="badge-new-pill">v2.0 LIVE</span>
            </div>

            <h1 className="hero-heading">
              Never Miss a Dose.<br />
              <span className="heading-gradient">Never Take an Expired</span> Medicine.
            </h1>

            <p className="hero-lead">
              MediCabinet safeguards your loved ones by centralizing prescriptions, tracking expiry dates, 
              scanning strip packaging with instant AI OCR, and delivering automated email alerts before supplies run dry.
            </p>

            <div className="hero-cta-group">
              {user ? (
                <button 
                  className="btn-hero-cta primary-cta" 
                  onClick={() => navigate('/dashboard')}
                  id="hero-btn-dashboard"
                >
                  <span>Launch Your Cabinet</span>
                  <span className="btn-arrow">→</span>
                </button>
              ) : (
                <Link to="/register" className="btn-hero-cta primary-cta" id="hero-btn-start">
                  <span>Start Free in 30 Seconds</span>
                  <span className="btn-arrow">→</span>
                </Link>
              )}
              <a href="#interactive-demo" className="btn-hero-cta secondary-cta">
                <span className="play-icon">▶</span>
                <span>Try Interactive Cabinet</span>
              </a>
            </div>

            <div className="hero-trust-row">
              <div className="trust-item">
                <span className="trust-icon">🛡️</span>
                <span>HIPAA-Minded Data Privacy</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">⚡</span>
                <span>1.5s Optical Packaging OCR</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">✉️</span>
                <span>Direct Gmail / SMTP Alerts</span>
              </div>
            </div>
          </div>

          <div className="hero-visual-wrapper">
            <div className="hero-visual-card">
              <div className="visual-card-glow" />
              <div className="visual-img-container">
                <img 
                  src="/hero-3d.jpg" 
                  alt="MediCabinet 3D Smart Cabinet Mockup" 
                  className="hero-main-img"
                  loading="eager"
                />
              </div>

              {/* Floating Live Floating HUD Badges */}
              <div className="hud-badge top-right floating-slow">
                <div className="hud-icon warning">⚠️</div>
                <div className="hud-text">
                  <strong>Augmentin 625 Duo</strong>
                  <span>Expires in 5 days • Email alert sent</span>
                </div>
              </div>

              <div className="hud-badge bottom-left floating-mid">
                <div className="hud-icon success">✓</div>
                <div className="hud-text">
                  <strong>Grandpa Arthur</strong>
                  <span>Blood Pressure dose taken at 8:04 AM</span>
                </div>
              </div>

              <div className="hud-badge center-bottom floating-fast">
                <div className="hud-icon info">📸</div>
                <div className="hud-text">
                  <strong>Neural Packaging Scan</strong>
                  <span>Auto-filled Batch & Expiry in 1.4s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Stats Banner ── */}
      <section className="stats-strip">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-number">99.8%</div>
            <div className="stat-label">Expiry Detection Accuracy</div>
            <div className="stat-sub">Zero surprise expired meds</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">&lt; 1.5s</div>
            <div className="stat-label">OCR Packaging Parsing</div>
            <div className="stat-sub">Blister strips & carton boxes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">100%</div>
            <div className="stat-label">Automated Delivery</div>
            <div className="stat-sub">Real-time email alerts</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">0 / 4</div>
            <div className="stat-label">Zero Mix-Ups</div>
            <div className="stat-sub">Segregated family profiles</div>
          </div>
        </div>
      </section>

      {/* ── Live Interactive Cabinet Sandbox ── */}
      <section className="sandbox-section" id="interactive-demo">
        <div className="section-header text-center">
          <div className="section-pill">Interactive Experience</div>
          <h2 className="section-title">Experience MediCabinet Right Here</h2>
          <p className="section-subtitle">
            Click through real live medicine cards, simulate taking morning doses, and test our smart status triggers.
          </p>
        </div>

        <div className="sandbox-wrapper">
          <div className="sandbox-toolbar">
            <div className="sandbox-tabs">
              <button 
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Medicines ({interactiveMeds.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'expiring' ? 'active' : ''}`}
                onClick={() => setActiveTab('expiring')}
              >
                ⚠️ Expiring Soon
              </button>
              <button 
                className={`tab-btn ${activeTab === 'lowstock' ? 'active' : ''}`}
                onClick={() => setActiveTab('lowstock')}
              >
                📉 Low Stock
              </button>
              <button 
                className={`tab-btn ${activeTab === 'arthur' ? 'active' : ''}`}
                onClick={() => setActiveTab('arthur')}
              >
                👴 Arthur's Box
              </button>
            </div>

            <div className="sandbox-actions-top">
              <button className="btn-sandbox-scan" onClick={runSampleScan}>
                <span>📸 Test AI Scanner</span>
              </button>
            </div>
          </div>

          <div className="sandbox-grid">
            {filteredMeds.map((med) => (
              <div className={`sandbox-card ${med.taken ? 'dose-taken' : ''}`} key={med.id}>
                <div className="card-top-row">
                  <div>
                    <h3 className="card-med-name">{med.name}</h3>
                    <p className="card-med-generic">{med.genericName}</p>
                  </div>
                  <span className={`status-pill ${med.badgeClass}`}>
                    {med.statusText}
                  </span>
                </div>

                <div className="card-profile-tag">
                  <span className="tag-avatar">👤</span>
                  <span>{med.profile}</span>
                </div>

                <div className="card-meta-list">
                  <div className="meta-row">
                    <span className="meta-label">Quantity Remaining:</span>
                    <span className="meta-val highlight-qty">
                      {med.qty} units {med.qty <= med.threshold && <span className="low-warn">(Alert at {med.threshold})</span>}
                    </span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Expiry Date:</span>
                    <span className="meta-val">{med.expiry}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Prescribed Timing:</span>
                    <span className="meta-val">{med.timing}</span>
                  </div>
                </div>

                <div className="card-footer-action">
                  <div className="adherence-status">
                    <span className="bullet-dot" />
                    <span className="status-note">{med.lastTaken}</span>
                  </div>
                  <button 
                    className={`btn-take-dose ${med.taken ? 'is-taken' : ''}`}
                    onClick={() => handleSimulateDose(med.id)}
                  >
                    {med.taken ? '✓ Taken' : '💊 Take Dose'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="sandbox-footnote">
            <span>💡 Pro-tip: Try clicking "Take Dose" to see quantity deduct and adherence mark instantly in real-time.</span>
          </div>
        </div>
      </section>

      {/* ── Feature Spotlight 1: AI Packaging OCR ── */}
      <section className="feature-spotlight-section" id="scanner">
        <div className="spotlight-container">
          <div className="spotlight-visual">
            <div className="spotlight-frame">
              <img 
                src="/ocr-scan.jpg" 
                alt="Smartphone scanning medicine strip packaging" 
                className="spotlight-img"
              />
              <div className="spotlight-overlay-tag">
                <span className="pulse-green-dot" />
                <span>Auto-Extraction Active • Confidence 99.4%</span>
              </div>
            </div>
          </div>

          <div className="spotlight-text">
            <div className="section-pill">Computer Vision Intelligence</div>
            <h2 className="spotlight-title">
              Scan Medicine Packaging.<br />
              <span className="text-red">Zero Manual Typing.</span>
            </h2>
            <p className="spotlight-desc">
              Tired of squinting at microscopic expiry dates printed on embossed foil blister packs?
              Our integrated camera OCR analyzes the text instantly, identifying brand names, salt compositions, 
              batch IDs, and expiry dates with pharmaceutical precision.
            </p>

            <div className="feature-checklist">
              <div className="check-item">
                <div className="check-bullet">✓</div>
                <div>
                  <strong>Embossed Foil & Dot Matrix Recognition</strong>
                  <p>Handles challenging blister pack foil prints, ink-jet expiry timestamps, and folded carton labels.</p>
                </div>
              </div>

              <div className="check-item">
                <div className="check-bullet">✓</div>
                <div>
                  <strong>Automatic Ingredient & Use Association</strong>
                  <p>Ties recognized brand names to verified salt formulations (e.g., Paracetamol, Amoxicillin, Metformin).</p>
                </div>
              </div>

              <div className="check-item">
                <div className="check-bullet">✓</div>
                <div>
                  <strong>Human-in-the-Loop Confidence Highlighting</strong>
                  <p>Any uncertain digits are highlighted in amber so you always remain in complete control before saving.</p>
                </div>
              </div>
            </div>

            <div className="spotlight-action-row">
              <button className="btn-landing-primary" onClick={runSampleScan}>
                See Simulated Scanner Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Spotlight 2: Multi-Profile Family Isolation ── */}
      <section className="feature-spotlight-section reverse-layout" id="family">
        <div className="spotlight-container">
          <div className="spotlight-text">
            <div className="section-pill">Dedicated Family Care</div>
            <h2 className="spotlight-title">
              One Smart Cabinet.<br />
              <span className="text-red">Custom Profiles for Everyone.</span>
            </h2>
            <p className="spotlight-desc">
              Never confuse Grandpa's blood pressure medication with your child's allergy syrup.
              Organize every family member into dedicated profiles with custom dose reminders, 
              adherence tracking, and emergency contact associations.
            </p>

            <div className="family-feature-grid">
              <div className="family-pill-card">
                <div className="pill-avatar">👴</div>
                <h4>Senior Care</h4>
                <p>High-contrast views, large dosage text, and daily caregiver email confirmation.</p>
              </div>

              <div className="family-pill-card">
                <div className="pill-avatar">👶</div>
                <h4>Pediatric Safety</h4>
                <p>Weight-based pediatric dosages, suspension expiry alerts, and SOS fever timers.</p>
              </div>

              <div className="family-pill-card">
                <div className="pill-avatar">👩</div>
                <h4>Adult Wellness</h4>
                <p>Daily vitamins, chronic care prescriptions, and automatic 5-day refill warnings.</p>
              </div>

              <div className="family-pill-card">
                <div className="pill-avatar">🐾</div>
                <h4>Pet Friendly</h4>
                <p>Separate compartments for flea treatments, heartworm tablets, and vet schedules.</p>
              </div>
            </div>
          </div>

          <div className="spotlight-visual">
            <div className="spotlight-frame">
              <img 
                src="/family-profiles.jpg" 
                alt="Family health profiles display with Arthur, Sarah, and Leo" 
                className="spotlight-img"
              />
              <div className="spotlight-overlay-tag top-align">
                <span>👨‍👩‍👧‍👦 Multi-User Safety Enforced</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Complete Feature Grid ── */}
      <section className="features-grid-section" id="features">
        <div className="section-header text-center">
          <div className="section-pill">Built for Peace of Mind</div>
          <h2 className="section-title">Everything Your Family Needs in One Place</h2>
          <p className="section-subtitle">
            Engineered from the ground up for safety, speed, and effortless simplicity.
          </p>
        </div>

        <div className="features-container">
          <div className="grid-feature-card">
            <div className="card-icon-box red-gradient">🚨</div>
            <h3>Proactive Expiry Radar</h3>
            <p>
              Real-time daily background scanner flags medicines expiring within 30 days, 7 days, or already past prime.
            </p>
          </div>

          <div className="grid-feature-card">
            <div className="card-icon-box">📧</div>
            <h3>Direct Email Alerts</h3>
            <p>
              No annoying app ping notifications needed. Actionable email digests alert you straight in your Gmail or Outlook.
            </p>
          </div>

          <div className="grid-feature-card">
            <div className="card-icon-box">📸</div>
            <h3>AI Packaging Scanner</h3>
            <p>
              Instant OCR scanning identifies batch codes, dates, and dosage without tedious manual typing.
            </p>
          </div>

          <div className="grid-feature-card">
            <div className="card-icon-box">⏰</div>
            <h3>Custom Dose Schedules</h3>
            <p>
              Morning, afternoon, evening, and bedtime schedule management with 1-click dose log confirmation.
            </p>
          </div>

          <div className="grid-feature-card">
            <div className="card-icon-box">📉</div>
            <h3>Low-Stock Refill Warnings</h3>
            <p>
              Set threshold quantities for critical medicines so you never run out unexpectedly during late nights.
            </p>
          </div>

          <div className="grid-feature-card">
            <div className="card-icon-box">🔒</div>
            <h3>100% Private & Encrypted</h3>
            <p>
              Your health information is isolated, secured by JWT cryptographic tokens, and never commercialized.
            </p>
          </div>
        </div>
      </section>

      {/* ── How It Works Journey ── */}
      <section className="how-it-works-section">
        <div className="section-header text-center">
          <div className="section-pill">Simple 3-Step Setup</div>
          <h2 className="section-title">How MediCabinet Works</h2>
          <p className="section-subtitle">
            Get your entire household organized and protected in less than three minutes.
          </p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-badge">01</div>
            <h3>Snap or Enter Medicines</h3>
            <p>Scan your medicine strips with your phone camera or type the name with auto-completing reference drugs.</p>
          </div>

          <div className="step-arrow">→</div>

          <div className="step-card">
            <div className="step-badge">02</div>
            <h3>Assign Profiles & Schedules</h3>
            <p>Link medications to family members, define safe stock levels, and set daily reminders.</p>
          </div>

          <div className="step-arrow">→</div>

          <div className="step-card">
            <div className="step-badge">03</div>
            <h3>Rest Easy with Smart Radar</h3>
            <p>MediCabinet keeps watch 24/7. When something expires or runs low, you receive instant email notices.</p>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="testimonials-section">
        <div className="section-header text-center">
          <div className="section-pill">Loved by Families & Caregivers</div>
          <h2 className="section-title">Real Stories, Real Safety</h2>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="quote-icon">“</div>
            <p className="quote-text">
              “Expired medicines lose potency or develop toxic degradants. MediCabinet is the cleanest preventative safety tool I’ve recommended to my patients.”
            </p>
            <div className="quote-author">
              <div className="author-avatar doc-avatar">👨‍⚕️</div>
              <div>
                <strong>Dr. Rajiv Malhotra</strong>
                <span>Consultant Family Physician</span>
              </div>
            </div>
          </div>

          <div className="testimonial-card featured-testimonial">
            <div className="quote-icon">“</div>
            <p className="quote-text">
              “Managing my elderly father’s 7 daily prescriptions used to keep me up at night. The email alerts and blister scanner gave our entire family total peace of mind.”
            </p>
            <div className="quote-author">
              <div className="author-avatar">👩</div>
              <div>
                <strong>Sunita & Rajesh K.</strong>
                <span>Primary Caregivers</span>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="quote-icon">“</div>
            <p className="quote-text">
              “The camera packaging scanner detected the tiny printed batch number and expiry date in under two seconds. No more squinting with magnifying glasses!”
            </p>
            <div className="quote-author">
              <div className="author-avatar">👨</div>
              <div>
                <strong>Anand Venkatesh</strong>
                <span>Software Architect & Father of 2</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="faq-section" id="faq">
        <div className="section-header text-center">
          <div className="section-pill">Frequently Asked Questions</div>
          <h2 className="section-title">Everything You Need to Know</h2>
        </div>

        <div className="faq-container">
          {faqs.map((faq, idx) => (
            <div 
              className={`faq-item ${activeFaq === idx ? 'open' : ''}`} 
              key={idx}
              onClick={() => setActiveFaq(activeFaq === idx ? -1 : idx)}
            >
              <div className="faq-question">
                <span>{faq.q}</span>
                <span className="faq-toggle">{activeFaq === idx ? '−' : '+'}</span>
              </div>
              {activeFaq === idx && (
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Pre-Footer High-Converting Banner ── */}
      <section className="cta-banner-section">
        <div className="cta-banner-card">
          <div className="banner-glow-effect" />
          <h2 className="banner-title">
            Ready to Protect Your Family’s Health?
          </h2>
          <p className="banner-subtitle">
            Join thousands of households keeping their medicine cabinet organized, fresh, and strictly on-schedule.
          </p>

          <div className="banner-btn-group">
            {user ? (
              <button 
                className="btn-banner-primary" 
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard Cabinet →
              </button>
            ) : (
              <Link to="/register" className="btn-banner-primary">
                Create Free Account in 30 Seconds →
              </Link>
            )}
            <Link to="/login" className="btn-banner-secondary">
              Sign In to Existing Account
            </Link>
          </div>
          <span className="banner-guarantee">✓ No credit card required • 100% Free household plan</span>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-col-brand">
            <div className="landing-brand footer-brand">
              <span className="brand-icon">💊</span>
              <span className="brand-title">Medi<span className="text-red">Cabinet</span></span>
            </div>
            <p className="footer-brand-desc">
              The intelligent digital medicine cabinet for modern households. Keep tracks of expirations, 
              schedules, and supplies across all family members with AI precision.
            </p>
            <div className="footer-status-pill">
              <span className="status-live-dot" />
              <span>All systems operational • Email Dispatch Active</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#scanner">AI Packaging OCR</a>
            <a href="#interactive-demo">Live Cabinet Demo</a>
            <a href="#family">Family Profiles</a>
          </div>

          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>

          <div className="footer-col">
            <h4>Safety & Compliance</h4>
            <span>HIPAA-Minded Architecture</span>
            <span>256-bit SSL Encryption</span>
            <span>Zero Third-Party Ad Tracking</span>
          </div>
        </div>

        <div className="footer-bottom-row">
          <div className="footer-disclaimer">
            ⚠️ <strong>Medical Disclaimer:</strong> MediCabinet is an organization, inventory tracking, and scheduling platform. 
            It is not intended to replace professional medical diagnosis, advice, or physician consultations.
          </div>
          <div className="footer-copy">
            © {new Date().getFullYear()} MediCabinet Technologies. Built with pride for family wellness.
          </div>
        </div>
      </footer>

      {/* ── Interactive Scanner Demo Modal ── */}
      {showScanModal && (
        <div className="scan-modal-backdrop" onClick={() => setShowScanModal(false)}>
          <div className="scan-modal-card" onClick={e => e.stopPropagation()}>
            <div className="scan-modal-header">
              <div className="modal-title-with-icon">
                <span className="scan-icon-pulse">📸</span>
                <h3>AI Neural Packaging Scan in Action</h3>
              </div>
              <button className="scan-close-btn" onClick={() => setShowScanModal(false)}>✕</button>
            </div>

            <div className="scan-modal-body">
              <div className="scan-viewport">
                <img 
                  src="/ocr-scan.jpg" 
                  alt="Packaging scanning simulation" 
                  className="scan-sample-img"
                />
                
                {scanStep === 1 && (
                  <div className="scan-laser-line" />
                )}

                {scanStep >= 2 && (
                  <>
                    <div className="ocr-bounding-box box-title">
                      <span className="box-tag">Medicine: Augmentin 625 Duo</span>
                    </div>
                    <div className="ocr-bounding-box box-expiry">
                      <span className="box-tag">Expiry: Oct 2026 (Verified)</span>
                    </div>
                    <div className="ocr-bounding-box box-batch">
                      <span className="box-tag">Batch: B24098</span>
                    </div>
                  </>
                )}
              </div>

              <div className="scan-status-panel">
                {scanStep === 1 && (
                  <div className="status-step-loading">
                    <span className="spinner-mini" />
                    <span>Neural OCR analyzing text contours and dot-matrix date stamps...</span>
                  </div>
                )}
                {scanStep === 2 && (
                  <div className="status-step-loading">
                    <span className="spinner-mini" />
                    <span>Matching active salts with national drug formulary...</span>
                  </div>
                )}
                {scanStep >= 3 && (
                  <div className="status-step-success">
                    <div className="success-banner">
                      <span className="check-large">✓</span>
                      <div>
                        <strong>Scan Complete! 100% Extracted</strong>
                        <p>All packaging fields auto-mapped without any manual typing.</p>
                      </div>
                    </div>

                    <div className="extracted-fields-grid">
                      <div className="extracted-field">
                        <label>Medicine Name</label>
                        <div>Augmentin 625 Duo</div>
                      </div>
                      <div className="extracted-field">
                        <label>Generic Composition</label>
                        <div>Amoxicillin 500mg + Clavulanic Acid 125mg</div>
                      </div>
                      <div className="extracted-field">
                        <label>Batch Number</label>
                        <div>B24098</div>
                      </div>
                      <div className="extracted-field">
                        <label>Calculated Expiry</label>
                        <div className="text-warning-bold">2026-10-18 (5 Days Left)</div>
                      </div>
                    </div>

                    <button 
                      className="btn-landing-primary full-width-btn" 
                      onClick={() => {
                        setShowScanModal(false);
                        if (user) navigate('/medicines');
                        else navigate('/register');
                      }}
                    >
                      {user ? 'Try with your own medicine in Cabinet →' : 'Sign up to Scan Your Medicines Free →'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
