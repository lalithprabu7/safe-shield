import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Mail, User, Briefcase, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '../components/common/Toast';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Sign In State
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  // Sign Up State
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    role: 'Cyber Cell Investigator',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();
  const toast = useToast();

  const handleSignInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignInData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignUpChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSignUpData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInData.email || !signInData.password) {
      toast.showToast('error', 'Authentication Failed', 'Please enter both credentials.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signInData)
      });
      const data = await res.json();
      
      setLoading(false);
      if (res.ok && data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userRole', data.user.role);
        
        toast.showToast('success', 'Access Granted', 'Welcome back to DigitalShield Command.');
        navigate('/');
      } else {
        toast.showToast('error', 'Authentication Failed', data.message || 'Invalid credentials');
      }
    } catch (err) {
      setLoading(false);
      toast.showToast('error', 'Network Error', 'Could not connect to command server.');
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, role } = signUpData;
    
    if (!name || !email || !password || !confirmPassword) {
      toast.showToast('error', 'Registration Error', 'All fields are mandatory.');
      return;
    }

    if (password !== confirmPassword) {
      toast.showToast('error', 'Password Mismatch', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      toast.showToast('error', 'Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      
      setLoading(false);
      if (res.ok && data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userRole', data.user.role);
        
        toast.showToast('success', 'Account Registered', 'Security credentials provisioned successfully.');
        navigate('/');
      } else {
        toast.showToast('error', 'Registration Error', data.message || 'Failed to register account.');
      }
    } catch (err) {
      setLoading(false);
      toast.showToast('error', 'Network Error', 'Could not connect to command server.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 relative overflow-y-auto py-8 font-sans">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="w-full max-w-[440px] z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/40 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(6,182,212,0.15)]"
          >
            <Shield className="w-8 h-8 text-accent animate-pulse" />
          </motion.div>
          <motion.h1 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-[28px] font-bold text-white tracking-tight flex items-center gap-1.5"
          >
            DigitalShield <span className="text-accent">AI</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-caption text-gray-500 text-center mt-1 uppercase tracking-widest font-mono"
          >
            Public Safety Intelligence Command
          </motion.p>
        </div>

        {/* Auth Card */}
        <motion.div
          layout
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          className="glass-card p-8 border border-white/10 relative shadow-2xl bg-[#0b1120]/80 backdrop-blur-xl"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent to-purple-500 rounded-t-xl" />

          <AnimatePresence mode="wait">
            {!isSignUp ? (
              <motion.div
                key="signin"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-heading font-semibold text-white mb-2">Access Command</h2>
                <p className="text-body text-gray-400 mb-6">Enter your security credentials to sign in.</p>

                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-caption text-gray-400 font-semibold mb-1.5">Official Email / Badge ID</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={signInData.email}
                        onChange={handleSignInChange}
                        placeholder="officer@safety.gov.in"
                        className="w-full bg-navy-800/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-body text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-caption text-gray-400 font-semibold mb-1.5">Authorization Key</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        value={signInData.password}
                        onChange={handleSignInChange}
                        placeholder="••••••••"
                        className="w-full bg-navy-800/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-10 text-body text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3 rounded-lg flex items-center justify-center gap-2 text-body font-semibold shadow-[0_4px_20px_rgba(6,182,212,0.2)] mt-6 hover:shadow-[0_4px_25px_rgba(6,182,212,0.35)] transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Verifying Credentials...
                      </>
                    ) : (
                      <>
                        Decrypt & Sign In
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
                  <p className="text-caption text-gray-500">
                    Need command credentials?{' '}
                    <button
                      onClick={() => { setIsSignUp(true); setError(''); }}
                      className="text-accent hover:underline font-semibold"
                    >
                      Request Sign Up
                    </button>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-heading font-semibold text-white mb-2">Request Credentials</h2>
                <p className="text-body text-gray-400 mb-6">Create your command staff profile.</p>

                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  {/* Name and Role in grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Full Name */}
                    <div>
                      <label className="block text-caption text-gray-400 font-semibold mb-1.5">Official Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          name="name"
                          required
                          value={signUpData.name}
                          onChange={handleSignUpChange}
                          placeholder="Rajesh Kumar"
                          className="w-full bg-navy-800/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-caption text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Role / Department Selection */}
                    <div>
                      <label className="block text-caption text-gray-400 font-semibold mb-1.5">Division / Role</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <select
                          name="role"
                          value={signUpData.role}
                          onChange={handleSignUpChange}
                          className="w-full bg-[#0b1120] border border-white/10 rounded-lg py-2.5 pl-10 pr-6 text-caption text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all appearance-none cursor-pointer"
                        >
                          <option value="Cyber Investigator">Cyber Cell</option>
                          <option value="CBI Special Officer">CBI</option>
                          <option value="NCRB Intelligence Chief">NCRB</option>
                          <option value="Forensics Specialist">Forensics</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0" />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-caption text-gray-400 font-semibold mb-1.5">Official Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={signUpData.email}
                        onChange={handleSignUpChange}
                        placeholder="rajesh.kumar@cybercell.gov.in"
                        className="w-full bg-navy-800/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-caption text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Passwords in grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Password */}
                    <div>
                      <label className="block text-caption text-gray-400 font-semibold mb-1.5">New Key</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          required
                          value={signUpData.password}
                          onChange={handleSignUpChange}
                          placeholder="••••••••"
                          className="w-full bg-navy-800/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-10 text-caption text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-caption text-gray-400 font-semibold mb-1.5">Confirm Key</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          required
                          value={signUpData.confirmPassword}
                          onChange={handleSignUpChange}
                          placeholder="••••••••"
                          className="w-full bg-navy-800/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-caption text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3 rounded-lg flex items-center justify-center gap-2 text-body font-semibold shadow-[0_4px_20px_rgba(6,182,212,0.2)] mt-6 hover:shadow-[0_4px_25px_rgba(6,182,212,0.35)] transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Generating Profile...
                      </>
                    ) : (
                      <>
                        Provision Account
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
                  <p className="text-caption text-gray-500">
                    Already have credentials?{' '}
                    <button
                      onClick={() => { setIsSignUp(false); setError(''); }}
                      className="text-accent hover:underline font-semibold"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Footer legal text */}
        <p className="text-[10px] text-gray-600 text-center mt-6 font-mono">
          Authorized personnel access only. Actions are logged under IT Act Sec 66.
        </p>
      </div>
    </div>
  );
}

// Add empty interface error suppressor
const setError = (_s: string) => {};
