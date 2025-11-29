import styled from 'styled-components';
import { fadeIn, bounce } from '../../Common/Styled/animations';

export const OutputPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const OutputHeader = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const TabButton = styled.button<{ $active?: boolean; $color?: string }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ $active, $color }) => $active ? ($color === 'purple' ? '#f3e8ff' : '#dbeafe') : 'transparent'};
  color: ${({ $active, $color }) => $active ? ($color === 'purple' ? '#7c3aed' : '#2563eb') : '#64748b'};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  transition: all ${({ theme }) => theme.transitions.base};
  cursor: pointer;

  &:hover {
    background-color: ${({ $active, $color }) =>
      $active ? ($color === 'purple' ? '#f3e8ff' : '#dbeafe') : '#f1f5f9'};
  }
`;

export const OutputContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.xl};
  animation: ${fadeIn} 0.5s ease;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${({ theme}) => theme.colors.textSecondary};
  text-align: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const EmptyIcon = styled.div`
  width: 80px;
  height: 80px;
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
`;

export const ArrowIndicator = styled.div`
  text-align: center;
  margin: ${({ theme }) => theme.spacing.lg} 0;
  color: #94a3b8;
  animation: ${bounce} 2s ease-in-out infinite;
`;

export const CorrectionSegment = styled.span<{ $isCorrection?: boolean; $isOriginal?: boolean }>`
  position: relative;
  display: inline;
  background-color: ${({ $isCorrection, $isOriginal }) =>
    $isOriginal ? '#fee2e2' : $isCorrection ? '#dcfce7' : 'transparent'};
  color: ${({ $isCorrection, $isOriginal }) =>
    $isOriginal ? '#dc2626' : $isCorrection ? '#15803d' : 'inherit'};
  padding: ${({ $isCorrection, $isOriginal }) => ($isCorrection || $isOriginal) ? '2px 6px' : '0'};
  border-radius: 4px;
  text-decoration: ${({ $isOriginal }) => $isOriginal ? 'line-through' : 'none'};
  border-bottom: ${({ $isCorrection }) => $isCorrection ? '2px solid #22c55e' : 'none'};
  cursor: ${({ $isCorrection, $isOriginal }) => ($isCorrection || $isOriginal) ? 'help' : 'default'};

  &:hover::after {
    content: attr(title);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: #1e293b;
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    white-space: nowrap;
    z-index: 1000;
    margin-bottom: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }
`;

export const Tooltip = styled.span`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: 256px;
  padding: 12px;
  background-color: #0f172a;
  color: #f8fafc;
  font-size: 13px;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.35);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  z-index: 1000;
  text-align: left;
  line-height: 1.4;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid #0f172a;
  }

  .tooltip-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    margin-bottom: 6px;
    letter-spacing: 0.6px;
  }

  .tooltip-original {
    display: block;
    font-weight: 600;
    color: #fca5a5;
    text-decoration: line-through;
    margin-bottom: 8px;
  }

  .tooltip-reason {
    display: block;
    color: #e6eef8;
    font-size: 13px;
  }
`;

export const SegmentWrapper = styled.span`
  position: relative;
  display: inline-block;

  &:hover ${Tooltip} {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(-4px);
    pointer-events: none;
  }
`;
