import React from 'react';
import { Book, Trash2, X } from 'lucide-react';
import { SavedWord } from '../types';

interface DictionarySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  words: SavedWord[];
  onRemove: (id: string) => void;
}

export const DictionarySidebar: React.FC<DictionarySidebarProps> = ({ isOpen, onClose, words, onRemove }) => {
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      <div className={`
        fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-brand-700 dark:text-brand-400">
              <Book size={24} />
              <h2 className="text-xl font-bold">My Dictionary</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={20} className="text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-900">
            {words.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 text-center px-8">
                <Book size={48} className="mb-4 opacity-20" />
                <p>Your dictionary is empty.</p>
                <p className="text-sm mt-2">Highlight words in the correction panel to define and add them here.</p>
              </div>
            ) : (
              words.slice().reverse().map((word) => (
                <div key={word.id} className="group bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif text-lg font-bold text-slate-800 dark:text-slate-100 capitalize">{word.word}</h3>
                    <button 
                      onClick={() => onRemove(word.id)}
                      className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-full mb-2 inline-block">
                    {word.partOfSpeech}
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-3">{word.definition}</p>
                  <div className="text-xs text-slate-400 dark:text-slate-500 italic border-l-2 border-slate-200 dark:border-slate-800 pl-2">
                    "{word.exampleSentence}"
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center text-xs text-slate-400 dark:text-slate-500">
            {words.length} words saved
          </div>
        </div>
      </div>
    </>
  );
};