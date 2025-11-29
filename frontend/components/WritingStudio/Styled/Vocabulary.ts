import styled from 'styled-components';

export const VocabItem = styled.div`
  background-color: #fafafa;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  transition: all ${({ theme }) => theme.transitions.base};
  cursor: pointer;
  position: relative;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background-color: #f3e8ff;
    transform: translateX(4px);
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

export const VocabHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  justify-content: space-between;
`;

export const AddVocabButton = styled.button`
  padding: 4px 10px;
  background-color: #8b5cf6;
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;

  ${VocabItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background-color: #7c3aed;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const VocabTerm = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #8b5cf6;
`;

export const VocabPronunciation = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: #64748b;
  font-family: 'Segoe UI', 'Arial Unicode MS', sans-serif;
  margin-left: ${({ theme }) => theme.spacing.xs};
  font-style: italic;
`;

export const VocabBadge = styled.span`
  font-size: 10px;
  text-transform: uppercase;
  background-color: #f3e8ff;
  color: #7c3aed;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
`;

export const VocabDetail = styled.div`
  font-size: 13px;
  color: #64748b;
  margin-bottom: 6px;
  line-height: 1.5;

  strong {
    color: #475569;
  }
`;

export const VocabExample = styled.div`
  font-size: 13px;
  color: #64748b;
  font-style: italic;
  line-height: 1.5;

  strong {
    color: #475569;
  }
`;
