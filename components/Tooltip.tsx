import React from 'react';
import { BookOpen, X } from 'lucide-react';
import { TextSelection } from '../types';

interface TooltipProps {
  selection: TextSelection;
  onLookup: () => void;
  onClose: () => void;
  isLoading: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ selection, onLookup, onClose, isLoading }) => {
  // Calculate position to center above the selection
  const top = selection.rect.top + window.scrollY - 50; // 50px above
  const left = selection.rect.left + window.scrollX + (selection.rect.width / 2);

  return (
    <div 
      className="fixed z-50 flex flex-col items-center animate-in fade-in zoom-in duration-200"
      style={{ top: `${top}px`, left: `${left}px`, transform: 'translateX(-50%)' }}
    >
      <div className="bg-slate-800 dark:bg-slate-700 text-white rounded-lg shadow-xl px-3 py-2 flex items-center gap-2 mb-2 pointer-events-auto border border-transparent dark:border-slate-600">
        <button 
          onClick={onLookup}
          disabled={isLoading}
          className="flex items-center gap-2 hover:text-brand-300 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <BookOpen size={16} />
          )}
          <span className="font-medium text-sm">Define "{selection.text.length > 15 ? selection.text.substring(0,12) + '...' : selection.text}"</span>
        </button>
        <div className="w-px h-4 bg-slate-600 dark:bg-slate-500 mx-1" />
        <button onClick={onClose} className="hover:text-red-300 transition-colors">
          <X size={16} />
        </button>
      </div>
      {/* Triangle pointer */}
      <div className="w-3 h-3 bg-slate-800 dark:bg-slate-700 dark:border-b dark:border-r dark:border-slate-600 rotate-45 transform -translate-y-3"></div>
    </div>
  );
};