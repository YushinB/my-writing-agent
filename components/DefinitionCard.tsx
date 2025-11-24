import React from 'react';
import { Plus, Check, Volume2 } from 'lucide-react';
import { WordDefinition } from '../types';

interface DefinitionCardProps {
  definition: WordDefinition;
  onSave: (def: WordDefinition) => void;
  isSaved: boolean;
  onClose: () => void;
}

export const DefinitionCard: React.FC<DefinitionCardProps> = ({ definition, onSave, isSaved, onClose }) => {
  const handleSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(definition.word);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                {definition.word}
                <button onClick={handleSpeak} className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                    <Volume2 size={20} />
                </button>
              </h2>
              <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold mt-1">
                {definition.partOfSpeech}
              </span>
            </div>
            <button 
              onClick={() => onSave(definition)}
              disabled={isSaved}
              className={`p-2 rounded-full transition-all ${
                isSaved 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                  : 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50'
              }`}
            >
              {isSaved ? <Check size={20} /> : <Plus size={20} />}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                {definition.definition}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Example</p>
              <p className="text-slate-700 dark:text-slate-300 italic">"{definition.exampleSentence}"</p>
            </div>

            {definition.synonyms.length > 0 && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">Synonyms</p>
                <div className="flex flex-wrap gap-2">
                  {definition.synonyms.map((syn) => (
                    <span key={syn} className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-600 dark:text-slate-300">
                      {syn}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};