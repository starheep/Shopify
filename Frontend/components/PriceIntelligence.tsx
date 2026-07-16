import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Product } from '../types';
import { Search, TrendingUp, TrendingDown, DollarSign, Calendar, X, Loader2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { productService } from '../services/ProductService'; 

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#9333ea'];

const ITEMS_PER_PAGE = 12; 

const PriceIntelligence: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for Pagination & Search
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset to page 1 whenever the user types a new search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    // Debounce the API call (so that it doesn't trigger on every single keystroke)
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        // Pass BOTH the page and the search term to Django
        const data = await productService.getAll({ 
          page: currentPage, 
          pageSize: ITEMS_PER_PAGE,
          search: searchTerm 
        }); 
        
        setProducts(data.results);
        setTotalCount(data.count); 
        setError(null);
      } catch (err) {
        console.error("Failed to fetch analytics data:", err);
        setError("Failed to load analytics data.");
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentPage, searchTerm]);

  const productsWithHistory = products.map(product => {
    const basePrice = product.prices && product.prices.length > 0 
      ? Math.min(...product.prices.map(p => p.price)) 
      : 0;
    const platforms = product.prices ? product.prices.map(p => p.vendor) : [];
    
    // Calculate real lowest/highest from the current prices
    const highestPrice = product.prices && product.prices.length > 0
      ? Math.max(...product.prices.map(p => p.price))
      : 0;

    return {
      ...product,
      // Fetch Data : Use Real Data from Django
      history: product.chart_history || [], 
      currentPrice: basePrice,
      lowestPrice: basePrice,
      highestPrice: highestPrice,
      platforms: platforms
    };
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Price Intelligence</h1>
          <p className="text-slate-500 mt-1 text-lg">Track price trends across multiple platforms.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center">
        <Search className="w-5 h-5 text-slate-400 ml-4" />
        <input 
          type="text" 
          placeholder="Search products to analyze..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-3 bg-transparent outline-none text-slate-700 placeholder:text-slate-400 font-medium"
        />
      </div>

      {/* Product List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading price data...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-red-50 rounded-3xl border border-red-100">
          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Connection Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      ) : productsWithHistory.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No components found</h3>
          <p className="text-slate-500">Try adjusting your search terms.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productsWithHistory.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="p-6 flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{product.name}</h3>
                  <p className="text-sm text-slate-500 truncate">{product.category}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-slate-900">₹{product.currentPrice.toLocaleString()}</span>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" /> -5%
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-500">View Price History</span>
                <TrendingUp className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
            ))}
          </div>

          {/* Pagination UI */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                      currentPage === i + 1 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Price History Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative animate-scaleIn" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedProduct.name}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Current: <span className="font-bold text-slate-900">₹{selectedProduct.currentPrice.toLocaleString()}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <TrendingDown className="w-4 h-4" />
                      <span className="text-sm">Lowest: <span className="font-bold">₹{selectedProduct.lowestPrice.toLocaleString()}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-red-500">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Highest: <span className="font-bold">₹{selectedProduct.highestPrice.toLocaleString()}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-96 w-full bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedProduct.history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                      formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString()}`, name]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    {selectedProduct.platforms.map((platform: string, index: number) => (
                      <Line 
                        key={platform}
                        type="monotone" 
                        dataKey={platform} 
                        stroke={COLORS[index % COLORS.length]} 
                        strokeWidth={3} 
                        dot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} 
                        activeDot={{ r: 6 }} 
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Best Time to Buy
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Based on historical data, prices for this item tend to drop in <span className="font-bold">May</span>. Consider waiting if you can.
                  </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-2">Price Alert</h3>
                  <p className="text-slate-500 text-sm mb-4">
                    Get notified when the price drops below your target.
                  </p>
                  <button className="w-full py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors text-sm">
                    Set Alert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceIntelligence;