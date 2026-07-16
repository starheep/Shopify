import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, User, Code, Layers, ArrowLeft, MessageSquare, GitFork, Loader2, XCircle, Plus, Terminal, ArrowRight, Settings, CheckCircle2, Cpu, Heart, Share2, Star } from 'lucide-react';
import { projectIdeaService } from '../services/ProductService'; 
import API from '../services/api'; // <-- IMPORTING THE INTERCEPTOR

export interface Review {
  id: string;
  user: string;
  date: string;
  rating: number;
  comment: string;
}

export interface Project {
  id: string;
  title: string;
  studentName: string;
  university: string;
  date?: string;
  description: string;
  techStack: string[];
  image: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  clones: number;
  tags?: string;
  reviews?: Review[];
}

const CATEGORIES = ['All Categories', 'IoT', 'Robotics', 'Web App', 'Machine Learning', 'Hardware', 'Electronics'];
const DIFFICULTIES = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

export const ProjectIdeas: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // --- Review Form State ---
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const data = await projectIdeaService.getAll();
        setProjects(data);
        setError(null);
      } catch (err) {
        setError("Could not load community projects. Please ensure your Django server is running.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        project.title.toLowerCase().includes(searchLower) || 
        project.description.toLowerCase().includes(searchLower) ||
        (project.techStack && project.techStack.some(tech => tech.toLowerCase().includes(searchLower)));
      
      const matchesCategory = selectedCategory === 'All Categories' || project.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'All Levels' || project.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [projects, searchTerm, selectedCategory, selectedDifficulty]);

  // --- Server Actions ---
  const handleCloneProject = async (projectId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      // 👉 Using API, removed headers block
      const res = await API.post(`http://127.0.0.1:8000/myapp/ideas/${projectId}/clone/`);
      
      alert(res.data.message);
      
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, clones: res.data.clones } : p));
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject({ ...selectedProject, clones: res.data.clones });
      }
    } catch (error: any) {
       if (error.response && error.response.status === 400) {
         alert(error.response.data.error);
       } else {
         alert("Please log in to clone projects to your workspace.");
       }
    }
  };

  const handlePostReview = async () => {
    if (!selectedProject) return;
    if (!reviewForm.comment.trim()) return alert("Please write a comment.");
    
    setIsSubmittingReview(true);
    try {
      // 👉 Using API, removed headers block
      const res = await API.post(`http://127.0.0.1:8000/myapp/ideas/${selectedProject.id}/review/`, reviewForm);
      
      const newReview = res.data.review;
      
      // Update UI with the new review
      const updatedProject = {
        ...selectedProject,
        reviews: [newReview, ...(selectedProject.reviews || [])]
      };
      
      setSelectedProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      
      // Clear the form
      setReviewForm({ rating: 5, comment: '' });
      alert("Review posted successfully!");
      
    } catch (error) {
      alert("Failed to post review. Make sure you are logged in.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderFormattedDescription = (desc: string) => {
    if (!desc) return null;
    const sections = desc.split('###').filter(Boolean);
    
    return sections.map((section, idx) => {
      const lines = section.trim().split('\n');
      const title = idx === 0 ? "About the Project" : lines[0].trim();
      
      if (title.includes('Metadata') || title.includes('Links')) return null;

      if (title.includes('Development Process')) {
        return (
          <div key={idx} className="mb-10">
            <h4 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Settings className="w-5 h-5 text-blue-500" /> {title}
            </h4>
            <div className="space-y-6">
              {lines.slice(1).map((line, lineIdx) => {
                if (!line.trim()) return null;
                const match = line.match(/\d+\.\s+\*\*(.*?)\*\*:\s+(.*)/);
                if (match) {
                  return (
                    <div key={lineIdx} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {line.match(/^\d+/)?.[0] || '•'}
                        </div>
                        <div className="w-px h-full bg-slate-100 my-1 group-last:hidden"></div>
                      </div>
                      <div className="pb-4 pt-1">
                        <h5 className="font-bold text-slate-900 text-lg mb-1">{match[1]}</h5>
                        <p className="text-slate-600 leading-relaxed">{match[2]}</p>
                      </div>
                    </div>
                  );
                }
                return <p key={lineIdx} className="text-slate-600 ml-12 mb-4">{line.replace(/\*\*/g, '')}</p>;
              })}
            </div>
          </div>
        );
      }

      const content = idx === 0 ? section.trim() : lines.slice(1).join('\n').trim();
      return (
        <div key={idx} className="mb-10">
          <h4 className="text-xl font-extrabold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Terminal className="w-5 h-5 text-blue-500" /> {title}
          </h4>
          <div className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap">{content.replace(/\*\*/g, '')}</div>
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 h-full">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading community projects from database...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn">
      {selectedProject ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSelectedProject(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors bg-white px-5 py-2.5 rounded-xl shadow-sm border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Hub
            </button>
          </div>
          
          <div className="bg-slate-900 rounded-[2rem] overflow-hidden shadow-xl relative h-[400px] flex items-end">
             {selectedProject.image ? (
               <img src={selectedProject.image} alt={selectedProject.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
             ) : (
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black">
                 <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
               </div>
             )}
             
             <div className="relative z-10 p-12 w-full bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent">
               <div className="flex flex-wrap gap-3 mb-4">
                  <span className="bg-blue-500/20 backdrop-blur-md text-blue-300 border border-blue-400/30 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                    {selectedProject.category}
                  </span>
                  <span className={`backdrop-blur-md text-xs font-bold px-3 py-1.5 rounded-full border uppercase tracking-wider ${
                    selectedProject.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                    selectedProject.difficulty === 'Intermediate' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 
                    'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}>
                    {selectedProject.difficulty}
                  </span>
               </div>
               <h1 className="text-5xl font-black text-white tracking-tight mb-2">{selectedProject.title}</h1>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              
              {/* Project Documentation */}
              <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm">
                {renderFormattedDescription(selectedProject.description)}
              </div>

              {/* Reviews & Ratings Section */}
              <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm">
                <h4 className="text-2xl font-extrabold text-slate-900 mb-8 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-blue-500" /> Community Reviews
                </h4>

                {/* Post a Review Form */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-10">
                  <h5 className="font-bold text-slate-700 mb-3">Leave a Review</h5>
                  
                  {/* Star Rating Selector */}
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        onClick={() => setReviewForm({...reviewForm, rating: star})}
                        className="p-1 focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star className={`w-6 h-6 ${reviewForm.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-bold text-slate-500">{reviewForm.rating} out of 5</span>
                  </div>

                  <textarea 
                    rows={3}
                    placeholder="What did you think of this project?"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 resize-none mb-4 text-slate-700"
                  />
                  
                  <div className="flex justify-end">
                    <button 
                      onClick={handlePostReview}
                      disabled={isSubmittingReview}
                      className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Review"}
                    </button>
                  </div>
                </div>

                {/* Display Existing Reviews */}
                <div className="space-y-6">
                  {(!selectedProject.reviews || selectedProject.reviews.length === 0) ? (
                    <p className="text-slate-500 italic text-center py-4">No reviews yet. Be the first to share your thoughts!</p>
                  ) : (
                    selectedProject.reviews.map((review) => (
                      <div key={review.id} className="pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                              {review.user[0].toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-900">{review.user}</span>
                            <span className="text-slate-400">• {review.date}</span>
                          </div>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-3.5 h-3.5 ${review.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-600 ml-10 leading-relaxed">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Published By</h3>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-black text-xl border-2 border-blue-100 shadow-sm">
                    {selectedProject.studentName?.[0] || 'U'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">{selectedProject.studentName}</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Verified Student
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <div className="font-black text-slate-900">{selectedProject.clones || 0}</div>
                    <div className="text-xs text-slate-500 font-medium">Clones</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <div className="font-black text-slate-900">{selectedProject.reviews?.length || 0}</div>
                    <div className="text-xs text-slate-500 font-medium">Reviews</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4" /> Bill of Materials
                </h3>
                
                {selectedProject.techStack && selectedProject.techStack.length > 0 ? (
                  <div className="space-y-2 mb-6">
                    {selectedProject.techStack.map(tech => (
                      <div key={tech} className="px-4 py-3 bg-slate-50 text-slate-700 font-bold text-sm rounded-xl border border-slate-100 flex items-center justify-between">
                        <span>{tech}</span>
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mb-6 italic">No specific hardware logged.</p>
                )}

                <button 
                  onClick={() => handleCloneProject(selectedProject.id)}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 group"
                >
                  <GitFork className="w-5 h-5 group-hover:-rotate-12 transition-transform" /> Clone to Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ---- GRID VIEW ----- */
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Community Hub</h1>
              <p className="text-slate-500 mt-1 text-lg">Discover and clone projects from other engineering students</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search projects, technologies, or keywords..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-medium text-slate-700"
              />
            </div>
            <div className="flex gap-4">
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-600 cursor-pointer"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select 
                value={selectedDifficulty} 
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-600 cursor-pointer"
              >
                {DIFFICULTIES.map(diff => <option key={diff} value={diff}>{diff}</option>)}
              </select>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-3xl border-dashed">
               <Search className="w-16 h-16 text-slate-200 mb-6" />
               <h3 className="text-xl font-bold text-slate-700 mb-2">No projects found</h3>
               <p className="text-slate-500 font-medium">Try adjusting your filters or search terms.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProjects.map(project => (
                <div 
                  key={project.id} 
                  onClick={() => setSelectedProject(project)}
                  className="relative bg-white rounded-3xl border border-slate-200 hover:border-blue-400 overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1"
                >
                  <div className="h-48 bg-slate-900 relative overflow-hidden">
                    {project.image ? (
                      <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black relative">
                         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                         <Layers className="w-12 h-12 text-blue-500/50 mb-2 z-10" />
                         <span className="text-slate-500 font-mono text-xs z-10 tracking-widest">TECH_WORKSPACE</span>
                      </div>
                    )}
                    
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                      <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/20 uppercase tracking-wider shadow-lg">
                        {project.category}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`backdrop-blur-md text-[10px] font-bold px-3 py-1.5 rounded-full border uppercase tracking-wider shadow-lg ${
                        project.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                        project.difficulty === 'Intermediate' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 
                        'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}>
                        {project.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="absolute top-40 left-6 flex items-end gap-3 z-20">
                    <div className="w-16 h-16 bg-white rounded-2xl p-1 shadow-lg border border-slate-100 transform group-hover:-translate-y-2 transition-transform duration-300">
                       <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-xl border border-blue-100/50">
                         {project.studentName?.[0] || 'U'}
                       </div>
                    </div>
                  </div>

                  <div className="pt-12 pb-6 px-6 flex flex-col flex-1 bg-white relative z-10">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Published by <span className="text-blue-600">{project.studentName}</span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-xl mb-3 group-hover:text-blue-600 transition-colors line-clamp-1 decoration-2 group-hover:underline underline-offset-4">{project.title}</h3>
                    
                    <p className="text-slate-600 text-sm mb-6 line-clamp-2 flex-1 leading-relaxed">{project.description.split('###')[0].trim()}</p>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium hover:text-blue-600 transition-colors">
                           <MessageSquare className="w-4 h-4" /> <span>{project.reviews?.length || 0}</span>
                         </div>
                         <button 
                           onClick={(e) => handleCloneProject(project.id, e)}
                           className="flex items-center gap-1.5 text-slate-500 text-sm font-medium hover:text-blue-600 transition-colors z-20"
                         >
                           <GitFork className="w-4 h-4" /> <span>{project.clones || 0}</span>
                         </button>
                      </div>
                      <div className="flex items-center text-blue-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                        View Details <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
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

export default ProjectIdeas;