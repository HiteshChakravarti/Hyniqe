import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, AlertCircle, Sparkles } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import estelImage from 'figma:asset/d8b1b79c9918d3d4a6cd73091e9b8a979ab511ff.png';
import karoImage from 'figma:asset/dc52e3f2d941d1a747f54b33e4933a9938c74d6b.png';
import nikiImage from 'figma:asset/f49b3d012c317bec730b62a0ae47b5621fa40ac6.png';
import orinImage from 'figma:asset/9d2219c92c5dcdc3c0d8ce430e2da4aba264e80a.png';
import turboImage from 'figma:asset/11464600c439aa9f3f2e8d58bdd401a64c29ac14.png';
import teamImage from 'figma:asset/9ffd69f27e4b16dc0ddec58f3dfe46a2f4c11418.png';

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-success';

interface AuthPagesProps {
  onClose?: () => void;
  setCurrentPage?: (page: string) => void;
  onLogin?: (name: string) => void;
}

export function AuthPages({ onClose, setCurrentPage, onLogin }: AuthPagesProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Rotating character images
  const characters = [estelImage, karoImage, nikiImage, orinImage, turboImage];
  const [currentCharacter] = useState(characters[Math.floor(Math.random() * characters.length)]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (mode === 'signup' && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (mode !== 'forgot-password') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (mode === 'signup' && !validatePassword(formData.password)) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (mode === 'signup' && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Simulate successful submission
      if (mode === 'forgot-password') {
        setMode('reset-success');
      } else {
        console.log('Form submitted:', formData);
        // Successfully logged in or signed up
        const displayName = mode === 'signup' ? formData.name : formData.email.split('@')[0];
        if (onLogin) {
          onLogin(displayName);
        }
      }
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`);
    // In real app, handle OAuth here
  };

  const passwordStrength = mode === 'signup' ? getPasswordStrength(formData.password) : 0;

  return (
    <div className="min-h-screen bg-white flex relative overflow-hidden">
      {/* Full Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={teamImage}
          alt="HYNÍQÉ AI Team"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay on left side for form readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/60 to-transparent"></div>
      </div>

      {/* Floating Form Card - Left Side */}
      <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md glass-card bg-white/80 backdrop-blur-2xl rounded-3xl p-8 lg:p-10 shadow-2xl border border-white/50">
          {/* Close button for mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"
            >
              ✕
            </button>
          )}

          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-text-primary text-3xl mb-2">HYNÍQÉ</h1>
            <p className="text-text-secondary">Your AI-Powered Workforce</p>
          </div>

          {mode === 'reset-success' ? (
            // Password Reset Success
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-accent-secondary" />
              </div>
              <h2 className="text-text-primary text-3xl mb-4">Check your email</h2>
              <p className="text-text-secondary mb-8">
                We've sent password reset instructions to <span className="text-text-primary">{formData.email}</span>
              </p>
              <button
                onClick={() => setMode('login')}
                className="text-accent-primary hover:text-accent-tertiary transition-colors"
              >
                ← Back to login
              </button>
            </div>
          ) : (
            <>
              {/* Badge */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary/10 backdrop-blur-sm rounded-full border border-accent-primary/20">
                  <Sparkles className="w-4 h-4 text-accent-primary" />
                  <span className="text-sm text-accent-primary font-medium">
                    {mode === 'login' && 'Welcome Back'}
                    {mode === 'signup' && 'Create Your Account'}
                    {mode === 'forgot-password' && 'Reset Password'}
                  </span>
                </div>
              </div>

              {/* Header */}
              <div className="mb-8">
                <h2 className="text-text-primary text-3xl mb-2">
                  {mode === 'login' && 'Sign in to HYNÍQÉ'}
                  {mode === 'signup' && 'Get Started Free'}
                  {mode === 'forgot-password' && 'Recover Your Account'}
                </h2>
                <p className="text-text-secondary">
                  {mode === 'login' && 'Continue your journey with AI employees'}
                  {mode === 'signup' && 'Transform your business with specialized AI employees'}
                  {mode === 'forgot-password' && "We'll send you reset instructions"}
                </p>
              </div>

              {/* Social Login */}
              {mode !== 'forgot-password' && (
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => handleSocialLogin('google')}
                    className="w-full flex items-center justify-center gap-3 bg-white/90 backdrop-blur-sm hover:bg-white text-text-primary py-3 px-4 rounded-xl transition-all hover:scale-[1.02] border border-border-soft shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>
                  <button
                    onClick={() => handleSocialLogin('microsoft')}
                    className="w-full flex items-center justify-center gap-3 bg-white/90 backdrop-blur-sm hover:bg-white border border-border-soft text-text-primary py-3 px-4 rounded-xl transition-all hover:scale-[1.02] shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 23 23">
                      <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                      <path fill="#f35325" d="M1 1h10v10H1z"/>
                      <path fill="#81bc06" d="M12 1h10v10H12z"/>
                      <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                      <path fill="#ffba08" d="M12 12h10v10H12z"/>
                    </svg>
                    Continue with Microsoft
                  </button>
                </div>
              )}

              {/* Divider */}
              {mode !== 'forgot-password' && (
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-soft"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white/80 text-text-tertiary">Or continue with email</span>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name field (signup only) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full glass-card bg-bg-secondary/30 backdrop-blur-md border ${errors.name ? 'border-red-400' : 'border-border-soft'} rounded-lg py-3 pl-11 pr-4 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary transition-colors`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>
                )}

                {/* Email field */}
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full glass-card bg-bg-secondary/30 backdrop-blur-md border ${errors.email ? 'border-red-400' : 'border-border-soft'} rounded-lg py-3 pl-11 pr-4 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary transition-colors`}
                      placeholder="you@company.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password field */}
                {mode !== 'forgot-password' && (
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`w-full glass-card bg-bg-secondary/30 backdrop-blur-md border ${errors.password ? 'border-red-400' : 'border-border-soft'} rounded-lg py-3 pl-11 pr-11 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary transition-colors`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.password}
                      </p>
                    )}
                    
                    {/* Password strength indicator */}
                    {mode === 'signup' && formData.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                level <= passwordStrength
                                  ? passwordStrength === 1
                                    ? 'bg-red-500'
                                    : passwordStrength === 2
                                    ? 'bg-yellow-500'
                                    : passwordStrength === 3
                                    ? 'bg-blue-500'
                                    : 'bg-green-500'
                                  : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-text-tertiary">
                          {passwordStrength === 0 && 'Enter a password'}
                          {passwordStrength === 1 && 'Weak password'}
                          {passwordStrength === 2 && 'Fair password'}
                          {passwordStrength === 3 && 'Good password'}
                          {passwordStrength === 4 && 'Strong password'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Confirm Password field (signup only) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className={`w-full glass-card bg-bg-secondary/30 backdrop-blur-md border ${errors.confirmPassword ? 'border-red-400' : 'border-border-soft'} rounded-lg py-3 pl-11 pr-11 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary transition-colors`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                )}

                {/* Remember me / Forgot password */}
                {mode === 'login' && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.rememberMe}
                        onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                        className="w-4 h-4 rounded border-border-soft text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
                      />
                      <span className="text-text-secondary text-sm">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-accent-primary hover:text-accent-tertiary text-sm transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full glass-card bg-gradient-to-r from-accent-primary/80 to-accent-tertiary/80 backdrop-blur-xl hover:from-accent-primary hover:to-accent-tertiary text-white py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 group border border-white/20 hover:scale-[1.02]"
                >
                  {mode === 'login' && 'Sign in'}
                  {mode === 'signup' && 'Create account'}
                  {mode === 'forgot-password' && 'Send reset link'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              {/* Footer links */}
              <div className="mt-6 text-center">
                {mode === 'login' && (
                  <p className="text-text-secondary">
                    Don't have an account?{' '}
                    <button
                      onClick={() => setMode('signup')}
                      className="text-accent-primary hover:text-accent-tertiary transition-colors"
                    >
                      Sign up
                    </button>
                  </p>
                )}
                {mode === 'signup' && (
                  <p className="text-text-secondary">
                    Already have an account?{' '}
                    <button
                      onClick={() => setMode('login')}
                      className="text-accent-primary hover:text-accent-tertiary transition-colors"
                    >
                      Sign in
                    </button>
                  </p>
                )}
                {mode === 'forgot-password' && (
                  <button
                    onClick={() => setMode('login')}
                    className="text-accent-primary hover:text-accent-tertiary transition-colors"
                  >
                    ← Back to login
                  </button>
                )}
              </div>

              {/* Terms */}
              {mode === 'signup' && (
                <p className="text-text-tertiary text-xs text-center mt-6">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="text-accent-primary hover:text-accent-tertiary">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-accent-primary hover:text-accent-tertiary">Privacy Policy</a>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}