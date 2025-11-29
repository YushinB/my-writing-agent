import styled from 'styled-components';
import { ResultCard } from '../../Common/Styled/cards';

export const IELTSCard = styled(ResultCard)`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #7dd3fc;
`;

export const IELTSHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: rgba(14, 165, 233, 0.1);
  border-bottom: 1px solid #7dd3fc;
  border-radius: ${({ theme }) => theme.borderRadius.lg} ${({ theme }) => theme.borderRadius.lg} 0 0;
  margin: -${({ theme }) => theme.spacing.xl} -${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
`;

export const IELTSTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: #0369a1;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 700;
  margin: 0;
`;

export const IELTSBadge = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  text-transform: uppercase;
  color: #0369a1;
  background-color: white;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid #7dd3fc;
`;

export const IELTSContent = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xl};
  align-items: center;
`;

export const ScoreCircle = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  flex-shrink: 0;
`;

export const ScoreValue = styled.div`
  font-size: 48px;
  font-weight: 900;
  color: #0284c7;
`;

export const ScoreLabel = styled.div`
  font-size: 10px;
  text-transform: uppercase;
  color: #0369a1;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

export const CriteriaList = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const CriterionItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const CriterionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const CriterionName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

export const CriterionScore = styled.span<{ $score?: number }>`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  color: ${({ $score }) =>
    $score && $score >= 8 ? '#10b981' :
    $score && $score >= 6.5 ? '#3b82f6' :
    $score && $score >= 5 ? '#f59e0b' : '#ef4444'
  };
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
`;

export const ProgressFill = styled.div<{ $score?: number }>`
  height: 100%;
  width: ${({ $score }) => $score ? ($score / 9) * 100 : 0}%;
  background-color: ${({ $score }) =>
    $score && $score >= 8 ? '#10b981' :
    $score && $score >= 6.5 ? '#3b82f6' :
    $score && $score >= 5 ? '#f59e0b' : '#ef4444'
  };
  border-radius: 4px;
  transition: width 1s ease;
`;

export const CriterionFeedback = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  margin: 0;
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
`;
