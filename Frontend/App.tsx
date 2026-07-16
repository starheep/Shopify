import React, { useState } from 'react';
import { KitItem } from './types';
import Sidebar from './components/Sidebar';
import ProjectDashboard from './components/ProjectDashboard';
import AILabAssistant from './components/AILabAssistant';
import SmartKitBuilder from './components/SmartKitBuilder';
import ProductExplorer from './components/ProductExplorer';
import PriceIntelligence from './components/PriceIntelligence';
import ProjectIdeas from './components/ProjectIdeas';
import VendorDashboard from './components/VendorDashboard';
import AuthPage from './components/AuthPage';
import LocalVendors from './components/LocalVendors';
import AboutSection from './components/AboutSection';

import { ShieldAlert, MapPin, Store } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('project_analysis');
  
  // "Lazy Initializer" - Loads session instantly before page renders
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('userSession');
    if (savedUser) {
      return JSON.parse(savedUser);
    }
    return {
      isAuthenticated: false,
      isVendor: false,
      vendorName: "",
      username: "",
      location: ""
    };
  });

  const handleLoginSuccess = (data: any) => {
    console.log("🔥 INCOMING DJANGO PAYLOAD:", data);
    const sessionData = {
      isAuthenticated: true,
      username: data.username,
      isVendor: data.is_vendor && data.is_approved,
      vendorName: data.vendor_name || "",
      location: data.location || ""
    };
    
    setCurrentUser(sessionData);
    localStorage.setItem('userSession', JSON.stringify(sessionData));
    localStorage.setItem('accessToken', data.access); 
  };

  const handleLogout = () => {
    setCurrentUser({ isAuthenticated: false, isVendor: false, vendorName: "", username: "", location: "" });
    localStorage.removeItem('userSession');
    localStorage.removeItem('accessToken');
    setCurrentView('product_explorer'); 
  };

  const handleAddToCart = (items: KitItem[]) => {
    alert(`Checkout functionality would go here! Added ${items.length} items to cart.`);
  };

  const renderView = () => {
    switch (currentView) {
      case 'project_analysis':
        return <ProjectDashboard />;
      case 'ai_lab_assistant':
        return <AILabAssistant />;
      case 'smart_kit_builder':
        return <SmartKitBuilder onAddToCart={handleAddToCart} />;
      case 'product_explorer':
        return <ProductExplorer />;
      case 'price_intelligence':
        return <PriceIntelligence />;
      case 'project_ideas':
        return <ProjectIdeas />;
      case 'about_section':
        return <AboutSection />;
      case 'vendor_dashboard':
        if (!currentUser.isAuthenticated || !currentUser.isVendor) {
          return (
            <div className="flex flex-col items-center justify-center py-20 bg-red-50 rounded-3xl border border-red-100 animate-fadeIn">
              <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h2>
              <p className="text-red-600 mb-6">You must be an approved seller to access the Vendor Hub.</p>
              <button 
                onClick={() => setCurrentView('product_explorer')}
                className="px-6 py-2.5 bg-white text-red-600 font-bold border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
              >
                Return to Shop
              </button>
            </div>
          );
        }
        return <VendorDashboard vendorName={currentUser.vendorName} />;
      case 'local_vendors':
        return <LocalVendors />;
      case 'login':
          return <AuthPage onLoginSuccess={(data) => {
          handleLoginSuccess(data);
          setCurrentView('product_explorer'); 
        }} />;
        
      default:
        return <ProjectDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex">
      
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        currentUser={currentUser} 
        handleLogout={handleLogout} 
      />

      <main className="flex-1 ml-64 min-h-screen relative">
        
        {/* --- Navbar --- */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex justify-between items-center">
          
          {/* Left Side: Dynamic Title & Date */}
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-800 tracking-tight capitalize">
              {currentView.replace('_', ' ')}
            </h2>
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-slate-300">|</span>
              <span className="text-sm font-medium text-slate-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Right Side: Actions & Context */}
          <div className="flex items-center gap-4 ml-6">
            
            {/* 1. Seller Badge */}
            {currentUser.isVendor && (
              <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100 flex items-center gap-1.5 shadow-sm">
                <Store className="w-3.5 h-3.5" /> Seller: {currentUser.vendorName}
              </span>
            )}

            {/* 2. Dynamic Location Context Pin */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm cursor-default hover:bg-slate-100 transition-colors">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              {currentUser.isAuthenticated && currentUser.location ? currentUser.location : "Global Campus"}
            </div>

          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-8 max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;