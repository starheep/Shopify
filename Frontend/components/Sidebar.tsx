import React from 'react';
import { LayoutDashboard, Bot, Box, Search, ArrowRightLeft, Settings, LogOut, User, Lightbulb, Store, MapPin, Info} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentUser: {
    isAuthenticated: boolean;
    isVendor: boolean;
    username: string;
    vendorName?: string;
  };
  handleLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, currentUser, handleLogout }) => {
  const menuItems = [
    { id: 'project_analysis', label: 'Project Analysis', icon: LayoutDashboard },
    { id: 'ai_lab_assistant', label: 'AI Lab Assistant', icon: Bot },
    { id: 'smart_kit_builder', label: 'Smart Kit Builder', icon: Box },
    { id: 'product_explorer', label: 'Product Explorer', icon: Search },
    { id: 'price_intelligence', label: 'Price Intelligence', icon: ArrowRightLeft },
    { id: 'project_ideas', label: 'Project Ideas', icon: Lightbulb},
    { id: 'local_vendors', label: 'Local Shops', icon: MapPin },
    ...(currentUser.isVendor ? [{ id: 'vendor_dashboard', label: 'Seller Hub', icon: Store }] : [])
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0 z-50">
      
      {/* Headers */}
      <div className="p-6 flex items-center gap-3 shrink-0">
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <Box className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-lg leading-tight">Tech ShopWay</h1>
          <p className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">Engineering Hub</p>
        </div>
      </div>

      {/* SCROLLABLE Navigation Area */}
      <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto pb-6 custom-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              currentView === item.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-white' : 'text-slate-400'}`} />
            {item.label}
          </button>
        ))}

        <div className="pt-8 pb-2 px-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resources</p>
        </div>
        <button 
          onClick={() => setCurrentView('about_section')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            currentView === 'about_section'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Info className={`w-5 h-5 ${currentView === 'about_section' ? 'text-white' : 'text-slate-400'}`} />
          About ShopWay
        </button>
      </nav>

      {/* Footer (User Profile) */}
      {currentUser.isAuthenticated ? (
        <div className="p-4 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase border-2 border-white shadow-sm shrink-0">
              {currentUser.username ? currentUser.username.charAt(0) : <User className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{currentUser.username}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser.isVendor ? 'Seller' : 'Student / Maker'}</p>
            </div>
            <button 
              onClick={handleLogout} 
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button 
            onClick={() => setCurrentView('login')}
            className="w-full py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Sign In / Register
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;