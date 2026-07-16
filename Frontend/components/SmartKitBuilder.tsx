import React, { useState, useEffect } from 'react';
import { Download, FolderPlus, Cpu, Trash2, Box, X, Minus, Plus, Loader2, FileText, Youtube, Github, CheckCircle2, Globe, Tag, Signal, Zap } from 'lucide-react';
import { KitItem } from '../types';
import ProjectDashboard from './ProjectDashboard';
import API from '../services/api'; // <-- IMPORTING THE INTERCEPTOR

interface SmartKitBuilderProps {
  onAddToCart: (items: KitItem[]) => void;
}

interface CustomKit {
  id: number; 
  kit_name: string;
  items: KitItem[];
  description?: string;
}

const SmartKitBuilder: React.FC<SmartKitBuilderProps> = ({ onAddToCart }) => {
  const [kits, setKits] = useState<CustomKit[]>([]);
  const [activeKitId, setActiveKitId] = useState<number | null>(null);
  const [newKitName, setNewKitName] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- Project Documentation Modal State ---
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '',
    about: '',
    difficulty: 'Intermediate',
    tags: '',                  
    processSteps: [{ title: '', description: '' }],
    youtubeLink: '',
    githubLink: '',
    publishToCommunity: false
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        // 👉 Using API, removed getAuthHeaders
        const kitRes = await API.get('http://127.0.0.1:8000/kits/');
        const safeKits = kitRes.data.map((k: any) => ({ ...k, items: k.items || [] }));
        setKits(safeKits);
        if (safeKits.length > 0) setActiveKitId(safeKits[0].id);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const activeKit = kits.find(k => k.id === activeKitId) || kits[0];

  // --- Kit Database Functions ---
  const handleCreateKit = async () => {
    if (!newKitName.trim()) return;
    try {
      // 👉 Using API, removed getAuthHeaders
      const response = await API.post('http://127.0.0.1:8000/kits/', { kit_name: newKitName.trim() });
      const newKit = { ...response.data, items: response.data.items || [] };
      
      setKits([newKit, ...kits]);
      setActiveKitId(newKit.id);
      setNewKitName('');
    } catch (error) {
      console.error("Failed to create kit:", error);
      alert("Error: Make sure you are logged in to create a kit.");
    }
  };

  const handleDeleteKit = async (kitId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this project kit permanently?")) {
      try {
        // 👉 Using API, removed getAuthHeaders
        await API.delete(`http://127.0.0.1:8000/kits/${kitId}/`);
        const updatedKits = kits.filter(k => k.id !== kitId);
        setKits(updatedKits);
        if (activeKitId === kitId) setActiveKitId(updatedKits[0]?.id || null);
      } catch (error) {
        console.error("Failed to delete kit:", error);
      }
    }
  };

  const syncItemsToDB = async (kitId: number, updatedItems: KitItem[]) => {
    try {
      const payload = updatedItems.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }));
      // 👉 Using API, removed getAuthHeaders
      await API.post(`http://127.0.0.1:8000/kits/${kitId}/sync_items/`, { items: payload });
    } catch (error) {
      console.error("Failed to sync items:", error);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    if (!activeKitId) return;

    setKits(prevKits => prevKits.map(kit => {
      if (kit.id !== activeKitId) return kit;
      
      const currentItems = kit.items || [];
      const newItems = currentItems.map(item => {
        if (item.product.id === productId) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(item => item.quantity > 0);

      syncItemsToDB(kit.id, newItems); 
      return { ...kit, items: newItems };
    }));
  };

  const calculateTotal = (items: KitItem[]) => {
    if (!items) return 0;
    return items.reduce((total, item) => {
      const price = item.product.prices?.[0]?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  // --- Project Documentation Functions ---
  const handleOpenProjectModal = () => {
    if (!activeKit) return;

    let parsedAbout = '';
    let parsedDifficulty = 'Intermediate';
    let parsedTags = '';
    let parsedSteps = [{ title: '', description: '' }];
    let parsedYt = '';
    let parsedGh = '';

    if (activeKit.description) {
      const desc = activeKit.description;
      const sections = desc.split('###');
      
      parsedAbout = sections[0].trim();

      const parsedStepsTemp: {title: string, description: string}[] = [];

      sections.slice(1).forEach(section => {
        if (section.trim().startsWith('Metadata')) {
          const lines = section.split('\n').slice(1);
          lines.forEach(line => {
            if (line.startsWith('Difficulty:')) parsedDifficulty = line.replace('Difficulty:', '').trim();
            if (line.startsWith('Tags:')) parsedTags = line.replace('Tags:', '').trim();
          });
        }
        if (section.trim().startsWith('Development Process')) {
          const lines = section.split('\n').slice(1);
          lines.forEach(line => {
            const match = line.match(/\d+\.\s+\*\*(.*?)\*\*:\s+(.*)/);
            if (match) parsedStepsTemp.push({ title: match[1], description: match[2] });
          });
        }
        if (section.trim().startsWith('Links')) {
          const lines = section.split('\n').slice(1);
          lines.forEach(line => {
            if (line.startsWith('YouTube:')) parsedYt = line.replace('YouTube:', '').trim();
            if (line.startsWith('GitHub:')) parsedGh = line.replace('GitHub:', '').trim();
          });
        }
      });

      if (parsedStepsTemp.length > 0) parsedSteps = parsedStepsTemp;
    }

    setProjectForm({
      title: activeKit.kit_name || '',
      about: parsedAbout,
      difficulty: parsedDifficulty,
      tags: parsedTags,
      processSteps: parsedSteps,
      youtubeLink: parsedYt,
      githubLink: parsedGh,
      publishToCommunity: false
    });
    
    setIsProjectModalOpen(true);
  };

  const handleAddProcessStep = () => {
    setProjectForm(prev => ({
      ...prev,
      processSteps: [...prev.processSteps, { title: '', description: '' }]
    }));
  };

  const handleUpdateProcessStep = (index: number, field: 'title' | 'description', value: string) => {
    const newSteps = [...projectForm.processSteps];
    newSteps[index][field] = value;
    setProjectForm({ ...projectForm, processSteps: newSteps });
  };

  const handleRemoveProcessStep = (index: number) => {
    const newSteps = projectForm.processSteps.filter((_, i) => i !== index);
    setProjectForm({ ...projectForm, processSteps: newSteps });
  };

  const handleSaveProject = async () => {
    let fullDescription = `${projectForm.about}\n\n`;
    
    if (projectForm.difficulty || projectForm.tags) {
      fullDescription += `### Metadata\n`;
      fullDescription += `Difficulty: ${projectForm.difficulty}\n`;
      fullDescription += `Tags: ${projectForm.tags}\n\n`;
    }
    
    if (projectForm.processSteps.length > 0 && projectForm.processSteps[0].title !== '') {
      fullDescription += `### Development Process\n`;
      projectForm.processSteps.forEach((step, idx) => {
        fullDescription += `${idx + 1}. **${step.title}**: ${step.description}\n`;
      });
    }

    if (projectForm.youtubeLink || projectForm.githubLink) {
      fullDescription += `\n### Links\n`;
      if (projectForm.youtubeLink) fullDescription += `YouTube: ${projectForm.youtubeLink}\n`;
      if (projectForm.githubLink) fullDescription += `GitHub: ${projectForm.githubLink}\n`;
    }

    try {
      // 👉 Using API, removed getAuthHeaders
      await API.patch(`http://127.0.0.1:8000/kits/${activeKitId}/`, {
        kit_name: projectForm.title,
        description: fullDescription
      });

      setKits(prevKits => prevKits.map(kit => 
        kit.id === activeKitId ? { ...kit, kit_name: projectForm.title, description: fullDescription } : kit
      ));

      if (projectForm.publishToCommunity) {
        const payload = {
          title: projectForm.title,
          description: fullDescription,
          category: "Electronics", 
          difficulty: projectForm.difficulty, 
          tags: projectForm.tags,             
          component_ids: activeKit?.items.map(item => item.product.id) || []
        };
        
        // 👉 Using API, removed getAuthHeaders
        await API.post('http://127.0.0.1:8000/myapp/ideas/', payload);
        alert("Success! Project saved to workspace AND published to Community Hub.");
      }
    } catch (error) {
      console.error("Failed to save project:", error);
      alert("An error occurred while saving your project. Please make sure you are logged in.");
    }
    
    setIsProjectModalOpen(false);
  };

  if (showAnalysis) {
    return (
      <ProjectDashboard 
         initialKit={activeKit} 
         onBack={() => setShowAnalysis(false)} 
      />
    );
  }

  const handleExportBOM = () => {
    if (!activeKit || !activeKit.items || activeKit.items.length === 0) {
      alert("Your kit is empty. Add components from the Product Explorer before exporting.");
      return;
    }

    let csvContent = "Component Name,Category,Quantity,Best Vendor,Unit Price,Total Cost\n";

    activeKit.items.forEach((item: any) => {
      const prod = item.product;
      const hasOffers = prod.prices && prod.prices.length > 0;
      const bestOffer = hasOffers ? prod.prices[0] : null;
      
      const vendorName = bestOffer ? (bestOffer.vendor || bestOffer.platform || 'Unknown') : 'N/A';
      const price = bestOffer ? bestOffer.price : 0;
      const totalCost = price * item.quantity;

      const safeName = `"${prod.name.replace(/"/g, '""')}"`;
      const safeCat = `"${prod.category}"`;
      const safeVendor = `"${vendorName}"`;

      csvContent += `${safeName},${safeCat},${item.quantity},${safeVendor},₹${price},₹${totalCost}\n`;
    });

    csvContent += `\n,,, ,Grand Total:,₹${(activeKit as any).total_cost || 0}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeKit.kit_name.replace(/\s+/g, '_')}_BOM.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Smart Kit Builder</h1>
          <p className="text-slate-500 mt-1 text-lg">Build, customize, and organize your project kits</p>
        </div>
        <button 
          onClick={handleExportBOM} 
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold shadow-sm">
          <Download className="w-4 h-4" /> Export BOM
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Projects List */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Workspaces</h3>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : kits.map(kit => (
              <div 
                key={kit.id}
                onClick={() => setActiveKitId(kit.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group ${activeKitId === kit.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <Box className="w-5 h-5" />
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeKitId === kit.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {kit.items?.length || 0} items
                    </span>
                    <button 
                      onClick={(e) => handleDeleteKit(kit.id, e)}
                      className={`p-1 rounded-md transition-colors ${activeKitId === kit.id ? 'hover:bg-blue-700 text-blue-200' : 'hover:bg-red-50 text-slate-300 hover:text-red-500'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="font-bold text-lg truncate">{kit.kit_name}</div>
              </div>
            ))}
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="New Project Name..." 
              value={newKitName}
              onChange={(e) => setNewKitName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateKit()}
              className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
            />
          </div>

          <button 
            onClick={handleCreateKit}
            disabled={!newKitName.trim()}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <FolderPlus className="w-4 h-4" /> Create Workspace
          </button>
        </div>

        {/* Right Col: Active Kit Contents */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm h-[600px] flex flex-col overflow-hidden relative">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <div className="flex items-center gap-2 min-w-0">
                <Box className="w-5 h-5 text-blue-600 shrink-0" />
                <h3 className="font-bold text-slate-900 truncate">{activeKit?.kit_name || 'Select a Workspace'}</h3>
              </div>
            </div>
            
            <div className="p-6 flex-1 bg-slate-50/50 overflow-y-auto">
              {!activeKit || !activeKit.items || activeKit.items.length === 0 ? (
                <div className="h-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-white">
                  <Cpu className="w-16 h-16 text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium">Your hardware list is empty.</p>
                  <p className="text-sm text-slate-400 mt-2">Go to the Product Explorer to start adding components.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeKit.items.map((item, idx) => {
                    const price = item.product.prices?.[0]?.price || 0;
                    return (
                      <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          {item.product.image ? (
                            <img src={item.product.image} alt={item.product.name} className="w-12 h-12 object-contain bg-slate-50 rounded-lg border border-slate-100" />
                          ) : (
                            <div className="w-12 h-12 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center">
                              <Cpu className="w-6 h-6 text-slate-300" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-800 leading-tight">{item.product.name}</div>
                            <span className="text-xs font-bold text-slate-400">₹{price} each</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-200">
                            <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors">
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-bold text-slate-900 w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="font-bold text-slate-900 text-lg min-w-[80px] text-right">
                            ₹{(price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {activeKit && activeKit.items && activeKit.items.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10">
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">BOM Total</span>
                    <div className="flex items-center gap-6">
                      <span className="text-3xl font-bold text-slate-900">₹{calculateTotal(activeKit.items).toLocaleString()}</span>
                      <button 
                        onClick={handleOpenProjectModal}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <FileText className="w-5 h-5" /> Document Project
                      </button>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Document Project Modal --- */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Document Your Project</h2>
                <p className="text-slate-500 text-sm mt-1">Save your progress or share it with the engineering community.</p>
              </div>
              <button onClick={() => setIsProjectModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-8 overflow-y-auto flex-1 space-y-8">
              
              {/* 1. Heading */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Project Title</label>
                <input 
                  type="text" 
                  value={projectForm.title}
                  onChange={e => setProjectForm({...projectForm, title: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none font-medium text-slate-900"
                />
              </div>

              {/* 2. Metadata (Difficulty & Tags) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1"><Signal className="w-4 h-4 text-slate-400"/> Difficulty Level</label>
                  <select 
                    value={projectForm.difficulty}
                    onChange={e => setProjectForm({...projectForm, difficulty: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none font-medium text-slate-700 appearance-none cursor-pointer"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1"><Tag className="w-4 h-4 text-slate-400"/> Project Tags</label>
                  <input 
                    type="text" 
                    placeholder="e.g. arduino, robotics, sensor"
                    value={projectForm.tags}
                    onChange={e => setProjectForm({...projectForm, tags: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-slate-700"
                  />
                </div>
              </div>

              {/* 3. About */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">About the Project</label>
                <textarea 
                  rows={4}
                  placeholder="What does this project do? What problem does it solve?"
                  value={projectForm.about}
                  onChange={e => setProjectForm({...projectForm, about: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-slate-700 resize-none"
                />
              </div>

              {/* 4. Development Process */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-bold text-slate-700">Development Process</label>
                  <button onClick={handleAddProcessStep} className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Step
                  </button>
                </div>
                
                <div className="space-y-4">
                  {projectForm.processSteps.map((step, idx) => (
                    <div key={idx} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm relative group">
                      <div className="absolute -left-3 -top-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                        {idx + 1}
                      </div>
                      {projectForm.processSteps.length > 1 && (
                        <button onClick={() => handleRemoveProcessStep(idx)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      <div className="space-y-3 pl-2">
                        <input 
                          type="text" placeholder="Step Title (e.g. Wiring the Sensors)"
                          value={step.title} onChange={e => handleUpdateProcessStep(idx, 'title', e.target.value)}
                          className="w-full px-3 py-2 bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none font-bold text-slate-800"
                        />
                        <textarea 
                          rows={2} placeholder="Explain what you did in this step..."
                          value={step.description} onChange={e => handleUpdateProcessStep(idx, 'description', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg outline-none text-sm text-slate-600 resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Links */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Project Links</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Youtube className="absolute left-4 top-3.5 w-5 h-5 text-red-500" />
                    <input 
                      type="text" placeholder="YouTube Video URL"
                      value={projectForm.youtubeLink} onChange={e => setProjectForm({...projectForm, youtubeLink: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-300"
                    />
                  </div>
                  <div className="relative">
                    <Github className="absolute left-4 top-3.5 w-5 h-5 text-slate-700" />
                    <input 
                      type="text" placeholder="GitHub Repository URL"
                      value={projectForm.githubLink} onChange={e => setProjectForm({...projectForm, githubLink: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${projectForm.publishToCommunity ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                  {projectForm.publishToCommunity && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    Publish to Project Ideas <Globe className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="text-xs text-slate-500">Make this visible to the community</div>
                </div>
                <input 
                  type="checkbox" className="hidden"
                  checked={projectForm.publishToCommunity}
                  onChange={(e) => setProjectForm({...projectForm, publishToCommunity: e.target.checked})}
                />
              </label>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setIsProjectModalOpen(false);
                    setShowAnalysis(true);
                  }}
                  className="px-6 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2"
                >
                  <Zap className="w-5 h-5" /> Analyze AI Feasibility
                </button>

                <button 
                  onClick={handleSaveProject}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  Save Project
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SmartKitBuilder;