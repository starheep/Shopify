import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2, Lightbulb, TrendingUp, BarChart3, 
  AlertCircle, Box, BookOpen, Zap, Loader2, ArrowLeft, Download 
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import API from '../services/api'; // <-- IMPORTING THE INTERCEPTOR

interface ProjectDashboardProps {
  initialKit?: any;
  onBack?: () => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ initialKit, onBack }) => {
  const [userKits, setUserKits] = useState<any[]>([]);
  const [selectedKitId, setSelectedKitId] = useState<number | string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchKits = async () => {
      try {
        // 👉 Using API, removed getAuthHeaders
        const res = await API.get('http://127.0.0.1:8000/kits/');
        setUserKits(res.data);
        
        if (initialKit) {
          setSelectedKitId(initialKit.id);
          analyzeKit(initialKit);
        } else if (res.data.length > 0) {
          setSelectedKitId(res.data[0].id);
        }
      } catch (err) {
        console.error("Failed to load kits for analysis", err);
      }
    };
    fetchKits();
  }, [initialKit]);

  const analyzeKit = async (kitToAnalyze: any) => {
    if (!kitToAnalyze) return;
    
    setIsAnalyzing(true);
    setError(null);
    setReport(null);

    const componentNames = kitToAnalyze.items?.map((i: any) => i.product.name).join(', ') || 'None specified';
    const ideaString = `
      Title: ${kitToAnalyze.kit_name}
      Description/Documentation: ${kitToAnalyze.description || 'No detailed description provided.'}
      Hardware Tech Stack: ${componentNames}
    `;

    try {
      // 👉 Using API, removed getAuthHeaders
      const response = await API.post('http://127.0.0.1:8000/myapp/analyze/', {
        idea: ideaString,
        type: 'FEASIBILITY'
      });

      setReport(response.data.report);
    } catch (err) {
      console.error(err);
      setError("The AI encountered an error analyzing this project. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectKitAndAnalyze = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const kitId = e.target.value;
    setSelectedKitId(kitId);
    const kit = userKits.find(k => k.id.toString() === kitId.toString());
    if (kit) analyzeKit(kit);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !report) return;
    
    try {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      const element = reportRef.current;
      
      const imgData = await toPng(element, { 
        backgroundColor: '#f8fafc',
        pixelRatio: 2 
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${report.title.replace(/\s+/g, '_')}_Analysis.pdf`);
      
    } catch (err: any) {
      console.error("PDF Export Error Details:", err);
      alert(`Failed to export PDF. Check console for details. Error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        
        {/* Left Side: Titles */}
        <div>
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Builder
            </button>
          )}
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Project Analysis</h1>
          <p className="text-slate-500 mt-1 text-lg">Feasibility & learning assessment based on your tech stack</p>
        </div>
        
        {/* Right Side: Action Bar */}
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          
          {/* Dropdown & Re-Analyze Group */}
          <div className="flex flex-1 sm:flex-none items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm min-w-min">
            <Box className="w-5 h-5 text-slate-400 ml-2 hidden sm:block" />
            <select 
              value={selectedKitId} 
              onChange={handleSelectKitAndAnalyze}
              disabled={isAnalyzing}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer pr-2 py-1 disabled:opacity-50 w-full sm:w-auto truncate max-w-[200px]"
            >
              <option value="" disabled>Select workspace...</option>
              {userKits.map(kit => (
                <option key={kit.id} value={kit.id}>{kit.kit_name}</option>
              ))}
            </select>
            <button 
              onClick={() => {
                const kit = userKits.find(k => k.id.toString() === selectedKitId.toString());
                if (kit) analyzeKit(kit);
              }}
              disabled={!selectedKitId || isAnalyzing}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-yellow-400" />}
              {isAnalyzing ? 'Analyzing...' : 'Re-Analyze'}
            </button>
          </div>

          {/* Download Button */}
          {report && !isAnalyzing && (
            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm disabled:opacity-70 whitespace-nowrap h-[46px] shrink-0"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? 'Exporting...' : 'Download PDF'}
            </button>
          )}

        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-3 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">AI is reviewing documentation and dependencies...</p>
        </div>
      )}

      {/* Report Render Container */}
      {!isAnalyzing && report && (
        <div ref={reportRef} className="space-y-8 animate-scaleIn bg-slate-50 p-4 sm:p-8 rounded-3xl border border-slate-100"> 
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">{report.title}</h2>
            <p className="text-slate-600 leading-relaxed text-lg">{report.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={CheckCircle2} color="blue" label="Success Probability" value={`${report.overallScore}%`} badge="Score" />
            <StatCard icon={Lightbulb} color="amber" label="Est. Timeline" value={report.estimatedTimeline} badge="Time" />
            <StatCard icon={AlertCircle} color="red" label="Risk Level" value={report.riskLevel} badge="Risk" />
            <StatCard icon={TrendingUp} color="emerald" label="Market Outlook" value={report.marketOutlook} badge="Value" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Project Metrics Breakdown</h3>
                  <p className="text-slate-500 text-sm">Feasibility based on tech stack</p>
                </div>
              </div>

              <div className="space-y-6">
                {report.metrics?.map((metric: any, idx: number) => {
                  const colors = ['bg-blue-600', 'bg-indigo-500', 'bg-emerald-500', 'bg-orange-500'];
                  return (
                    <ProgressBar 
                      key={idx} 
                      label={metric.label} 
                      value={metric.value} 
                      comment={metric.comment}
                      color={colors[idx % colors.length]} 
                    />
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-1 bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-900 rounded-full blur-3xl -ml-10 -mb-10 opacity-50"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <BookOpen className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-bold">Key Insights</h3>
                </div>
                
                <div className="space-y-4">
                  {report.keyPoints?.map((point: any, idx: number) => (
                    <ModuleItem 
                      key={idx}
                      icon={point.type.toLowerCase() === 'strength' ? TrendingUp : AlertCircle} 
                      title={point.type.toUpperCase()} 
                      subtitle={point.text} 
                      status={point.type} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Helper UI Components ---
const StatCard: React.FC<{ icon: any; color: string; label: string; value: string | number; badge: string }> = ({ icon: Icon, color, label, value, badge }) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600', 
    red: 'bg-red-50 text-red-600', emerald: 'bg-emerald-50 text-emerald-600'
  };
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl ${colorMap[color]}`}><Icon className="w-6 h-6" /></div>
        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase tracking-wide">{badge}</span>
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1 truncate">{value}</div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</div>
    </div>
  );
};

const ProgressBar: React.FC<{ label: string; value: number; comment?: string; color: string }> = ({ label, value, comment, color }) => (
  <div>
    <div className="flex justify-between items-end mb-2">
      <div>
        <span className="text-sm font-bold text-slate-800 block">{label}</span>
        {comment && <span className="text-xs text-slate-500 mt-0.5">{comment}</span>}
      </div>
      <span className="text-sm font-bold text-slate-900 ml-4">{value}%</span>
    </div>
    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const ModuleItem: React.FC<{ icon: any; title: string; subtitle: string; status: string }> = ({ icon: Icon, title, subtitle, status }) => (
  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
    <div className={`p-2 rounded-lg transition-colors shrink-0 ${status.toLowerCase() === 'strength' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <h4 className="font-bold text-sm text-slate-200 tracking-wide">{title}</h4>
      <p className="text-sm text-slate-400 mt-1 leading-relaxed">{subtitle}</p>
    </div>
  </div>
);

export default ProjectDashboard;