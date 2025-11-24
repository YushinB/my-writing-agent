
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Book, ArrowRight, PenLine, Eraser, CheckCircle2, Copy, Sun, Moon, Zap, ArrowUpRight, LogOut, Settings, BookOpen, Briefcase, Coffee, Terminal, Feather, GraduationCap, Hash, AlertCircle, ArrowDown, Award, BarChart3 } from 'lucide-react';
import { analyzeText, defineWord, getLiveSuggestion } from '../services/gemini';
import { CorrectionResponse, SavedWord, TextSelection, WordDefinition, LiveSuggestion, User, AppSettings, WritingStyle } from '../types';
import { Tooltip } from './Tooltip';
import { DefinitionCard } from './DefinitionCard';
import { DictionarySidebar } from './DictionarySidebar';

interface WritingStudioProps {
  user: User;
  settings: AppSettings;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onToggleTheme: () => void;
}

export const WritingStudio: React.FC<WritingStudioProps> = ({ 
  user, 
  settings, 
  onLogout, 
  onOpenAdmin,
  onToggleTheme
}) => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CorrectionResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'correction' | 'better'>('correction');
  const [selectedStyle, setSelectedStyle] = useState<WritingStyle>('formal');

  // Dictionary State
  const [savedWords, setSavedWords] = useState<SavedWord[]>(() => {
    const saved = localStorage.getItem('prosepolish_dictionary');
    return saved ? JSON.parse(saved) : [];
  });
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);

  // Selection & Definition State
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [isDefining, setIsDefining] = useState(false);
  const [currentDefinition, setCurrentDefinition] = useState<WordDefinition | null>(null);
  
  // Live Mode State
  const [liveMode, setLiveMode] = useState(false);
  const [liveSuggestion, setLiveSuggestion] = useState<LiveSuggestion | null>(null);
  const [isGettingSuggestion, setIsGettingSuggestion] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('prosepolish_dictionary', JSON.stringify(savedWords));
  }, [savedWords]);

  // Map font setting to class
  const getFontClass = () => {
    switch(settings.fontFamily) {
      case 'merriweather': return 'font-serif';
      case 'playfair': return 'font-display';
      case 'roboto-mono': return 'font-mono';
      default: return 'font-sans';
    }
  };

  const styleOptions: { id: WritingStyle; label: string; icon: React.ReactNode }[] = [
    { id: 'formal', label: 'Formal', icon: <Briefcase size={14} /> },
    { id: 'casual', label: 'Casual', icon: <Coffee size={14} /> },
    { id: 'technical', label: 'Technical', icon: <Terminal size={14} /> },
    { id: 'storytelling', label: 'Story', icon: <Feather size={14} /> },
    { id: 'academic', label: 'Academic', icon: <GraduationCap size={14} /> },
    { id: 'blog', label: 'Blog', icon: <Hash size={14} /> },
  ];

  // Live Suggestion Effect
  useEffect(() => {
    if (!liveMode || !inputText.trim()) {
      setLiveSuggestion(null);
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setIsGettingSuggestion(true);
    typingTimeoutRef.current = setTimeout(async () => {
      try {
        if (inputText.length > 5) {
          const suggestion = await getLiveSuggestion(inputText, settings.aiModel);
          if (suggestion && suggestion.suggestion !== suggestion.originalFragment) {
            setLiveSuggestion(suggestion);
          } else {
            setLiveSuggestion(null);
          }
        }
      } catch (e) {
        console.error("Live suggestion error:", e);
      } finally {
        setIsGettingSuggestion(false);
      }
    }, 1200);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [inputText, liveMode, settings.aiModel]);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const data = await analyzeText(inputText, settings.aiModel, selectedStyle);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze text. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTextSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !outputRef.current) {
      setSelection(null);
      return;
    }

    if (!outputRef.current.contains(sel.anchorNode)) {
      setSelection(null);
      return;
    }

    const text = sel.toString().trim();
    if (text.length === 0 || text.length > 50) { 
      setSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    let context = text;
    if (sel.anchorNode && sel.anchorNode.parentElement) {
        context = sel.anchorNode.parentElement.textContent || text;
    }

    setSelection({
      text,
      context,
      range,
      rect
    });
  }, []);

  const handleDefine = async () => {
    if (!selection) return;
    setIsDefining(true);
    try {
      const def = await defineWord(selection.text, selection.context, settings.aiModel);
      setCurrentDefinition(def);
      setSelection(null); 
      window.getSelection()?.removeAllRanges(); 
    } catch (error) {
      console.error(error);
      alert("Could not define word.");
    } finally {
      setIsDefining(false);
    }
  };

  const handleSaveWord = (def: WordDefinition) => {
    const newWord: SavedWord = {
      ...def,
      id: crypto.randomUUID(),
      dateAdded: Date.now()
    };
    setSavedWords(prev => [...prev, newWord]);
  };

  const handleRemoveWord = (id: string) => {
    setSavedWords(prev => prev.filter(w => w.id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const applySuggestion = () => {
    if (!liveSuggestion) return;
    const lastIndex = inputText.lastIndexOf(liveSuggestion.originalFragment);
    if (lastIndex !== -1) {
        const newText = inputText.substring(0, lastIndex) + liveSuggestion.suggestion;
        setInputText(newText);
        setLiveSuggestion(null);
    }
  };

  // Helper for IELTS Band Color
  const getBandColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 6.5) return 'text-blue-600 dark:text-blue-400';
    if (score >= 5) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className={`flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 ${getFontClass()}`} onMouseUp={handleTextSelection} onKeyUp={handleTextSelection}>
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 z-20 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 text-white p-2 rounded-lg">
            <PenLine size={24} />
          </div>
          <h1 className="text-xl font-bold font-serif tracking-tight text-slate-800 dark:text-slate-100">ProsePolish</h1>
        </div>
        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
             <button 
                onClick={onOpenAdmin}
                className="p-2 text-slate-600 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                title="Admin Dashboard"
             >
                <Settings size={20} />
             </button>
          )}
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
            title={settings.theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => setIsDictionaryOpen(true)}
            className="relative p-2 text-slate-600 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
          >
            <Book size={24} />
            {savedWords.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            )}
          </button>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
          <button 
            onClick={onLogout}
            className="text-xs font-medium text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors flex items-center gap-1"
          >
             Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Input Section */}
        <section className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[50%] lg:h-full relative z-10 transition-colors duration-300">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h2 className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Original Text
            </h2>
            <div className="flex items-center gap-3">
               <button 
                  onClick={() => setLiveMode(!liveMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                     liveMode 
                       ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 shadow-[0_0_10px_rgba(251,191,36,0.2)]' 
                       : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
               >
                  <Zap size={14} className={liveMode ? "fill-amber-500 dark:fill-amber-400" : ""} />
                  Live Mode {liveMode ? 'ON' : 'OFF'}
               </button>
               {inputText && (
                  <button onClick={() => setInputText('')} className="text-slate-400 hover:text-red-500 transition-colors" title="Clear text">
                  <Eraser size={16} />
                  </button>
               )}
            </div>
          </div>
          
          <div className="flex-1 relative w-full h-full">
            <textarea
               className={`w-full h-full p-6 resize-none focus:outline-none text-lg leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-600 text-black dark:text-white bg-transparent ${getFontClass()}`}
               placeholder="Type your text here..."
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               spellCheck="false"
            />
            
            {/* Live Suggestion Floating Card */}
            {liveMode && (
               <div className="absolute bottom-4 left-6 right-6 pointer-events-none">
                  <div className={`
                     bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-xl p-4 shadow-lg backdrop-blur-sm transition-all duration-300 transform pointer-events-auto
                     ${liveSuggestion ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}
                  `}>
                     {liveSuggestion && (
                        <div className="flex flex-col gap-2">
                           <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                 <Sparkles size={12} />
                                 Suggestion ({liveSuggestion.type})
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{liveSuggestion.reason}</span>
                           </div>
                           <p className="text-slate-800 dark:text-slate-200 font-medium">
                              {liveSuggestion.suggestion}
                           </p>
                           <button 
                              onClick={applySuggestion}
                              className="self-end mt-1 text-xs font-semibold bg-amber-200 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-3 py-1.5 rounded-md hover:bg-amber-300 dark:hover:bg-amber-900/60 transition-colors flex items-center gap-1"
                           >
                              Apply Change <ArrowUpRight size={14} />
                           </button>
                        </div>
                     )}
                     {!liveSuggestion && isGettingSuggestion && (
                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm animate-pulse">
                           <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                           Thinking...
                        </div>
                     )}
                  </div>
               </div>
            )}
          </div>

          {/* Style Selector & Action */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0 z-20">
            <div className="flex gap-2 overflow-x-auto pb-3 mb-1 no-scrollbar mask-gradient">
              {styleOptions.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border
                    ${selectedStyle === style.id
                      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800 ring-1 ring-brand-200 dark:ring-brand-800'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}
                  `}
                >
                  {style.icon}
                  {style.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !inputText.trim()}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-600 text-white py-3 rounded-xl font-medium shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Polish Writing ({selectedStyle})
                </>
              )}
            </button>
          </div>
        </section>

        {/* Output Section */}
        <section className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/50 min-h-[50%] lg:h-full overflow-hidden relative transition-colors duration-300">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
            <button
              onClick={() => setActiveTab('correction')}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'correction' 
                  ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 size={16} />
              Grammar Check
            </button>
            <button
              onClick={() => setActiveTab('better')}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'better' 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles size={16} />
              Better Phrasing
            </button>
          </div>

          <div 
            className={`flex-1 overflow-y-auto p-6 md:p-8 relative scroll-smooth ${getFontClass()}`} 
            ref={outputRef}
          >
            {!result ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                  <ArrowRight size={24} className="opacity-50" />
                </div>
                <p>Your polished text will appear here.</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {activeTab === 'correction' ? (
                  <div className="space-y-4">
                    {/* ORIGINAL TEXT CARD (With Errors Highlighted) */}
                    <div className="rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 bg-red-50/40 dark:bg-red-900/10 p-6 md:p-8 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-2">
                          <AlertCircle size={16} />
                          Original with Issues
                        </h3>
                      </div>
                      <div className="text-xl leading-8 text-slate-800 dark:text-slate-200">
                        {result.segments?.map((segment, index) => {
                          if (segment.isCorrection && segment.originalText) {
                            return (
                              <span key={index} className="group relative inline-block cursor-help bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 line-through decoration-red-500/50 decoration-2 px-1.5 rounded-md mx-0.5 font-medium border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-colors">
                                {segment.originalText}
                                <span className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                                  <span className="text-slate-300 mr-1">Suggest:</span>
                                  <span className="font-bold text-green-400">{segment.text}</span>
                                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700"></span>
                                </span>
                              </span>
                            );
                          } else if (!segment.isCorrection) {
                            return <span key={index} className="opacity-70">{segment.text}</span>;
                          }
                          return null;
                        })}
                      </div>
                    </div>

                    {/* Arrow Indicator */}
                    <div className="flex justify-center">
                       <ArrowDown className="text-slate-300 dark:text-slate-600 animate-bounce" size={24} />
                    </div>

                    {/* CORRECTED TEXT CARD */}
                    <div className="rounded-xl shadow-sm border border-green-100 dark:border-green-900/30 bg-white dark:bg-slate-900 p-6 md:p-8 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-green-600 dark:text-green-400 flex items-center gap-2">
                          <CheckCircle2 size={16} />
                          Corrected Version
                        </h3>
                        <button 
                          onClick={() => copyToClipboard(result.correctedText)}
                          className="text-slate-400 hover:text-green-600 transition-colors"
                          title="Copy to clipboard"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <div className="text-xl leading-8 text-slate-900 dark:text-slate-100">
                        {result.segments ? (
                          result.segments.map((segment, index) => {
                            if (segment.isCorrection) {
                              return (
                                <span key={index} className="group relative inline-block cursor-help bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-b-2 border-green-500/50 dark:border-green-500/50 rounded-t-sm px-1 mx-0.5 font-medium">
                                  {segment.text}
                                  {/* Hover Tooltip */}
                                  <span className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 dark:bg-slate-700 text-white text-sm rounded-lg shadow-xl z-50 pointer-events-none font-sans normal-case not-italic text-left">
                                    <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Original</span>
                                    <span className="block font-medium text-red-300 line-through mb-2">"{segment.originalText}"</span>
                                    <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Reason</span>
                                    <span className="block text-slate-200">{segment.explanation}</span>
                                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800 dark:border-t-slate-700"></span>
                                  </span>
                                </span>
                              );
                            }
                            return <span key={index}>{segment.text}</span>;
                          })
                        ) : (
                          result.correctedText
                        )}
                      </div>
                    </div>

                    {/* IELTS Assessment Card */}
                    {result.ieltsAssessment && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-teal-200 dark:border-teal-800 overflow-hidden">
                            <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border-b border-teal-100 dark:border-teal-800 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-teal-800 dark:text-teal-300 flex items-center gap-2 font-serif">
                                    <Award size={22} />
                                    IELTS Assessment
                                </h3>
                                <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-teal-100 dark:border-teal-800">
                                    Academic Level
                                </span>
                            </div>
                            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
                                {/* Overall Score Circle */}
                                <div className="flex flex-col items-center justify-center shrink-0">
                                    <div className="w-28 h-28 rounded-full border-8 border-teal-100 dark:border-teal-900/50 flex items-center justify-center relative bg-white dark:bg-slate-800 shadow-inner">
                                        <div className="text-center">
                                            <span className={`block text-4xl font-black ${getBandColor(result.ieltsAssessment.overallBand)}`}>
                                                {result.ieltsAssessment.overallBand}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overall Band</span>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-center text-sm font-medium text-slate-600 dark:text-slate-400 max-w-[150px]">
                                        {result.ieltsAssessment.generalFeedback}
                                    </p>
                                </div>

                                {/* Criteria List */}
                                <div className="flex-1 w-full grid grid-cols-1 gap-4">
                                    {result.ieltsAssessment.criteria.map((criterion, idx) => (
                                        <div key={idx} className="space-y-1.5">
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                    {criterion.name}
                                                </span>
                                                <span className={`text-sm font-bold ${getBandColor(criterion.score)}`}>{criterion.score}</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ${
                                                        criterion.score >= 8 ? 'bg-emerald-500' :
                                                        criterion.score >= 6.5 ? 'bg-blue-500' :
                                                        criterion.score >= 5 ? 'bg-amber-400' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${(criterion.score / 9) * 100}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                                                {criterion.feedback}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summary & Improvements */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-5">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                            <CheckCircle2 size={18} />
                            Summary
                            </h4>
                            <p className="text-blue-800/80 dark:text-blue-200/70 text-sm leading-relaxed">
                            {result.explanation}
                            </p>
                        </div>
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl p-5">
                            <h4 className="font-semibold text-emerald-900 dark:text-emerald-300 mb-2 flex items-center gap-2">
                            <BarChart3 size={18} />
                            Key Improvements
                            </h4>
                            <ul className="space-y-1.5">
                            {result.keyImprovements.map((imp, idx) => (
                                <li key={idx} className="text-emerald-800/80 dark:text-emerald-200/70 text-sm flex items-start gap-2">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-400 shrink-0"></span>
                                {imp}
                                </li>
                            ))}
                            </ul>
                        </div>
                    </div>
                  </div>
                ) : (
                  // Better Phrasing Card (ActiveTab === 'better')
                  <div className="rounded-xl shadow-sm border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-900 p-6 md:p-8 transition-all duration-500">
                    <div className="flex justify-between items-start mb-4">
                       <h3 className="text-sm font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-2">
                          <Sparkles size={16} />
                          Enhanced Version ({selectedStyle})
                       </h3>
                       <button 
                          onClick={() => copyToClipboard(result.betterPhrasing)}
                          className="text-purple-400 hover:text-purple-600 dark:text-purple-500 dark:hover:text-purple-300 transition-colors"
                          title="Copy to clipboard"
                       >
                          <Copy size={16} />
                       </button>
                    </div>
                    
                    <div className="text-xl leading-8 text-slate-800 dark:text-slate-100 font-serif italic">
                       {result.betterPhrasing}
                    </div>
                  </div>
                )}

                {/* Better Phrasing Sections */}
                {activeTab === 'better' && (
                    <>
                    {/* Explanation */}
                    <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2 font-serif text-lg">
                        <Book size={20} className="text-purple-600 dark:text-purple-400" />
                        Stylistic Insight
                      </h4>
                      <p className="text-purple-900/80 dark:text-purple-100/80 text-base leading-relaxed font-medium">
                        {result.betterPhrasingExplanation}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-purple-500 dark:text-purple-400 uppercase tracking-wider font-bold">
                         <Sparkles size={12} />
                         Pro Tip
                      </div>
                      <p className="text-sm text-purple-800/70 dark:text-purple-200/60 mt-1">
                         Notice how the enhanced version improves flow and clarity compared to a direct translation or literal correction.
                      </p>
                    </div>

                    {/* Vocabulary & Idioms Grid */}
                    {result.enhancedVocabulary && result.enhancedVocabulary.length > 0 && (
                        <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                                <BookOpen size={20} className="text-purple-600 dark:text-purple-400" />
                                Vocabulary & Idioms
                            </h4>
                            <div className="grid gap-4 md:grid-cols-2">
                                {result.enhancedVocabulary.map((item, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/30 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100">{item.term}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                {item.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                                            {item.definition}
                                        </p>
                                        <div className="text-xs text-purple-700 dark:text-purple-300 italic bg-purple-50 dark:bg-purple-900/20 p-2.5 rounded-lg border border-purple-100 dark:border-purple-900/30">
                                            "{item.example}"
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    </>
                )}
                
                <div className="text-center text-slate-400 dark:text-slate-500 text-sm italic">
                  💡 Tip: Hover over highlighted words to see why they were changed. Select any word to define it.
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

        {/* Overlays */}
        {selection && (
          <Tooltip 
            selection={selection} 
            onLookup={handleDefine} 
            onClose={() => setSelection(null)}
            isLoading={isDefining}
          />
        )}

        {currentDefinition && (
          <DefinitionCard 
            definition={currentDefinition}
            onClose={() => setCurrentDefinition(null)}
            onSave={handleSaveWord}
            isSaved={savedWords.some(w => w.word === currentDefinition.word)}
          />
        )}

        <DictionarySidebar 
          isOpen={isDictionaryOpen} 
          onClose={() => setIsDictionaryOpen(false)}
          words={savedWords}
          onRemove={handleRemoveWord}
        />
    </div>
  );
};
