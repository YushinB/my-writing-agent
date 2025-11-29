import React from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { LiveSuggestion as LiveSuggestionType } from '../../../types';
import {
  LiveSuggestionCard,
  SuggestionHeader,
  SuggestionLabel,
  SuggestionText,
  ApplyButton,
} from '../Styled';

interface LiveSuggestionProps {
  suggestion: LiveSuggestionType | null;
  onApply: () => void;
}

const LiveSuggestion: React.FC<LiveSuggestionProps> = ({ suggestion, onApply }) => {
  return (
    <LiveSuggestionCard $show={!!suggestion}>
      {suggestion && (
        <>
          <SuggestionHeader>
            <SuggestionLabel>
              <Sparkles size={12} />
              Suggestion ({suggestion.type})
            </SuggestionLabel>
            <span style={{ fontSize: '12px', color: '#78350f' }}>
              {suggestion.reason}
            </span>
          </SuggestionHeader>
          <SuggestionText>{suggestion.suggestion}</SuggestionText>
          <ApplyButton onClick={onApply}>
            Apply Change <ArrowUpRight size={14} />
          </ApplyButton>
        </>
      )}
    </LiveSuggestionCard>
  );
};

export default LiveSuggestion;
