import React from 'react';
import { Sparkles, Book, Copy } from 'lucide-react';
import { CorrectionResponse as AnalysisResult } from '../../../types';

import {
  ResultCard,
  CardHeader,
  CardTitle,
  CardContent,
  InfoList,
  InfoListItem,
  IconButton,
} from '../../Common/Styled';

import VocabularyList from './VocabularyList';

interface PhrasingViewProps {
  result: AnalysisResult;
  selectedStyle: string;
  onCopy: (text: string) => void;
  onAddVocabToDictionary: (term: string, definition: string, example: string) => void;
}

const PhrasingView: React.FC<PhrasingViewProps> = ({
  result,
  selectedStyle,
  onCopy,
  onAddVocabToDictionary,
}) => {
  return (
    <>
      {/* Enhanced Version */}
      <ResultCard $gradient="linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)" $border="#d8b4fe">
        <CardHeader $color="#7c3aed">
          <CardTitle>
            <Sparkles size={16} />
            Enhanced Version ({selectedStyle.toUpperCase()})
          </CardTitle>
          <IconButton onClick={() => onCopy(result.betterPhrasing)} title="Copy">
            <Copy size={16} />
          </IconButton>
        </CardHeader>
        <CardContent style={{ fontStyle: 'italic', fontFamily: 'serif' }}>
          {result.betterPhrasing}
        </CardContent>
      </ResultCard>

      {/* Stylistic Insight */}
      {result.betterPhrasingExplanation && (
        <ResultCard>
          <CardHeader $color="#8b5cf6">
            <CardTitle>
              <Book size={16} />
              Stylistic Insight
            </CardTitle>
          </CardHeader>
          <CardContent style={{ fontSize: '14px' }}>
            {result.betterPhrasingExplanation}
          </CardContent>
          {result.keyImprovements && result.keyImprovements.length > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#f3e8ff',
              borderRadius: '8px',
              borderLeft: '4px solid #8b5cf6'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#7c3aed',
                marginBottom: '8px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                💜 Key Improvements
              </div>
              <InfoList>
                {result.keyImprovements.map((improvement, idx) => (
                  <InfoListItem key={idx} style={{ color: '#6b21a8' }}>{improvement}</InfoListItem>
                ))}
              </InfoList>
            </div>
          )}
        </ResultCard>
      )}

      {/* Vocabulary & Idioms */}
      {result.enhancedVocabulary && (
        <VocabularyList
          vocabulary={result.enhancedVocabulary}
          onAddToDictionary={onAddVocabToDictionary}
        />
      )}
    </>
  );
};

export default PhrasingView;
