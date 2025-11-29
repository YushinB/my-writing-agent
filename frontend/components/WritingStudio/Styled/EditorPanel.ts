import styled from 'styled-components';
import { slideUp } from '../../Common/Styled/animations';

export const EditorPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  position: relative;
`;

export const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
`;

export const PanelLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

export const HeaderButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

export const LiveModeButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  background-color: ${({ $active }) => $active ? '#fef3c7' : 'transparent'};
  color: ${({ $active }) => $active ? '#f59e0b' : '#64748b'};
  border: 1px solid ${({ $active }) => $active ? '#fbbf24' : 'transparent'};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  transition: all ${({ theme }) => theme.transitions.base};
  cursor: pointer;
  box-shadow: ${({ $active }) => $active ? '0 0 10px rgba(251, 191, 36, 0.2)' : 'none'};

  &:hover {
    background-color: ${({ $active }) => $active ? '#fef3c7' : '#f1f5f9'};
  }

  svg {
    fill: ${({ $active }) => $active ? '#f59e0b' : 'transparent'};
  }
`;

export const EditorAreaWrapper = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

export const EditorArea = styled.textarea`
  width: 100%;
  height: 100%;
  padding: ${({ theme }) => theme.spacing.xl};
  font-size: 18px;
  font-family: ${({ theme }) => theme.fonts.sans};
  line-height: 1.8;
  background-color: ${({ theme }) => theme.colors.background};
  border: none;
  color: ${({ theme }) => theme.colors.text};
  resize: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textTertiary};
  }

  &:focus {
    outline: none;
  }
`;

export const LiveSuggestionCard = styled.div<{ $show?: boolean }>`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing.xl};
  left: ${({ theme }) => theme.spacing.xl};
  right: ${({ theme }) => theme.spacing.xl};
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fbbf24;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  opacity: ${({ $show }) => $show ? 1 : 0};
  transform: translateY(${({ $show }) => $show ? 0 : '20px'});
  transition: all 0.3s ease;
  pointer-events: ${({ $show }) => $show ? 'auto' : 'none'};
  animation: ${({ $show }) => $show ? slideUp : 'none'} 0.3s ease;
`;

export const SuggestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

export const SuggestionLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
  color: #f59e0b;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const SuggestionText = styled.p`
  color: #78350f;
  font-weight: 500;
  margin: ${({ theme }) => theme.spacing.sm} 0;
  line-height: 1.6;
`;

export const ApplyButton = styled.button`
  align-self: flex-end;
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  background-color: #fbbf24;
  color: #78350f;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  &:hover {
    background-color: #f59e0b;
  }
`;

export const EditorFooter = styled.div`
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const StylePills = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  overflow-x: auto;
  padding-bottom: ${({ theme }) => theme.spacing.xs};

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.colors.border};
    border-radius: 2px;
  }
`;

export const StylePill = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.surface};
  color: ${({ $active }) => $active ? 'white' : 'inherit'};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  transition: all ${({ theme }) => theme.transitions.base};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background-color: ${({ $active, theme }) =>
      $active ? theme.colors.primaryHover : theme.colors.surfaceHover};
    transform: translateY(-1px);
  }
`;
