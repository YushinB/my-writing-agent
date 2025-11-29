import styled from 'styled-components';
import { fadeIn } from './animations';

export const ResultCard = styled.div<{ $gradient?: string; $border?: string }>`
  background: ${({ $gradient, theme }) => $gradient || theme.colors.surface};
  border: 1px solid ${({ $border, theme }) => $border || theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  animation: ${fadeIn} 0.5s ease;
`;

export const CardHeader = styled.div<{ $color?: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ $color }) => $color || 'inherit'};
  font-weight: 700;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const CardTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const CardContent = styled.div`
  font-size: 20px;
  line-height: 1.8;
  color: ${({ theme }) => theme.colors.text};
  user-select: text;
  cursor: text;
`;

export const InfoCard = styled.div<{ $color?: string }>`
  background-color: ${({ $color }) =>
    $color === 'blue' ? '#eff6ff' : '#ecfdf5'};
  border: 1px solid ${({ $color }) =>
    $color === 'blue' ? '#bfdbfe' : '#a7f3d0'};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
`;

export const InfoTitle = styled.h4<{ $color?: string }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ $color }) =>
    $color === 'blue' ? '#1e40af' : '#065f46'};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: 600;
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`;

export const InfoText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: #475569;
  line-height: 1.6;
  margin: 0;
`;

export const InfoList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const InfoListItem = styled.li`
  display: flex;
  align-items: start;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: #475569;
  line-height: 1.6;

  &::before {
    content: '';
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: #10b981;
    margin-top: 8px;
    flex-shrink: 0;
  }
`;
