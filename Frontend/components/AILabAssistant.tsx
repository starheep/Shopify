import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Plus, X, Box, Settings, MessageSquare, Trash2 } from 'lucide-react';
import { chatService, kitService } from '../services/ProductService';
import { ChatMessage, SuggestedProduct } from '../types';

const AILabAssistant: React.FC = () => {
  // --- Core State ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // --- Session & Sidebar State ---
  const [sessionId, setSessionId] = useState<string | null>(sessionStorage.getItem('shopway_session_id'));
  const [sessions, setSessions] = useState<any[]>([]); // Holds the list of past chats
  
  // --- Config & Modals ---
  const [showSettings, setShowSettings] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    provider: localStorage.getItem('shopway_ai_provider') || 'gemini',
    custom_key: localStorage.getItem('shopway_ai_key') || ''
  });
  const [showKitSelection, setShowKitSelection] = useState<SuggestedProduct | null>(null);
  const [userKits, setUserKits] = useState<any[]>([]); 

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch the list of past sessions for the Sidebar to load
  const fetchSessions = async () => {
    try {
      const data = await chatService.getSessions();
      if (data.sessions) setSessions(data.sessions);
    } catch (err) {
      console.error("Could not load sessions", err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // 2. Fetch specific Chat History when a session is clicked
  useEffect(() => {
    if (sessionId) {
      chatService.getHistory(sessionId)
        .then(data => {
          if (data.messages) {
            const loadedMessages = data.messages.map((msg: any) => {
              const jsonMatch = msg.text.match(/```json\n([\s\S]*?)\n```/);
              let structuredData = undefined;
              let cleanText = msg.text;

              if (jsonMatch && jsonMatch[1]) {
                try {
                  structuredData = JSON.parse(jsonMatch[1]);
                  cleanText = msg.text.replace(/```json\n([\s\S]*?)\n```/g, '');
                } catch(e) {}
              }

              return {
                id: msg.id.toString(),
                role: msg.role,
                text: cleanText,
                structuredData: structuredData,
                timestamp: new Date()
              };
            });
            setMessages(loadedMessages);
          }
        })
        .catch(err => console.error("Could not load history", err));
    } else {
      // If sessionId is null (New Chat), clear the screen
      setMessages([]);
    }
  }, [sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // --- Handlers ---
  const handleNewChat = () => {
    setSessionId(null);
    sessionStorage.removeItem('shopway_session_id');
    setMessages([]);
  };

  const handleSelectSession = (id: string) => {
    setSessionId(id);
    sessionStorage.setItem('shopway_session_id', id);
  };

  const saveSettings = () => {
    localStorage.setItem('shopway_ai_provider', aiConfig.provider);
    localStorage.setItem('shopway_ai_key', aiConfig.custom_key);
    setShowSettings(false);
  };

  const handleAddToKit = async (kitId: string) => {
    if (showKitSelection) {
      try {
        await kitService.addItem(kitId, showKitSelection.id.toString(), 1);
        alert(`Successfully added ${showKitSelection.name} to kit!`);
        setShowKitSelection(null);
      } catch (error) {
        alert("Failed to add item.");
      }
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue.trim(),
      timestamp: new Date()
    };

    const currentHistory = [...messages];
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(userMsg.text, currentHistory, aiConfig, sessionId);
      const responseText = response.reply;
      
      // If this was a new chat, the backend generated a new session ID!
      if (response.session_id && response.session_id !== sessionId) {
        setSessionId(response.session_id);
        sessionStorage.setItem('shopway_session_id', response.session_id);
        fetchSessions(); // Refresh the sidebar so the new chat appears!
      }
      
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      let cleanText = responseText;
      let structuredData = undefined;

      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsedData = JSON.parse(jsonMatch[1]);
          if (parsedData.type === 'product_recommendation') {
            structuredData = parsedData;
            cleanText = responseText.replace(/```json\n([\s\S]*?)\n```/g, '');
          }
        } catch (e) {}
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: cleanText,
        structuredData: structuredData,
        timestamp: new Date()
      }]);

    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Connection error. Check your API settings.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (text: string) => {
    if (!text) return "";
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={i} className="block mb-2 last:mb-0">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fadeIn relative">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Bot className="w-6 h-6" />
            </div>
            AI Lab Assistant
          </h1>
          <p className="text-slate-500 mt-1 text-lg ml-[3.25rem]">Neural-guided component procurement</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowSettings(true)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> System Online
          </div>
        </div>
      </div>

      {/* Layout (ChatGPT/Gemini Style) */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left Col: Sidebar  */}
        <div className="w-72 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-100">
            <button 
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold py-3 rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" /> New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 mt-2">Recent Chats</p>
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-400 px-3 italic">No past conversations.</p>
            ) : (
              sessions.map(session => (
                <button 
                  key={session.id} 
                  onClick={() => handleSelectSession(session.id)}
                  className={`w-full text-left flex flex-col p-3 rounded-xl transition-colors ${
                    sessionId === session.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${sessionId === session.id ? 'text-blue-200' : 'text-slate-400'}`} />
                    <span className="font-semibold text-sm truncate">{session.title}</span>
                  </div>
                  <span className={`text-[10px] pl-6 ${sessionId === session.id ? 'text-blue-200' : 'text-slate-400'}`}>
                    {session.updated_at}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Col: The Main Chat Window */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            
            {messages.length === 0 && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                  <Bot className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Hello! I'm your AI Lab Assistant.</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  I can help you find parts, verify compatibility, or build a kit for your next project.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-4 max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-blue-600'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    {msg.text && (
                      <div className={`p-5 rounded-2xl text-base leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'}`}>
                        {msg.role === 'model' ? formatMessage(msg.text) : msg.text}
                      </div>
                    )}

                    {msg.structuredData && msg.structuredData.type === 'product_recommendation' && (
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl rounded-tl-none shadow-sm space-y-4 w-full">
                        <p className="text-sm font-medium text-slate-700">{msg.structuredData.message}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {msg.structuredData.products.map((product: any) => (
                            <div key={product.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between gap-4">
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm mb-1">{product.name}</h4>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{product.category}</span>
                                <span className="text-sm font-bold text-green-600 mt-2 block">{product.estimated_price}</span>
                              </div>
                              <button onClick={() => {setShowKitSelection(product); kitService.getAll().then(setUserKits);}} className="w-full py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-1">
                                <Plus className="w-3 h-3" /> Add to Kit
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 text-blue-600 flex items-center justify-center shadow-sm"><Bot className="w-5 h-5" /></div>
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl rounded-tl-none shadow-sm flex gap-2 items-center">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-slate-100">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message AI Lab Assistant..."
                className="w-full pl-6 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-inner"
                disabled={isLoading}
              />
              <button onClick={handleSend} disabled={!inputValue.trim() || isLoading} className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-50 shadow-md">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Modals : Settings and Kits --- */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900 text-lg">AI Configuration</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Provider Core</label>
            <select value={aiConfig.provider} onChange={e => setAiConfig({...aiConfig, provider: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4">
              <option value="gemini">Google Gemini (Default)</option>
              <option value="groq">Groq (LLaMA Engine)</option>
            </select>
            <label className="block text-sm font-bold text-slate-700 mb-2">Custom API Key</label>
            <input type="password" placeholder={`Paste key here`} value={aiConfig.custom_key} onChange={e => setAiConfig({...aiConfig, custom_key: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mb-6" />
            <button onClick={saveSettings} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Save Configuration</button>
          </div>
        </div>
      )}

      {showKitSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowKitSelection(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-lg">Add to Kit</h3>
              <button onClick={() => setShowKitSelection(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-900">{showKitSelection.name}</h4>
              </div>
              <p className="text-sm font-bold text-slate-700 mb-3">Select a Destination Kit:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {userKits.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No kits available.</p>
                ) : (
                  userKits.map(kit => (
                    <button key={kit.id} onClick={() => handleAddToKit(kit.id)} className="w-full p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 flex items-center justify-between">
                      <span className="font-bold text-slate-700">{kit.kit_name}</span>
                      <Plus className="w-5 h-5 text-slate-300" />
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

export default AILabAssistant;