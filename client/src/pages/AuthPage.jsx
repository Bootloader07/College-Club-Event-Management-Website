import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { login } from '../api/auth';
import { loginStudent, registerStudent } from '../api/students';
import { useToast } from '../context/ToastContext';
import '../styles/auth.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Alumni'];

function validateRegister(f) {
  const e = {};
  if (!f.name.trim()) e.name = 'Full name is required.';
  const abesEmailRegex = /^[a-zA-Z]+\.[a-zA-Z0-9]+@abes\.ac\.in$/;
  if (!f.email.trim()) {
    e.email = 'Email is required.';
  } else if (!abesEmailRegex.test(f.email.trim())) {
    e.email = 'Only ABES college emails are valid (format: name.admissionno@abes.ac.in)';
  }
  if (!f.password) {
    e.password = 'Password is required.';
  } else if (f.password.length < 6) {
    e.password = 'Must be at least 6 characters.';
  }
  if (!f.college.trim()) e.college = 'College / Department is required.';
  if (!f.year) e.year = 'Year is required.';
  if (!f.phone.trim()) {
    e.phone = 'Phone number is required.';
  } else if (!/^\d{10}$/.test(f.phone.replace(/\s/g, ''))) {
    e.phone = 'Enter a valid 10-digit number.';
  }
  return e;
}

// Determine initial tab from path + query params
function resolveInitialTab(pathname, searchParams) {
  if (pathname === '/admin/login') return 'admin';
  if (searchParams.get('tab') === 'register') return 'register';
  return 'student';
}

// ── Copy Button ───────────────────────────────────────────────────────────────

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      className={`auth-copy-btn${copied ? ' copied' : ''}`}
      onClick={handleCopy}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ── Demo Credentials Block ────────────────────────────────────────────────────

function DemoCredentials({ rows, note, onFill }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="auth-demo-wrap">
      <button
        type="button"
        className="auth-demo-toggle"
        onClick={() => setOpen(p => !p)}
      >
        <span>→ Demo credentials</span>
        <span className={`auth-demo-chevron${open ? ' open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="auth-demo-body">
          {rows.map(({ label, value, field }) => (
            <div className="auth-demo-row" key={label}>
              <span className="auth-demo-label">{label}:</span>
              <span
                className="auth-demo-value"
                title={`Click to fill ${label}`}
                onClick={() => onFill(field, value)}
              >
                {value}
              </span>
              <CopyBtn text={value} />
            </div>
          ))}
          <p className="auth-demo-note">{note}</p>
        </div>
      )}
    </div>
  );
}

// ── Password field with eye toggle ───────────────────────────────────────────

function PwField({ id, label, value, onChange, placeholder, hasError, errMsg, isAmber }) {
  const [show, setShow] = useState(false);
  return (
    <div className="auth-fg">
      <label htmlFor={id}>{label}</label>
      <div className="auth-inp-pw-wrap">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`auth-inp${isAmber ? ' inp-amber' : ''}${hasError ? ' inp-error' : ''}`}
        />
        <button
          type="button"
          className="auth-pw-eye"
          onClick={() => setShow(p => !p)}
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? '🙈' : '👁'}
        </button>
      </div>
      {hasError && <p className="auth-field-err-msg">{errMsg}</p>}
    </div>
  );
}

// ── Left panel content (changes per tab) ─────────────────────────────────────

const LEFT_CONTENT = {
  student: {
    heading: 'Welcome back',
    subtitle: 'Sign in to discover and register for campus events.',
    pills: ['🎓 ABES Verified', '📅 Event Registration', '📋 Track Yours'],
  },
  register: {
    heading: 'Join ABES Wave',
    subtitle: 'Create your account and never miss a campus event.',
    pills: ['🎓 ABES Verified', '📅 Event Registration', '📋 Track Yours'],
  },
  admin: {
    heading: 'Admin Access',
    subtitle: 'Manage events and registrations for your college club.',
    pills: ['➕ Add Events', '✏️ Manage', '👥 Registrations'],
  },
};

// ══════════════════════════════════════════════════════════
// STUDENT LOGIN FORM
// ══════════════════════════════════════════════════════════

function StudentLoginForm({ onSwitchRegister }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function fillDemo(field, value) {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginStudent({ email: email.trim(), password });
      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('studentName', data.student.name);
      localStorage.setItem('studentProfile', JSON.stringify(data.student));
      window.dispatchEvent(new Event('authChange'));
      showToast(`Welcome back, ${data.student.name}!`, 'success');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="auth-form-eyebrow auth-form-eyebrow-accent">SECURE ACCESS</p>
      <h1 className="auth-form-heading">Welcome back</h1>
      <p className="auth-form-tagline">Sign in to continue to your personalised portal.</p>

      <div className="auth-fg">
        <label htmlFor="sl-email">Email Address</label>
        <input
          id="sl-email"
          type="email"
          className="auth-inp"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <PwField
        id="sl-pw"
        label="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <div className="auth-forgot-row">
        <button type="button" className="auth-forgot-link" tabIndex={-1}>
          Forgot password?
        </button>
      </div>

      {error && <div className="auth-err-box">{error}</div>}

      <button
        type="submit"
        className="auth-submit auth-submit-accent"
        disabled={loading || !email || !password}
      >
        {loading ? 'Signing in…' : 'Sign In →'}
      </button>

      <p className="auth-switch-row">
        New to ABES Wave?{' '}
        <button type="button" className="auth-switch-action" onClick={onSwitchRegister}>
          Create your account
        </button>
      </p>

      <DemoCredentials
        rows={[
          { label: 'Email', value: 'demo@student.edu', field: 'email' },
          { label: 'Password', value: 'demo123', field: 'password' },
        ]}
        note="Use these to explore the student experience"
        onFill={fillDemo}
      />
    </form>
  );
}

// ══════════════════════════════════════════════════════════
// STUDENT REGISTER FORM
// ══════════════════════════════════════════════════════════

function StudentRegisterForm({ onSwitchLogin }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const [form, setForm] = useState({
    name: '', email: '', password: '', college: '', year: '', phone: '',
  });
  const [errs, setErrs] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => {
      setForm(p => ({ ...p, [field]: e.target.value }));
      setErrs(p => ({ ...p, [field]: '' }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validateRegister(form);
    if (Object.keys(v).length) { setErrs(v); return; }
    setServerErr('');
    setLoading(true);
    try {
      const data = await registerStudent(form);
      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('studentName', data.student.name);
      localStorage.setItem('studentProfile', JSON.stringify(data.student));
      window.dispatchEvent(new Event('authChange'));
      showToast(`Account created! Welcome, ${data.student.name}!`, 'success');
      navigate('/');
    } catch (err) {
      setServerErr(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="auth-form-eyebrow auth-form-eyebrow-accent">JOIN ABES WAVE</p>
      <h1 className="auth-form-heading">Create Account</h1>
      <p className="auth-form-tagline">Join the College Events Platform</p>

      <div className="auth-fg">
        <label htmlFor="r-name">Full Name</label>
        <input
          id="r-name"
          type="text"
          className={`auth-inp${errs.name ? ' inp-error' : ''}`}
          value={form.name}
          onChange={set('name')}
        />
        {errs.name && <p className="auth-field-err-msg">{errs.name}</p>}
      </div>

      <div className="auth-fg">
        <label htmlFor="r-email">Email Address</label>
        <input
          id="r-email"
          type="email"
          className={`auth-inp${errs.email ? ' inp-error' : ''}`}
          value={form.email}
          onChange={set('email')}
        />
        {errs.email && <p className="auth-field-err-msg">{errs.email}</p>}
      </div>

      <PwField
        id="r-pw"
        label="Password"
        value={form.password}
        onChange={set('password')}
        placeholder="Min 6 characters"
        hasError={Boolean(errs.password)}
        errMsg={errs.password}
      />

      <div className="auth-fg-row2">
        <div className="auth-fg">
          <label htmlFor="r-college">College / Department</label>
          <input
            id="r-college"
            type="text"
            className={`auth-inp${errs.college ? ' inp-error' : ''}`}
            value={form.college}
            onChange={set('college')}
            placeholder="e.g. Computer Science"
          />
          {errs.college && <p className="auth-field-err-msg">{errs.college}</p>}
        </div>

        <div className="auth-fg">
          <label htmlFor="r-year">Year</label>
          <select
            id="r-year"
            className={`auth-inp${errs.year ? ' inp-error' : ''}`}
            value={form.year}
            onChange={set('year')}
          >
            <option value="">Select year</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {errs.year && <p className="auth-field-err-msg">{errs.year}</p>}
        </div>
      </div>

      <div className="auth-fg">
        <label htmlFor="r-phone">Phone Number</label>
        <input
          id="r-phone"
          type="tel"
          className={`auth-inp${errs.phone ? ' inp-error' : ''}`}
          value={form.phone}
          onChange={set('phone')}
          placeholder="10-digit mobile number"
          maxLength={10}
        />
        {errs.phone && <p className="auth-field-err-msg">{errs.phone}</p>}
      </div>

      {serverErr && <div className="auth-err-box">{serverErr}</div>}

      <button type="submit" className="auth-submit auth-submit-accent" disabled={loading}>
        {loading ? 'Creating account…' : 'Create Account →'}
      </button>

      <p className="auth-switch-row">
        Already have an account?{' '}
        <button type="button" className="auth-switch-action" onClick={onSwitchLogin}>
          Sign In
        </button>
      </p>
    </form>
  );
}

// ══════════════════════════════════════════════════════════
// ADMIN LOGIN FORM
// ══════════════════════════════════════════════════════════

function AdminLoginForm() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function fillDemo(field, value) {
    if (field === 'username') setUsername(value);
    if (field === 'password') setPassword(value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username.trim(), password);
      localStorage.setItem('adminToken', data.token);
      window.dispatchEvent(new Event('authChange'));
      showToast('Welcome to the Admin Dashboard!', 'success');
      navigate('/admin');
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="auth-form-eyebrow auth-form-eyebrow-amber">ADMIN PORTAL</p>
      <h1 className="auth-form-heading">Admin Access</h1>
      <p className="auth-form-tagline">Sign in to manage events and registrations.</p>

      <div className="auth-fg">
        <label htmlFor="al-user">Username</label>
        <input
          id="al-user"
          type="text"
          className="auth-inp inp-amber"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
      </div>

      <PwField
        id="al-pw"
        label="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        isAmber
      />

      {error && <div className="auth-err-box">{error}</div>}

      <button
        type="submit"
        className="auth-submit auth-submit-amber"
        disabled={loading || !username || !password}
      >
        {loading ? 'Signing in…' : 'Sign In →'}
      </button>

      <DemoCredentials
        rows={[
          { label: 'Username', value: 'admin', field: 'username' },
          { label: 'Password', value: 'admin123', field: 'password' },
        ]}
        note="Administrator account — full event management access"
        onFill={fillDemo}
      />
    </form>
  );
}

// ══════════════════════════════════════════════════════════
// LEFT PANEL
// ══════════════════════════════════════════════════════════

function LeftPanel({ tab }) {
  const { heading, subtitle, pills } = LEFT_CONTENT[tab] ?? LEFT_CONTENT.student;

  return (
    <div className="auth-left" aria-hidden="true">
      <div className="auth-left-orb auth-left-orb-tl" />
      <div className="auth-left-orb auth-left-orb-br" />

      <div className="auth-left-content">
        <div className="auth-left-logo">ABES<span> Wave</span></div>
        <div className="auth-left-badge">+ COLLEGE EVENTS PLATFORM</div>
        <h2 className="auth-left-heading">{heading}</h2>
        <p className="auth-left-subtitle">{subtitle}</p>
        <div className="auth-left-pills">
          {pills.map(pill => (
            <span key={pill} className="auth-left-pill">{pill}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// AUTH PAGE ROOT
// ══════════════════════════════════════════════════════════

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState(() =>
    resolveInitialTab(location.pathname, searchParams)
  );

  // Redirect-if-already-logged-in guard
  useEffect(() => {
    if (location.pathname === '/admin/login' && localStorage.getItem('adminToken')) {
      navigate('/admin', { replace: true });
    } else if (location.pathname === '/login' && localStorage.getItem('studentToken')) {
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Sync tab when URL changes (e.g. browser back)
  useEffect(() => {
    setTab(resolveInitialTab(location.pathname, searchParams));
  }, [location.pathname, searchParams]);

  const tabClass = useCallback((name) => {
    const isActive = tab === name;
    if (!isActive) return 'auth-right-tab';
    return `auth-right-tab ${name === 'admin' ? 'active-admin' : 'active-student'}`;
  }, [tab]);

  return (
    <div className="auth-page">
      <LeftPanel tab={tab} />

      <div className="auth-right">
        <div className="auth-right-inner">
          {/* Tab bar */}
          <div className="auth-right-tabs" role="tablist">
            <button
              type="button"
              className={tabClass('student')}
              role="tab"
              aria-selected={tab === 'student'}
              onClick={() => setTab('student')}
            >
              Student Login
            </button>
            <button
              type="button"
              className={tabClass('register')}
              role="tab"
              aria-selected={tab === 'register'}
              onClick={() => setTab('register')}
            >
              Register
            </button>
            <button
              type="button"
              className={tabClass('admin')}
              role="tab"
              aria-selected={tab === 'admin'}
              onClick={() => setTab('admin')}
            >
              Admin Login
            </button>
          </div>

          {/* Form content */}
          {tab === 'student' && (
            <StudentLoginForm onSwitchRegister={() => setTab('register')} />
          )}
          {tab === 'register' && (
            <StudentRegisterForm onSwitchLogin={() => setTab('student')} />
          )}
          {tab === 'admin' && (
            <AdminLoginForm />
          )}
        </div>
      </div>
    </div>
  );
}
