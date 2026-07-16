import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, Star, Truck, XCircle, X, Award, Plus, Box, Loader2, Package, Store, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { productService } from '../services/ProductService';
import API from '../services/api'; // <-- IMPORTING THE INTERCEPTOR

const CATEGORIES = ["Electronics", "Mechanical", "Civil", "CS/AI", "Art & Design"];
const SORT_OPTIONS = [
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

const ITEMS_PER_PAGE = 12;

const ProductExplorer: React.FC = () => {
  // --- Filters & UI State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [budget, setBudget] = useState(5000); 
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('price_asc');
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showKitSelection, setShowKitSelection] = useState<Product | null>(null);
  
  // --- Server Data State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [userKits, setUserKits] = useState<any[]>([]); 
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset to Page 1 if any filter is changed
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, budget, selectedCategories, sortBy]);

  // Fetch paginated & filtered products from Django
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const data = await productService.getAll({
          page: currentPage,
          search: searchTerm,
          budget: budget,
          categories: selectedCategories,
          sort: sortBy
        });
        
        setProducts(data.results);
        setTotalCount(data.count);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load products. Please check your connection.");
        setProducts([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, budget, selectedCategories, sortBy]);

  useEffect(() => {
    if (showKitSelection) {
      const fetchKits = async () => {
        try {
          // 👉 Replaced axios with API, removed getAuthHeaders
          const res = await API.get('/kits/');
          setUserKits(res.data);
        } catch (err) {
          console.error("Could not fetch kits. Are you logged in?", err);
        }
      };
      fetchKits();
    }
  }, [showKitSelection]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleAddToKit = async (kitId: number) => {
    if (showKitSelection) {
      try {
        // 👉 Replaced axios with API, removed getAuthHeaders
        await API.post(`/kits/${kitId}/add_item/`, {
          product_id: showKitSelection.id,
          quantity: 1
        });
        
        alert(`Successfully added to kit!`);
        setShowKitSelection(null);
      } catch (error) {
        console.error("Failed to add to kit:", error);
        alert("Failed to add item. Please make sure you are logged in.");
      }
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Product Finder</h1>
          <p className="text-slate-500 mt-1 text-lg">Scan the global database for specific project hardware</p>
        </div>
      </div>

      {/* HORIZONTAL CONTROL CENTER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Enter component name, SKU, or specs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-slate-700 font-medium"
            />
          </div>
          
          <div className="w-full md:w-64 relative">
            <ArrowUpDown className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-slate-700 font-medium cursor-pointer"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-px bg-slate-100 w-full"></div>

        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categories</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                    selectedCategories.includes(cat) 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-96">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Budget</h3>
              </div>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                ₹{budget.toLocaleString()}
              </span>
            </div>
            <input 
              type="range" 
              min="100" max="20000" step="100"
              value={budget} 
              onChange={(e) => setBudget(parseInt(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-1"
            />
          </div>
        </div>
      </div>

      {/* Main Content: Results & Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-500">
            {totalCount > 0 ? (
              <>Showing <span className="font-bold text-slate-900">{startIndex}-{endIndex}</span> of <span className="font-bold text-slate-900">{totalCount}</span> components</>
            ) : 'No components found'}
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading products from server...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-50 rounded-3xl border border-red-100">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-900 mb-2">Connection Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No components found</h3>
            <p className="text-slate-500">Try adjusting your budget or filters.</p>
            <button 
              onClick={() => {setBudget(20000); setSearchTerm(''); setSelectedCategories([]);}}
              className="mt-4 text-blue-600 font-bold text-sm hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => {
                const hasOffers = product.prices && product.prices.length > 0;
                const bestOffer = hasOffers ? product.prices[0] : null;
                const vendorName = bestOffer?.vendor || (bestOffer as any)?.platform || 'Store';

                return (
                  <div key={product.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col">
                    <div className="h-48 overflow-hidden bg-slate-50 relative flex items-center justify-center">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <Package className="w-16 h-16 text-slate-300" />
                      )}
                      
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                        {product.category}
                      </div>
                      
                      {/* CARD RATINGS BADGE */}
                      {bestOffer && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-2">
                          <span className="bg-blue-600/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-1">
                            <Award className="w-3 h-3" /> Best: {vendorName}
                          </span>
                          <span className="bg-amber-500/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-1">
                            <Star className="w-3 h-3 fill-white" /> {bestOffer.rating || 5.0}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">{product.name}</h3>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-xs text-slate-500">Best Price</span>
                        <span className="text-xl font-bold text-slate-900">₹{bestOffer ? bestOffer.price.toLocaleString() : 'N/A'}</span>
                      </div>

                      <div className="flex gap-2 mt-auto pt-4">
                        <button 
                          onClick={() => setSelectedProduct(product)}
                          className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          Details
                        </button>
                        <button 
                          onClick={() => setShowKitSelection(product)}
                          className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-100"
                        >
                          <Plus className="w-4 h-4" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* --- PAGINATION CONTROLS --- */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10 pt-8 border-t border-slate-100">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-slate-200 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                        currentPage === page 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200 border-transparent' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-slate-200 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative animate-scaleIn" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="bg-slate-50 p-12 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-200 relative min-h-[400px]">
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full max-w-md object-contain mix-blend-multiply hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <Package className="w-32 h-32 mb-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">No Image Provided</span>
                  </div>
                )}
              </div>

              <div className="p-8 lg:p-12 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wide">
                    {selectedProduct.category || 'Component'}
                  </span>
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-4">{selectedProduct.name}</h1>
                <p className="text-slate-600 text-lg leading-relaxed mb-8">
                  {selectedProduct.description || "No description available."}
                </p>

                <div className="mt-auto">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Available Prices</h3>
                  <div className="space-y-3">
                    {Array.isArray(selectedProduct.prices) && selectedProduct.prices.map((price, idx) => {
                      const isBest = idx === 0;
                      const vendorName = price.vendor || (price as any).platform || 'Store';
                      const isLocal = (price as any).vendorType === 'LOCAL';
                      
                      return (
                        <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all group/card ${isBest ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shadow-sm relative uppercase">
                              {vendorName[0]}
                              {isBest && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>}
                            </div>
                            
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 capitalize">{vendorName}</h4>
                                {isBest && <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Best Value</span>}
                              </div>
                              
                              <div className="flex items-center mt-1">
                                <div className="relative group flex items-center cursor-help">
                                  <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md border border-amber-100">
                                    <Star className="w-3 h-3 fill-amber-500" /> {price.rating || 5.0}
                                  </span>
                                  
                                  {isLocal && (
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max px-3 py-1.5 bg-slate-800 text-white text-[10px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-1000 pointer-events-none z-50 shadow-xl">
                                      This is local shop rating, not product rating
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="block text-lg font-bold text-slate-900">₹{price.price ? price.price.toLocaleString() : 0}</span>
                              
                              <div className="flex items-center justify-end gap-3 text-xs text-slate-500 mt-1">
                                {isLocal ? (
                                  <span className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                                    <Store className="w-3 h-3" /> Local: On your City
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Truck className="w-3 h-3" /> {(price as any).deliveryDays || 3} Days
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Kit Selection Modal */}
      {showKitSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowKitSelection(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-lg">Add to Kit</h3>
              <button 
                onClick={() => setShowKitSelection(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                {showKitSelection.image ? (
                  <img src={showKitSelection.image} alt={showKitSelection.name} className="w-12 h-12 object-contain mix-blend-multiply" />
                ) : (
                  <Package className="w-12 h-12 text-slate-300" />
                )}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{showKitSelection.name}</h4>
                  <p className="text-xs text-slate-500">{showKitSelection.category}</p>
                </div>
              </div>

              <p className="text-sm font-bold text-slate-700 mb-3">Select a Kit:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {userKits.length === 0 ? (
                  <div className="text-center p-4">
                    <p className="text-sm text-slate-500 mb-2">You don't have any kits yet.</p>
                    <p className="text-xs text-slate-400">Go to the Smart Kit Builder to create your first project!</p>
                  </div>
                ) : (
                  userKits.map(kit => (
                    <button
                      key={kit.id}
                      onClick={() => handleAddToKit(kit.id)}
                      className="w-full p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Box className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <span className="block font-bold text-slate-700 group-hover:text-blue-700">{kit.kit_name}</span>
                          <span className="text-xs text-slate-500">{kit.items?.length || 0} items</span>
                        </div>
                      </div>
                      <Plus className="w-5 h-5 text-slate-300 group-hover:text-blue-600" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductExplorer;