import React from 'react';
import { Briefcase, Coffee, Terminal, Feather, GraduationCap, Hash } from 'lucide-react';
import { WritingStyle } from '../../../types';
import { StylePills, StylePill } from '../Styled';

interface StyleSelectorProps {
  selectedStyle: WritingStyle;
  onStyleChange: (style: WritingStyle) => void;
}

const styleOptions: { id: WritingStyle; label: string; icon: React.ReactNode }[] = [
  { id: 'formal', label: 'Formal', icon: <Briefcase size={14} /> },
  { id: 'casual', label: 'Casual', icon: <Coffee size={14} /> },
  { id: 'technical', label: 'Technical', icon: <Terminal size={14} /> },
  { id: 'storytelling', label: 'Story', icon: <Feather size={14} /> },
  { id: 'academic', label: 'Academic', icon: <GraduationCap size={14} /> },
  { id: 'blog', label: 'Blog', icon: <Hash size={14} /> },
];

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onStyleChange }) => {
  return (
    <StylePills>
      {styleOptions.map((style) => (
        <StylePill
          key={style.id}
          $active={selectedStyle === style.id}
          onClick={() => onStyleChange(style.id)}
        >
          {style.icon}
          {style.label}
        </StylePill>
      ))}
    </StylePills>
  );
};

export default StyleSelector;
