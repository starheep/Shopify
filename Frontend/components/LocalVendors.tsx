import React, { useState, useEffect } from 'react';
import { Store, MapPin, Globe, Phone, Mail, Star, MessageSquare, ArrowLeft, Package, Loader2 } from 'lucide-react';
import API from '../services/api'; // <-- IMPORTING THE INTERCEPTOR

interface Review { id: string; user: string; rating: number; comment: string; date: string; }
interface Vendor {
  id: number;
  vendor_name: string;
  location: string;
  address?: string;
  website_url?: string;
  description?: string;
  phone_number?: string;
  support_email?: string;
  average_rating: number;
  review_count: number;
  reviews: Review[];
}

const LocalVendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        // 👉 Using API, removed getAuthHeaders
        const res = await API.get('http://127.0.0.1:8000/myapp/local-vendors/');
        setVendors(res.data);
      } catch (err) {
        console.error("Failed to load local vendors", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVendors();
  }, []);

  const handleSelectVendor = async (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsProductsLoading(true);
    try {
      // 👉 Using API, removed getAuthHeaders
      const res = await API.get(`http://127.0.0.1:8000/myapp/local-vendors/${vendor.id}/products/`);
      setVendorProducts(res.data);
    } catch (err) {
      console.error("Failed to load vendor products", err);
    } finally {
      setIsProductsLoading(false);
    }
  };

  const handlePostReview = async () => {
    if (!selectedVendor || !reviewForm.comment.trim()) return;
    setIsSubmittingReview(true);
    try {
      // 👉 Using API, removed getAuthHeaders
      const res = await API.post(`http://127.0.0.1:8000/myapp/local-vendors/${selectedVendor.id}/review/`, reviewForm);
      alert(res.data.message);
      
      const vendorRes = await API.get('http://127.0.0.1:8000/myapp/local-vendors/');
      setVendors(vendorRes.data);
      setSelectedVendor(vendorRes.data.find((v: Vendor) => v.id === selectedVendor.id));
      setReviewForm({ rating: 5, comment: '' });
    } catch (error) {
      alert("Failed to post review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 h-full">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
      <p className="text-slate-500 font-medium">Locating verified shops in your city...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {selectedVendor ? (
        // --- Detailed Vendor Profile ---
        <div className="space-y-6">
          <button onClick={() => setSelectedVendor(null)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold bg-white px-5 py-2.5 rounded-xl shadow-sm border border-slate-200 w-fit transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Local Shops
          </button>

          {/* Banner & Header */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
               <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
            </div>
            <div className="px-10 pb-10 relative">
              <div className="w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-4xl font-black text-blue-600 -mt-12 mb-4 bg-gradient-to-br from-blue-50 to-white">
                {selectedVendor.vendor_name[0]}
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">{selectedVendor.vendor_name}</h1>
                  <p className="text-slate-500 font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" /> {selectedVendor.location}
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="flex items-center gap-1 text-amber-500 font-bold"><Star className="w-4 h-4 fill-amber-500" /> {selectedVendor.average_rating} ({selectedVendor.review_count} Reviews)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Col: About & Contact */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">About the Store</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  {selectedVendor.description || "This local partner hasn't added a description yet, but they are verified by the platform and ready for same-day pickups!"}
                </p>

                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-t border-slate-100 pt-6">Contact Info</h3>
                <div className="space-y-4">
                  {selectedVendor.address && (
                    <div className="flex items-start gap-3 text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-white shrink-0 flex items-center justify-center shadow-sm"><MapPin className="w-5 h-5 text-red-500" /></div> 
                      <span className="mt-2 text-sm leading-relaxed">{selectedVendor.address}</span>
                    </div>
                  )}
                  {selectedVendor.website_url && (
                    <a href={selectedVendor.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-600 hover:text-blue-600 transition-colors font-medium">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center"><Globe className="w-5 h-5 text-blue-500" /></div> Visit Website
                    </a>
                  )}
                  {selectedVendor.phone_number && (
                    <div className="flex items-center gap-3 text-slate-600 font-medium">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center"><Phone className="w-5 h-5 text-green-500" /></div> {selectedVendor.phone_number}
                    </div>
                  )}
                  {selectedVendor.support_email && (
                    <div className="flex items-center gap-3 text-slate-600 font-medium">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center"><Mail className="w-5 h-5 text-purple-500" /></div> {selectedVendor.support_email}
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews Section */}
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Store Reviews</h3>
                
                {/* Write Review */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6">
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} onClick={() => setReviewForm({...reviewForm, rating: star})}>
                        <Star className={`w-5 h-5 ${reviewForm.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea 
                    value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                    placeholder="How was your experience?" className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none mb-3 resize-none" rows={2}
                  />
                  <button onClick={handlePostReview} disabled={isSubmittingReview} className="w-full py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors">
                    {isSubmittingReview ? "Posting..." : "Submit Review"}
                  </button>
                </div>

                {/* Read Reviews */}
                <div className="space-y-5 max-h-80 overflow-y-auto pr-2">
                  {selectedVendor.reviews.length === 0 ? (
                    <p className="text-slate-500 italic text-center text-sm">No reviews yet.</p>
                  ) : (
                    selectedVendor.reviews.map(review => (
                      <div key={review.id} className="pb-5 border-b border-slate-100 last:border-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-900 text-sm">{review.user}</span>
                          <span className="flex text-amber-400"><Star className="w-3 h-3 fill-amber-400"/> {review.rating}</span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
                        <span className="text-xs text-slate-400 mt-2 block">{review.date}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Available Products Inventory */}
            <div className="lg:col-span-8 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><Package className="w-6 h-6 text-blue-500"/> Available Inventory</h3>
              
              {isProductsLoading ? (
                <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto"/></div>
              ) : vendorProducts.length === 0 ? (
                <div className="py-20 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">This vendor hasn't listed any products yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vendorProducts.map(product => {
                    const offer = product.prices.find((p: any) => p.vendor === selectedVendor.vendor_name);
                    return (
                      <div key={product.id} className="flex gap-4 p-4 border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group">
                        <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
                          {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-contain p-2" /> : <Package className="w-8 h-8 text-slate-300"/>}
                        </div>
                        <div className="flex flex-col flex-1">
                          <h4 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">{product.name}</h4>
                          <span className="text-xs text-slate-500 mb-auto">{product.category}</span>
                          <div className="flex justify-between items-end mt-2">
                            <span className="font-black text-slate-900">₹{offer ? offer.price : 'N/A'}</span>
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">In Stock: {offer ? offer.stock : 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // --- Vendors List View ---
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Local Vendors</h1>
              <p className="text-slate-500 mt-1 text-lg">Verified hardware partners available for same-day pickup in your city.</p>
            </div>
          </div>

          {vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-3xl border-dashed">
              <Store className="w-16 h-16 text-slate-200 mb-6" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">No local vendors found</h3>
              <p className="text-slate-500 font-medium">We couldn't find any verified partners in your registered city yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map(vendor => (
                <div 
                  key={vendor.id} 
                  onClick={() => handleSelectVendor(vendor)}
                  className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-blue-300 transition-all cursor-pointer group flex flex-col"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner border border-blue-100 group-hover:scale-110 transition-transform">
                      {vendor.vendor_name[0]}
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold border border-amber-100">
                      <Star className="w-3.5 h-3.5 fill-amber-500" /> {vendor.average_rating}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-extrabold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{vendor.vendor_name}</h3>
                  <p className="text-slate-500 text-sm flex items-center gap-1.5 mb-6"><MapPin className="w-4 h-4"/> {vendor.location}</p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500">{vendor.review_count} Reviews</span>
                    <span className="text-sm font-bold text-blue-600 group-hover:translate-x-1 transition-transform">View Store &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LocalVendors;