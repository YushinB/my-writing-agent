import React from 'react';
import { AlertCircle, ArrowDown, CheckCircle2, Copy, BarChart3 } from 'lucide-react';
import { CorrectionResponse as AnalysisResult, TextSegment } from '../../../types';
import {
  ResultCard,
  CardHeader,
  CardTitle,
  CardContent,
  InfoCard,
  InfoTitle,
  InfoText,
  InfoList,
  InfoListItem,
  IconButton,
} from '../../Common/Styled';

import {
  CorrectionSegment,
  SegmentWrapper,
  Tooltip,
  ArrowIndicator,
  InfoGrid,
} from '../Styled';
import IELTSAssessment from './IELTSAssessment';

interface GrammarCheckViewProps {
  result: AnalysisResult;
  onCopy: (text: string) => void;
}

const GrammarCheckView: React.FC<GrammarCheckViewProps> = ({ result, onCopy }) => {
  return (
    <>
      {/* Original with Issues */}
      <ResultCard $gradient="linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)" $border="#fca5a5">
        <CardHeader $color="#dc2626">
          <CardTitle>
            <AlertCircle size={16} />
            Original with Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result.segments.map((segment: TextSegment, idx: number) => (
            segment.isCorrection ? (
              <CorrectionSegment
                key={idx}
                $isOriginal
                title={`Suggest: ${segment.text}`}
              >
                {segment.originalText}
              </CorrectionSegment>
            ) : (
              <span key={idx} style={{ opacity: 0.7 }}>{segment.text}</span>
            )
          ))}
        </CardContent>
      </ResultCard>

      <ArrowIndicator>
        <ArrowDown size={24} />
      </ArrowIndicator>

      {/* Corrected Version */}
      <ResultCard>
        <CardHeader $color="#16a34a">
          <CardTitle>
            <CheckCircle2 size={16} />
            Corrected Version
          </CardTitle>
          <IconButton onClick={() => onCopy(result.correctedText)} title="Copy">
            <Copy size={16} />
          </IconButton>
        </CardHeader>
        <CardContent>
          {result.segments.map((segment: TextSegment, idx: number) => (
            segment.isCorrection ? (
              <SegmentWrapper key={idx}>
                <CorrectionSegment $isCorrection>{segment.text}</CorrectionSegment>
                <Tooltip>
                  <span className="tooltip-label">Original</span>
                  <span className="tooltip-original">"{segment.originalText}"</span>
                  <span className="tooltip-label">Reason</span>
                  <span className="tooltip-reason">{segment.explanation}</span>
                </Tooltip>
              </SegmentWrapper>
            ) : (
              <span key={idx}>{segment.text}</span>
            )
          ))}
        </CardContent>
      </ResultCard>

      {/* IELTS Assessment */}
      {result.ieltsAssessment && <IELTSAssessment assessment={result.ieltsAssessment} />}

      {/* Summary & Improvements */}
      <InfoGrid>
        <InfoCard $color="blue">
          <InfoTitle $color="blue">
            <CheckCircle2 size={18} />
            Summary
          </InfoTitle>
          <InfoText>{result.explanation}</InfoText>
        </InfoCard>
        <InfoCard>
          <InfoTitle>
            <BarChart3 size={18} />
            Key Improvements
          </InfoTitle>
          <InfoList>
            {result.keyImprovements.map((imp: string, idx: number) => (
              <InfoListItem key={idx}>{imp}</InfoListItem>
            ))}
          </InfoList>
        </InfoCard>
      </InfoGrid>
    </>
  );
};

export default GrammarCheckView;
