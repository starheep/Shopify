import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, User, Store, ArrowRight, Loader2, AlertCircle, Box, MapPin, ChevronDown } from 'lucide-react';
import { AuthResponse } from '../types';

interface AuthPageProps {
  onLoginSuccess: (data: AuthResponse) => void;
}

const CITIES = [
  "Agra (Uttar Pradesh)", "Ahmedabad (Gujarat)", "Bengaluru (Karnataka)",
  "Bhopal (Madhya Pradesh)", "Chennai (Tamil Nadu)", "Delhi (NCR)",
  "Hyderabad (Telangana)", "Kanpur (Uttar Pradesh)", "Kolkata (West Bengal)",
  "Lucknow (Uttar Pradesh)", "Mathura (Uttar Pradesh)", "Mumbai (Maharashtra)",
  "Pune (Maharashtra)", "Surat (Gujarat)", "Jaipur (Rajasthan)"
];

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isVendor, setIsVendor] = useState(false);
  const [vendorName, setVendorName] = useState('');
  
  // Custom Location Dropdown State
  const [location, setLocation] = useState(''); 
  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        const response = await axios.post<AuthResponse>('http://127.0.0.1:8000/auth/login/', { username, password });

        localStorage.setItem('accessToken', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);

        onLoginSuccess(response.data);
      } else {
        if (isVendor && !vendorName) {
          setError("Store name is required for sellers.");
          setIsLoading(false); return;
        }
        if (!location) {
          setError("Please select a valid city from the dropdown.");
          setIsLoading(false); return;
        }

        await axios.post('http://127.0.0.1:8000/auth/register/', {
          username, email, password, location,
          is_vendor: isVendor, vendor_name: isVendor ? vendorName : ""
        });

        setSuccessMsg(isVendor 
          ? "Seller account created! Please log in (Note: An admin must approve your seller status)." 
          : "Account created successfully! Please log in.");
        setIsLogin(true);
        setPassword(''); 
      }
    } catch (err: any) {
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        const firstError = Object.values(errorData)[0];
        setError(Array.isArray(firstError) ? firstError[0] : "Invalid credentials.");
      } else {
        setError("Network error. Please ensure your Django server is running.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fadeIn py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200">
            <Box className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-slate-500 mt-1 text-sm text-center">
            {isLogin ? 'Enter your credentials to access your workspace.' : 'Join the Engineering Hub to build, track, and sell.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5 text-white text-xs font-bold">✓</div>
            <p className="text-sm font-medium text-green-800">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
              <input 
                type="text" required value={username} onChange={e => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                placeholder="jatin_dev"
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                  <input 
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                    placeholder="jatin@example.com"
                  />
                </div>
              </div>
              
              {/* Search Location with Dropdown Option */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City / Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" required 
                    value={locationSearch} 
                    onChange={e => {
                      setLocationSearch(e.target.value);
                      setShowLocationDropdown(true);
                      setLocation(''); // Reset actual value until they click an option
                    }}
                    onFocus={() => setShowLocationDropdown(true)}
                    className="w-full pl-12 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                    placeholder="Search your city..."
                  />
                  <ChevronDown className="absolute right-4 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
                
                {showLocationDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLocationDropdown(false)}></div>
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {CITIES.filter(c => c.toLowerCase().includes(locationSearch.toLowerCase())).length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">No matching cities found.</div>
                      ) : (
                        CITIES.filter(c => c.toLowerCase().includes(locationSearch.toLowerCase())).map(c => (
                          <div 
                            key={c}
                            onClick={() => {
                              setLocation(c);
                              setLocationSearch(c);
                              setShowLocationDropdown(false);
                            }}
                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 font-medium text-slate-700 text-sm"
                          >
                            {c}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {!isLogin && (
            <div className="pt-2 border-t border-slate-100 mt-6">
              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors">
                <input 
                  type="checkbox" checked={isVendor} onChange={e => setIsVendor(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">Register as a Seller</span>
                  <span className="text-xs text-slate-500">I want to list and sell components on ShopWay.</span>
                </div>
              </label>

              {isVendor && (
                <div className="mt-4 space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Store Name</label>
                    <div className="relative">
                      <Store className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" required={isVendor} value={vendorName} onChange={e => setVendorName(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        placeholder="e.g. Saraswat Electronics"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" disabled={isLoading}
            className="w-full mt-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isLogin ? 'Sign In' : 'Create Account'}
            {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMsg(null); }}
            className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;