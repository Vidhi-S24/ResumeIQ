import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, BrainCircuit, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';
import '../styles/login.css';

const roles: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'HR', label: 'HR' },
  { value: 'Recruiter', label: 'Recruiter' },
];

export default function LoginPage() {
  const { login, signup, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from=(location.state as {from?:Location})?.from?.pathname||'/dashboard';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sign-up fields
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('HR');
  const [companyName, setCompanyName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setRole('HR');
    setCompanyName('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    clearError();
    setValidationError(null);
  };

  const handleToggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    resetForm();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const ok = await login(email, password);
    if (ok) {
      setSuccess(true);
      setTimeout(() => navigate(from, { replace: true }), 600);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    const ok = await signup({ name, email, password, role, company_name: companyName });
    if (ok) {
      setSuccess(true);
      setTimeout(() => navigate(from, { replace: true }), 600);
    }
  };

  const displayError = validationError || error;

  return (
    <div className="login-container">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="login-right"
      >
        <div className="login-form-container">
          <div className="login-mobile-logo">
            <div className="login-mobile-logo-icon">
              <BrainCircuit />
            </div>
            <span className="login-mobile-logo-text">ResumeIQ</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="login-form-header">
              <h2 className="login-form-title">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="login-form-subtitle">
                {mode === 'signin'
                  ? 'Sign in to your ResumeIQ workspace'
                  : 'Start screening resumes with AI today'}
              </p>
            </div>

            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="login-form">
                <div className="login-form-field">
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="login-form-field">
                  <label className="label">Password</label>
                  <div className="login-form-password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="login-form-password-toggle"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                {displayError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="login-form-alert login-form-alert-error"
                  >
                    <AlertCircle />
                    <span>{displayError}</span>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="login-form-alert login-form-alert-success"
                  >
                    <CheckCircle />
                    <span>Login successful! Redirecting...</span>
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading || success}
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="btn-primary login-form-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </motion.button>
              </form>
            )}

            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="login-form">
                <div className="login-form-row">
                  <div className="login-form-field">
                    <label className="label">Full Name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>

                  <div className="login-form-field">
                    <label className="label">Company Name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Acme Inc."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      autoComplete="organization"
                    />
                  </div>
                </div>

                <div className="login-form-field">
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="login-form-field">
                  <label className="label">Role</label>
                  <div className="login-form-role-options">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        className={`login-form-role-option ${role === r.value ? 'active' : ''}`}
                        onClick={() => setRole(r.value)}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="login-form-field">
                  <label className="label">Password</label>
                  <div className="login-form-password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field"
                      placeholder="Create a password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="login-form-password-toggle"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                <div className="login-form-field">
                  <label className="label">Confirm Password</label>
                  <div className="login-form-password-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="input-field"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="login-form-password-toggle"
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                {displayError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="login-form-alert login-form-alert-error"
                  >
                    <AlertCircle />
                    <span>{displayError}</span>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="login-form-alert login-form-alert-success"
                  >
                    <CheckCircle />
                    <span>Account created! Redirecting...</span>
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading || success}
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="btn-primary login-form-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </motion.button>
              </form>
            )}

            <p className="login-form-footer-text">
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button type="button" onClick={handleToggleMode}>
                    Sign up here
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={handleToggleMode}>
                    Sign in here
                  </button>
                </>
              )}
            </p>

            <p className="login-terms">
              By {mode === 'signin' ? 'signing in' : 'creating an account'}, you agree to our{' '}
              <button type="button">Terms of Service</button>
              {' '}and{' '}
              <button type="button">Privacy Policy</button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}