import styled from 'styled-components';
import { fadeIn } from '../../Common/Styled/animations';

export const WordPopover = styled.div<{ $visible?: boolean; $x?: number; $y?: number }>`
  position: fixed;
  left: ${({ $x }) => $x || 0}px;
  top: ${({ $y }) => $y || 0}px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  min-width: 320px;
  max-width: 400px;
  z-index: 1000;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  visibility: ${({ $visible }) => $visible ? 'visible' : 'hidden'};
  transform: ${({ $visible }) => $visible ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.2s ease;
  animation: ${({ $visible }) => $visible ? fadeIn : 'none'} 0.2s ease;
`;

export const PopoverHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const PopoverWord = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
`;

export const PopoverPartOfSpeech = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: 600;
  text-transform: uppercase;
`;

export const PopoverDefinition = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
`;

export const PopoverExample = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  font-style: italic;
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
`;

export const PopoverSynonyms = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const SynonymTag = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: #7c3aed;
  background-color: #f3e8ff;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-weight: 500;
`;

export const PopoverActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const PopoverButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ $variant, theme }) =>
    $variant === 'primary' ? theme.colors.primary : 'transparent'};
  color: ${({ $variant, theme }) =>
    $variant === 'primary' ? 'white' : theme.colors.textSecondary};
  border: 1px solid ${({ $variant, theme }) =>
    $variant === 'primary' ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};

  &:hover {
    background-color: ${({ $variant, theme }) =>
      $variant === 'primary' ? theme.colors.primaryHover : theme.colors.surfaceHover};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
