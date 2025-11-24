import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  PenLine, Book, Sun, Moon, LogOut, Sparkles,
  Briefcase, Coffee, Terminal, Feather, GraduationCap, Hash,
  AlertCircle, ArrowDown, CheckCircle2, Copy, Award, BarChart3,
  Zap, ArrowUpRight, Eraser
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setInputText } from '../../store/slices/editorSlice';
import { analyzeText, getLiveSuggestion as getLiveSuggestionAction } from '../../store/slices/analysisSlice';
import { toggleTheme } from '../../store/slices/settingsSlice';
import { logout } from '../../store/slices/authSlice';
import geminiService from '../../services/gemini';
import { WritingStyle, LiveSuggestion } from '../../types';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// Layout
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  z-index: 20;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const LogoText = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  font-family: serif;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all ${({ theme }) => theme.transitions.base};
  border: none;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surfaceHover};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const SignOutButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  transition: all ${({ theme }) => theme.transitions.base};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  &:hover {
    color: #ef4444;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

// Editor Panel
const EditorPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  position: relative;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
`;

const PanelLabel = styled.div`
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

const HeaderButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const LiveModeButton = styled.button<{ $active?: boolean }>`
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

const EditorAreaWrapper = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const EditorArea = styled.textarea`
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

const LiveSuggestionCard = styled.div<{ $show?: boolean }>`
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

const SuggestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const SuggestionLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
  color: #f59e0b;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const SuggestionText = styled.p`
  color: #78350f;
  font-weight: 500;
  margin: ${({ theme }) => theme.spacing.sm} 0;
  line-height: 1.6;
`;

const ApplyButton = styled.button`
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

const EditorFooter = styled.div`
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
`;

const StylePills = styled.div`
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

const StylePill = styled.button<{ $active?: boolean }>`
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

const PrimaryButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: 600;
  transition: all ${({ theme }) => theme.transitions.base};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  cursor: pointer;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #94a3b8;
  }
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: ${spin} 1s ease-in-out infinite;
`;

// Output Panel
const OutputPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const OutputHeader = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
`;

const TabButton = styled.button<{ $active?: boolean; $color?: string }>`
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

const OutputContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.xl};
  animation: ${fadeIn} 0.5s ease;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${({ theme}) => theme.colors.textSecondary};
  text-align: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const EmptyIcon = styled.div`
  width: 80px;
  height: 80px;
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
`;

const ResultCard = styled.div<{ $gradient?: string; $border?: string }>`
  background: ${({ $gradient, theme }) => $gradient || theme.colors.surface};
  border: 1px solid ${({ $border, theme }) => $border || theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  animation: ${fadeIn} 0.5s ease;
`;

const CardHeader = styled.div<{ $color?: string }>`
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

const CardTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const CardContent = styled.div`
  font-size: 20px;
  line-height: 1.8;
  color: ${({ theme }) => theme.colors.text};
`;

const CorrectionSegment = styled.span<{ $isCorrection?: boolean; $isOriginal?: boolean }>`
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

const Tooltip = styled.span`
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

const SegmentWrapper = styled.span`
  position: relative;
  display: inline-block;

  &:hover ${Tooltip} {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(-4px);
    pointer-events: none;
  }
`;

const ArrowIndicator = styled.div`
  text-align: center;
  margin: ${({ theme }) => theme.spacing.lg} 0;
  color: #94a3b8;
  animation: ${bounce} 2s ease-in-out infinite;
`;

const IELTSCard = styled(ResultCard)`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #7dd3fc;
`;

const IELTSHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: rgba(14, 165, 233, 0.1);
  border-bottom: 1px solid #7dd3fc;
  border-radius: ${({ theme }) => theme.borderRadius.lg} ${({ theme }) => theme.borderRadius.lg} 0 0;
  margin: -${({ theme }) => theme.spacing.xl} -${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
`;

const IELTSTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: #0369a1;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 700;
  margin: 0;
`;

const IELTSBadge = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  text-transform: uppercase;
  color: #0369a1;
  background-color: white;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid #7dd3fc;
`;

const IELTSContent = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xl};
  align-items: center;
`;

const ScoreCircle = styled.div`
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

const ScoreValue = styled.div`
  font-size: 48px;
  font-weight: 900;
  color: #0284c7;
`;

const ScoreLabel = styled.div`
  font-size: 10px;
  text-transform: uppercase;
  color: #0369a1;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const CriteriaList = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const CriterionItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CriterionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CriterionName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const CriterionScore = styled.span<{ $score?: number }>`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  color: ${({ $score }) =>
    $score && $score >= 8 ? '#10b981' :
    $score && $score >= 6.5 ? '#3b82f6' :
    $score && $score >= 5 ? '#f59e0b' : '#ef4444'
  };
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $score?: number }>`
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

const CriterionFeedback = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  margin: 0;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
`;

const InfoCard = styled.div<{ $color?: string }>`
  background-color: ${({ $color }) =>
    $color === 'blue' ? '#eff6ff' : '#ecfdf5'};
  border: 1px solid ${({ $color }) =>
    $color === 'blue' ? '#bfdbfe' : '#a7f3d0'};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const InfoTitle = styled.h4<{ $color?: string }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ $color }) =>
    $color === 'blue' ? '#1e40af' : '#065f46'};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: 600;
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`;

const InfoText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: #475569;
  line-height: 1.6;
  margin: 0;
`;

const InfoList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const InfoListItem = styled.li`
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

const VocabItem = styled.div`
  background-color: #fafafa;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  &:last-child {
    margin-bottom: 0;
  }
`;

const VocabHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const VocabTerm = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #8b5cf6;
`;

const VocabBadge = styled.span`
  font-size: 10px;
  text-transform: uppercase;
  background-color: #f3e8ff;
  color: #7c3aed;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
`;

const VocabDetail = styled.div`
  font-size: 13px;
  color: #64748b;
  margin-bottom: 6px;
  line-height: 1.5;

  strong {
    color: #475569;
  }
`;

const VocabExample = styled.div`
  font-size: 13px;
  color: #64748b;
  font-style: italic;
  line-height: 1.5;

  strong {
    color: #475569;
  }
`;

const WritingStudio: React.FC = () => {
  const dispatch = useAppDispatch();
  const { inputText } = useAppSelector((state) => state.editor);
  const { result, loading, error } = useAppSelector((state) => state.analysis);
  const { theme: currentTheme } = useAppSelector((state) => state.settings);

  const [selectedStyle, setSelectedStyle] = useState<WritingStyle>('formal');
  const [liveMode, setLiveMode] = useState(false);
  const [liveSuggestion, setLiveSuggestion] = useState<LiveSuggestion | null>(null);
  const [isGettingSuggestion, setIsGettingSuggestion] = useState(false);
  const [analysisType, setAnalysisType] = useState<'grammar' | 'phrasing'>('grammar');

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const styleOptions: { id: WritingStyle; label: string; icon: React.ReactNode }[] = [
    { id: 'formal', label: 'Formal', icon: <Briefcase size={14} /> },
    { id: 'casual', label: 'Casual', icon: <Coffee size={14} /> },
    { id: 'technical', label: 'Technical', icon: <Terminal size={14} /> },
    { id: 'storytelling', label: 'Story', icon: <Feather size={14} /> },
    { id: 'academic', label: 'Academic', icon: <GraduationCap size={14} /> },
    { id: 'blog', label: 'Blog', icon: <Hash size={14} /> },
  ];

  // Live Suggestion Effect
  useEffect(() => {
    if (!liveMode || !inputText.trim()) {
      setLiveSuggestion(null);
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setIsGettingSuggestion(true);
    typingTimeoutRef.current = setTimeout(async () => {
      try {
        if (inputText.length > 5) {
          const suggestion = await geminiService.getLiveSuggestion(inputText, 'gemini-2.5-flash');
          if (suggestion && suggestion.suggestion !== suggestion.originalFragment) {
            setLiveSuggestion(suggestion);
          } else {
            setLiveSuggestion(null);
          }
        }
      } catch (e) {
        console.error("Live suggestion error:", e);
      } finally {
        setIsGettingSuggestion(false);
      }
    }, 1200);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [inputText, liveMode]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setInputText(e.target.value));
  };

  const handleAnalyze = () => {
    if (inputText.trim()) {
      dispatch(analyzeText({
        text: inputText,
        model: 'gemini-2.5-flash' as any,
        style: selectedStyle as any
      }));
    }
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleSignOut = () => {
    dispatch(logout());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const applySuggestion = () => {
    if (!liveSuggestion) return;
    const lastIndex = inputText.lastIndexOf(liveSuggestion.originalFragment);
    if (lastIndex !== -1) {
      const newText = inputText.substring(0, lastIndex) + liveSuggestion.suggestion;
      dispatch(setInputText(newText));
      setLiveSuggestion(null);
    }
  };

  return (
    <Container>
      <Header>
        <Logo>
          <LogoIcon>
            <PenLine size={24} />
          </LogoIcon>
          <LogoText>ProsePolish</LogoText>
        </Logo>
        <HeaderActions>
          <IconButton onClick={handleThemeToggle} title="Toggle theme">
            {currentTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>
          <IconButton title="Dictionary">
            <Book size={20} />
          </IconButton>
          <SignOutButton onClick={handleSignOut}>
            Sign Out
          </SignOutButton>
        </HeaderActions>
      </Header>

      <MainContent>
        <EditorPanel>
          <PanelHeader>
            <PanelLabel>Original Text</PanelLabel>
            <HeaderButtons>
              <LiveModeButton $active={liveMode} onClick={() => setLiveMode(!liveMode)}>
                <Zap size={14} />
                Live Mode {liveMode ? 'ON' : 'OFF'}
              </LiveModeButton>
              {inputText && (
                <IconButton onClick={() => dispatch(setInputText(''))} title="Clear text">
                  <Eraser size={16} />
                </IconButton>
              )}
            </HeaderButtons>
          </PanelHeader>

          <EditorAreaWrapper>
            <EditorArea
              value={inputText}
              onChange={handleTextChange}
              placeholder="Type your text here..."
              spellCheck={false}
            />

            {/* Live Suggestion Card */}
            <LiveSuggestionCard $show={!!liveSuggestion}>
              {liveSuggestion && (
                <>
                  <SuggestionHeader>
                    <SuggestionLabel>
                      <Sparkles size={12} />
                      Suggestion ({liveSuggestion.type})
                    </SuggestionLabel>
                    <span style={{ fontSize: '12px', color: '#78350f' }}>
                      {liveSuggestion.reason}
                    </span>
                  </SuggestionHeader>
                  <SuggestionText>{liveSuggestion.suggestion}</SuggestionText>
                  <ApplyButton onClick={applySuggestion}>
                    Apply Change <ArrowUpRight size={14} />
                  </ApplyButton>
                </>
              )}
            </LiveSuggestionCard>
          </EditorAreaWrapper>

          <EditorFooter>
            <StylePills>
              {styleOptions.map((style) => (
                <StylePill
                  key={style.id}
                  $active={selectedStyle === style.id}
                  onClick={() => setSelectedStyle(style.id)}
                >
                  {style.icon}
                  {style.label}
                </StylePill>
              ))}
            </StylePills>

            <PrimaryButton
              onClick={handleAnalyze}
              disabled={loading || !inputText.trim()}
            >
              {loading ? (
                <>
                  <Spinner />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Polish Writing ({selectedStyle})
                </>
              )}
            </PrimaryButton>
          </EditorFooter>
        </EditorPanel>

        <OutputPanel>
          <OutputHeader>
            <TabButton
              $active={analysisType === 'grammar'}
              onClick={() => setAnalysisType('grammar')}
            >
              <CheckCircle2 size={16} />
              Grammar Check
            </TabButton>
            <TabButton
              $active={analysisType === 'phrasing'}
              $color="purple"
              onClick={() => setAnalysisType('phrasing')}
            >
              <Sparkles size={16} />
              Better Phrasing
            </TabButton>
          </OutputHeader>

          <OutputContent>
            {!result && !loading && !error && (
              <EmptyState>
                <EmptyIcon>→</EmptyIcon>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>
                  Your polished text will appear here.
                </div>
              </EmptyState>
            )}

            {error && (
              <ResultCard $border="#fca5a5">
                <CardHeader $color="#dc2626">
                  <CardTitle>
                    <AlertCircle size={16} />
                    ERROR
                  </CardTitle>
                </CardHeader>
                <CardContent style={{ color: '#dc2626', fontSize: '14px' }}>{error}</CardContent>
              </ResultCard>
            )}

            {result && !loading && analysisType === 'grammar' && (
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
                    {result.segments.map((segment, idx) => (
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
                    <IconButton onClick={() => copyToClipboard(result.correctedText)} title="Copy">
                      <Copy size={16} />
                    </IconButton>
                  </CardHeader>
                  <CardContent>
                    {result.segments.map((segment, idx) => (
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
                {result.ieltsAssessment && (
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
                        <ScoreValue>{result.ieltsAssessment.overallBand.toFixed(1)}</ScoreValue>
                        <ScoreLabel>Overall Band</ScoreLabel>
                      </ScoreCircle>
                      <CriteriaList>
                        {result.ieltsAssessment.criteria.slice(0, 2).map((criterion, idx) => (
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
                    {result.ieltsAssessment.generalFeedback && (
                      <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: '#e0f2fe',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#0369a1'
                      }}>
                        {result.ieltsAssessment.generalFeedback}
                      </div>
                    )}
                  </IELTSCard>
                )}

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
                      {result.keyImprovements.map((imp, idx) => (
                        <InfoListItem key={idx}>{imp}</InfoListItem>
                      ))}
                    </InfoList>
                  </InfoCard>
                </InfoGrid>
              </>
            )}

            {result && !loading && analysisType === 'phrasing' && (
              <>
                {/* Enhanced Version */}
                <ResultCard $gradient="linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)" $border="#d8b4fe">
                  <CardHeader $color="#7c3aed">
                    <CardTitle>
                      <Sparkles size={16} />
                      Enhanced Version ({selectedStyle.toUpperCase()})
                    </CardTitle>
                    <IconButton onClick={() => copyToClipboard(result.betterPhrasing)} title="Copy">
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
                {result.enhancedVocabulary && result.enhancedVocabulary.length > 0 && (
                  <ResultCard>
                    <CardHeader $color="#8b5cf6">
                      <CardTitle>
                        <Book size={16} />
                        Vocabulary & Idioms
                      </CardTitle>
                    </CardHeader>
                    <div>
                      {result.enhancedVocabulary.map((item, idx) => (
                        <VocabItem key={idx}>
                          <VocabHeader>
                            <VocabTerm>{item.term}</VocabTerm>
                            <VocabBadge>{item.type.replace('_', ' ')}</VocabBadge>
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
                )}
              </>
            )}
          </OutputContent>
        </OutputPanel>
      </MainContent>
    </Container>
  );
};

export default WritingStudio;
