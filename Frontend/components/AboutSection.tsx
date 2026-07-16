import React from 'react';
import { Box, CheckCircle, Mail, ShieldCheck, Rocket, MessageCircle, Users, Code, Terminal, Search, Shield } from 'lucide-react';

const AboutSection: React.FC = () => {
  const team = [
    { name: "Jatin Sharma", role: "Head of Project & Backend Developer", icon: <Terminal className="w-5 h-5" /> },
    { name: "Nishant Gautam", role: "Frontend Developer", icon: <Code className="w-5 h-5" /> },
    { name: "Kunal Garg", role: "Testing & Data Collection", icon: <Search className="w-5 h-5" /> },
    { name: "Rohit Shakyawar", role: "Testing", icon: <Shield className="w-5 h-5" /> }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn pb-20">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-200 mb-6">
          <Box className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">About Tech ShopWay</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
          The ultimate hyper-local ecosystem for engineering students to discover parts, 
          analyze projects, and support local vendors.
        </p>
      </div>

      {/* Project Vision */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <Rocket />, title: "Instant Access", desc: "Get components today with same-day local pickup." },
          { icon: <ShieldCheck />, title: "Verified Quality", desc: "Every local partner is vetted for engineering standards." },
          { icon: <MessageCircle />, title: "AI Powered", desc: "Analyze project feasibility and BOMs with Gemini AI." }
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">{item.icon}</div>
            <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* --- Team Section --- */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Meet the Team</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {team.map((member, index) => (
            <div key={index} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                {member.icon}
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{member.name}</h4>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vendor Onboarding (The Approval Process) */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-4">Are you a Local Vendor?</h2>
          <p className="text-slate-400 mb-8 max-w-lg">
            Join our network to provide parts directly to students at Eshan College and beyond. 
            All seller accounts require manual admin verification.
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium">Create a Seller Account on the Register page.</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium">Submit your store details in the Seller Hub Settings.</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium">Email us your Store ID for final approval.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-xl border border-white/10">
              <Mail className="w-5 h-5 text-blue-300" />
              <span className="font-bold text-sm">jatin2204710100054@eshancollege.com</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-xl border border-white/10">
              <MessageCircle className="w-5 h-5 text-green-400" />
              <span className="font-bold text-sm">Contact Admin</span>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default AboutSection;