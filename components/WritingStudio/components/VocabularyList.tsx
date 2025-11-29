import React from 'react';
import { Book, BookmarkPlus } from 'lucide-react';
import { VocabularyItem } from '../../../types';
import {
  ResultCard,
  CardHeader,
  CardTitle,
} from '../../Common/Styled';

import {
  VocabItem,
  VocabHeader,
  VocabTerm,
  VocabPronunciation,
  VocabBadge,
  AddVocabButton,
  VocabDetail,
  VocabExample,
} from '../Styled';

interface VocabularyListProps {
  vocabulary: VocabularyItem[];
  onAddToDictionary: (term: string, definition: string, example: string) => void;
}

const VocabularyList: React.FC<VocabularyListProps> = ({ vocabulary, onAddToDictionary }) => {
  if (!vocabulary || vocabulary.length === 0) return null;

  return (
    <ResultCard>
      <CardHeader $color="#8b5cf6">
        <CardTitle>
          <Book size={16} />
          Vocabulary & Idioms
        </CardTitle>
      </CardHeader>
      <div>
        {vocabulary.map((item: VocabularyItem, idx: number) => (
          <VocabItem key={idx}>
            <VocabHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <VocabTerm>{item.term}</VocabTerm>
                  {item.pronunciation && (
                    <VocabPronunciation>/{item.pronunciation}/</VocabPronunciation>
                  )}
                </div>
                <VocabBadge>{item.type.replace('_', ' ')}</VocabBadge>
              </div>
                <AddVocabButton
                  onClick={() => onAddToDictionary(item.term, item.definition, item.example)}
                title="Add to dictionary"
              >
                <BookmarkPlus size={14} />
                Add
              </AddVocabButton>
            </VocabHeader>
            <VocabDetail>
              <strong>Definition:</strong> {item.definition}
            </VocabDetail>
            <VocabExample>
              <strong>Example:</strong> "{item.example}"
            </VocabExample>
          </VocabItem>
        ))}
      </div>
    </ResultCard>
  );
};

export default VocabularyList;
