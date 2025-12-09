import React from 'react';
import { BookmarkPlus } from 'lucide-react';
import { WordDefinition } from '../../../types';
import {
  WordPopover,
  PopoverHeader,
  PopoverWord,
  PopoverPartOfSpeech,
  PopoverDefinition,
  PopoverExample,
  PopoverSynonyms,
  SynonymTag,
  PopoverActions,
  PopoverButton,
} from '../Styled';

import { LoadingSpinner } from '../../Common/Styled';

interface WordLookupPopoverProps {
  visible: boolean;
  position: { x: number; y: number };
  selectedWord: string;
  definition: WordDefinition | null;
  isLoading: boolean;
  onClose: () => void;
  onAddToDictionary: () => void;
}

const WordLookupPopover: React.FC<WordLookupPopoverProps> = ({
  visible,
  position,
  selectedWord,
  definition,
  isLoading,
  onClose,
  onAddToDictionary,
}) => {
  return (
    <WordPopover
      data-popover
      $visible={visible}
      $x={position.x}
      $y={position.y}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <LoadingSpinner size={24} />
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#64748b' }}>
            Looking up "{selectedWord}"...
          </p>
        </div>
      ) : definition ? (
        <>
          <PopoverHeader>
            <PopoverWord>{definition.word}</PopoverWord>
            <PopoverPartOfSpeech>{definition.partOfSpeech}</PopoverPartOfSpeech>
          </PopoverHeader>

          <PopoverDefinition>{definition.definition}</PopoverDefinition>

          {definition.exampleSentence && (
            <PopoverExample>"{definition.exampleSentence}"</PopoverExample>
          )}

          {definition.synonyms && definition.synonyms.length > 0 && (
            <PopoverSynonyms>
              {definition.synonyms.map((synonym, idx) => (
                <SynonymTag key={idx}>{synonym}</SynonymTag>
              ))}
            </PopoverSynonyms>
          )}

          <PopoverActions>
            <PopoverButton $variant="secondary" onClick={onClose}>
              Close
            </PopoverButton>
            <PopoverButton $variant="primary" onClick={onAddToDictionary}>
              <BookmarkPlus size={16} />
              Add to Dictionary
            </PopoverButton>
          </PopoverActions>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Could not find definition for "{selectedWord}"
          </p>
          <PopoverButton
            $variant="secondary"
            onClick={onClose}
            style={{ marginTop: '12px' }}
          >
            Close
          </PopoverButton>
        </div>
      )}
    </WordPopover>
  );
};

export default WordLookupPopover;
