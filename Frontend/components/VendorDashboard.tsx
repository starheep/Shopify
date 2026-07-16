import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Package, DollarSign, TrendingUp, AlertCircle, X, Check, Loader2, Layers, Settings, Phone, Mail, AlignLeft, MapPin, Globe, ChevronDown, Navigation } from 'lucide-react';
import { productService } from '../services/ProductService'; 
import { Product } from '../types';
import API from '../services/api'; // <-- IMPORTING THE INTERCEPTOR

interface VendorDashboardProps {
  vendorName: string;
}

const CITIES = [
  "Agra (Uttar Pradesh)", "Ahmedabad (Gujarat)", "Bengaluru (Karnataka)",
  "Bhopal (Madhya Pradesh)", "Chennai (Tamil Nadu)", "Delhi (NCR)",
  "Hyderabad (Telangana)", "Kanpur (Uttar Pradesh)", "Kolkata (West Bengal)",
  "Lucknow (Uttar Pradesh)", "Mathura (Uttar Pradesh)", "Mumbai (Maharashtra)",
  "Pune (Maharashtra)", "Surat (Gujarat)", "Jaipur (Rajasthan)"
];

const VendorDashboard: React.FC<VendorDashboardProps> = ({ vendorName }) => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [globalProducts, setGlobalProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [editingItem, setEditingItem] = useState<any | null>(null);
  
  // Custom Searchable Dropdown States (For Products & Locations)
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({ 
    productId: '', customName: '', customCategory: '', price: '', stock: '' 
  });
  
  // Settings Data
  const [settingsData, setSettingsData] = useState({
    location: '', address: '', website_url: '', description: '', support_email: '', phone_number: ''
  });

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setIsLoading(true);
        const data = await productService.getAll({ pageSize: 100 }); 
        setGlobalProducts(data.results);
        
        const myItems = data.results.map(prod => {
          const myOffer = prod.prices?.find((p: any) => p.vendor === vendorName);
          if (myOffer) return { ...prod, myPrice: myOffer.price, myStock: myOffer.stock || 0 }; 
          return null;
        }).filter(item => item !== null);

        setInventory(myItems);
      } catch (error) {
        console.error("Failed to load inventory", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, [vendorName]);

  const openSettingsModal = async () => {
    try {
      // 👉 Using API, removed getAuthHeaders
      const res = await API.get('http://127.0.0.1:8000/vendor/profile/');
      setSettingsData({
        location: res.data.location || '',
        address: res.data.address || '',
        website_url: res.data.website_url || '',
        description: res.data.description || '',
        support_email: res.data.support_email || '',
        phone_number: res.data.phone_number || ''
      });
      setLocationSearchQuery(res.data.location || '');
    } catch (error) {
      console.error("Could not fetch settings", error);
    }
    setIsSettingsOpen(true);
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 👉 Using API, removed getAuthHeaders
      await API.patch('http://127.0.0.1:8000/vendor/profile/', settingsData);
      alert("Store Settings Updated Successfully!");
      setIsSettingsOpen(false);
    } catch (error) {
      alert("Failed to update settings.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) return alert("Please select a product first.");
    try {
      const payload = {
        vendor_name: vendorName,
        product_id: formData.productId,
        name: formData.productId === 'other' ? formData.customName : undefined,
        category: formData.productId === 'other' ? formData.customCategory : undefined,
        price: formData.price,
        stock: formData.stock
      };
      // 👉 Using API, removed getAuthHeaders
      await API.post('http://127.0.0.1:8000/vendor/inventory/', payload);
      alert("Inventory updated successfully!");
      setIsModalOpen(false);
      window.location.reload(); 
    } catch (error) { alert("Failed to save listing."); }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({ productId: item.id.toString(), customName: '', customCategory: '', price: item.myPrice.toString(), stock: item.myStock.toString() });
    setProductSearchQuery(item.name); 
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("Are you sure you want to remove this offer?")) {
      try {
        // 👉 Using API, removed getAuthHeaders
        await API.delete(`http://127.0.0.1:8000/vendor/inventory/?product_id=${id}&vendor_name=${encodeURIComponent(vendorName)}`);
        setInventory(prev => prev.filter(item => item.id !== id));
      } catch (error) { console.error("Error deleting listing", error); }
    }
  };

  const filteredInventory = inventory.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const activeListingsCount = inventory.length;
  const lowStockCount = inventory.filter(item => item.myStock < 10).length;
  const bestPriceCount = inventory.filter(myItem => {
    const globalProd = globalProducts.find(p => p.id === myItem.id);
    if (!globalProd || !globalProd.prices || globalProd.prices.length === 0) return true; 
    const lowestPrice = Math.min(...globalProd.prices.map((p: any) => p.price));
    return myItem.myPrice <= lowestPrice;
  }).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Seller Hub</h1>
          <p className="text-slate-500 mt-1 text-lg">Manage your catalog for <span className="font-bold text-blue-600">{vendorName}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={openSettingsModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold transition-colors shadow-sm"
          >
            <Settings className="w-5 h-5" /> Settings
          </button>
          <button 
            onClick={() => { 
              setEditingItem(null); 
              setFormData({ productId: '', customName: '', customCategory: '', price: '', stock: '' }); 
              setProductSearchQuery(''); 
              setIsModalOpen(true); 
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-colors shadow-lg shadow-blue-200"
          >
            <Plus className="w-5 h-5" /> Add Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Package className="w-6 h-6" /></div>
          <div><p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Listings</p><p className="text-2xl font-bold text-slate-900">{activeListingsCount}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Lowest Price Items</p>
            <p className="text-2xl font-bold text-slate-900">{bestPriceCount} <span className="text-sm font-medium text-green-600 ml-1">Winning</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Low Stock Alerts</p>
            <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{lowStockCount} <span className="text-sm font-medium text-slate-500 ml-1">items &lt; 10</span></p>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-slate-900">Current Inventory</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" placeholder="Search your products..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Your Price</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2"/> Loading inventory...</td></tr>
              ) : filteredInventory.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No products found matching your search.</td></tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" /> : <Package className="w-5 h-5 text-slate-300"/>}
                        </div>
                        <span className="font-bold text-slate-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">{item.category}</span></td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹{item.myPrice}</td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 text-sm font-medium ${item.myStock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                        {item.myStock < 10 ? <AlertCircle className="w-4 h-4"/> : <Check className="w-4 h-4"/>}
                        {item.myStock} units
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Store Settings */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg">Store Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSettingsSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                {/* SEARCHABLE CITY DROPDOWN */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Broad City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" required
                      value={locationSearchQuery} 
                      onChange={e => {
                        setLocationSearchQuery(e.target.value);
                        setShowLocationDropdown(true);
                      }}
                      onFocus={() => setShowLocationDropdown(true)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="Search City..."
                    />
                    <ChevronDown className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                  
                  {showLocationDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowLocationDropdown(false)}></div>
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                        {CITIES.filter(c => c.toLowerCase().includes(locationSearchQuery.toLowerCase())).map(c => (
                          <div 
                            key={c}
                            onClick={() => {
                              setSettingsData({...settingsData, location: c});
                              setLocationSearchQuery(c);
                              setShowLocationDropdown(false);
                            }}
                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 text-sm font-medium text-slate-700"
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Website URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <input 
                      type="url" value={settingsData.website_url} onChange={e => setSettingsData({...settingsData, website_url: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Specific Shop Address</label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea 
                    value={settingsData.address} onChange={e => setSettingsData({...settingsData, address: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                    placeholder="e.g. Shop 42, Electronics Market, near University Gate..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Support Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <input 
                      type="email" value={settingsData.support_email} onChange={e => setSettingsData({...settingsData, support_email: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="store@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <input 
                      type="tel" value={settingsData.phone_number} onChange={e => setSettingsData({...settingsData, phone_number: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="+91..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">About Store</label>
                <div className="relative">
                  <AlignLeft className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea 
                    value={settingsData.description} onChange={e => setSettingsData({...settingsData, description: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                    placeholder="Tell customers about your shop, specialties, and operating hours..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-md">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg">{editingItem ? 'Edit Listing' : 'Add New Listing'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">1. Select Product</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search global database..." 
                    value={productSearchQuery}
                    onChange={(e) => {
                      setProductSearchQuery(e.target.value);
                      setShowProductDropdown(true);
                      if (formData.productId) setFormData({...formData, productId: ''});
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    disabled={!!editingItem} 
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all disabled:opacity-70 disabled:bg-slate-100"
                  />
                  <ChevronDown className="absolute right-4 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>

                {showProductDropdown && !editingItem && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProductDropdown(false)}></div>
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      <div 
                        onClick={() => { setFormData({...formData, productId: 'other'}); setProductSearchQuery('Other (Create New Product)'); setShowProductDropdown(false); }}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 flex items-center gap-2 text-blue-600 font-bold sticky top-0 bg-white"
                      >
                        <Plus className="w-4 h-4" /> Other (Create New Product)
                      </div>
                      {globalProducts.filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase())).length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">No matching products found in database.</div>
                      ) : (
                        globalProducts.filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase())).map(p => (
                          <div 
                            key={p.id}
                            onClick={() => { setFormData({...formData, productId: p.id.toString()}); setProductSearchQuery(p.name); setShowProductDropdown(false); }}
                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                          >
                            <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                            <div className="text-xs text-slate-500">{p.category}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {formData.productId === 'other' && (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Custom Product Name</label>
                    <input type="text" required value={formData.customName} onChange={e => setFormData({...formData, customName: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                    <select required value={formData.customCategory} onChange={e => setFormData({...formData, customCategory: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer">
                      <option value="">Select Category...</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Civil">Civil</option>
                      <option value="CS/AI">CS/AI</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">2. Your Price (₹)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <input type="number" required min="1" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">3. Stock Level</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <input type="number" required min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"/>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200">{editingItem ? 'Update Listing' : 'Publish Listing'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;