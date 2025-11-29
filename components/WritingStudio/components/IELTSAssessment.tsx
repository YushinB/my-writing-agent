import React from 'react';
import { Award } from 'lucide-react';
import { IeltsAssessment as IELTSAssessmentType } from '../../../types';
import {
  IELTSCard,
  IELTSHeader,
  IELTSTitle,
  IELTSBadge,
  IELTSContent,
  ScoreCircle,
  ScoreValue,
  ScoreLabel,
  CriteriaList,
  CriterionItem,
  CriterionHeader,
  CriterionName,
  CriterionScore,
  ProgressBar,
  ProgressFill,
  CriterionFeedback,
} from '../Styled';

interface IELTSAssessmentProps {
  assessment: IELTSAssessmentType;
}

const IELTSAssessment: React.FC<IELTSAssessmentProps> = ({ assessment }) => {
  return (
    <IELTSCard>
      <IELTSHeader>
        <IELTSTitle>
          <Award size={22} />
          IELTS Assessment
        </IELTSTitle>
        <IELTSBadge>Academic Level</IELTSBadge>
      </IELTSHeader>
      <IELTSContent>
        <ScoreCircle>
          <ScoreValue>{assessment.overallBand.toFixed(1)}</ScoreValue>
          <ScoreLabel>Overall Band</ScoreLabel>
        </ScoreCircle>
        <CriteriaList>
          {assessment.criteria.slice(0, 2).map((criterion, idx) => (
            <CriterionItem key={idx}>
              <CriterionHeader>
                <CriterionName>{criterion.name}</CriterionName>
                <CriterionScore $score={criterion.score}>{criterion.score}</CriterionScore>
              </CriterionHeader>
              <ProgressBar>
                <ProgressFill $score={criterion.score} />
              </ProgressBar>
              <CriterionFeedback>{criterion.feedback}</CriterionFeedback>
            </CriterionItem>
          ))}
        </CriteriaList>
      </IELTSContent>
      {assessment.generalFeedback && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#e0f2fe',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#0369a1'
        }}>
          {assessment.generalFeedback}
        </div>
      )}
    </IELTSCard>
  );
};

export default IELTSAssessment;
