import React, { useState, useEffect, useRef, useCallback } from 'react';
import {AlertCircle, CheckCircle2, Zap, Eraser ,Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setInputText } from '../../store/slices/editorSlice';
import { analyzeText} from '../../store/slices/analysisSlice';
import { toggleTheme } from '../../store/slices/settingsSlice';
import { logout, setCurrentView } from '../../store/slices/authSlice';
import { openDictionary, openMyWords, saveWordToBackend } from '../../store/slices/dictionarySlice';
import geminiService from '../../services/gemini';
import { WritingStyle, WordDefinition, LiveSuggestion } from '../../types';
import Dictionary from '../Dictionary/Dictionary';
import MyWords from '../MyWords/MyWords';
import {AppHeader,GrammarCheckView, PhrasingView, WordLookupPopover, StyleSelector, LiveSuggestionPanel} from './components';

// Import common styled components
import {
  Container,
  MainContent,
  IconButton,
  PrimaryButton,
  Spinner,
  ResultCard,
  CardHeader,
  CardTitle,
  CardContent,
} from '../Common/Styled';

// Import WritingStudio-specific styled components
import {
  EditorPanel,
  PanelHeader,
  PanelLabel,
  HeaderButtons,
  LiveModeButton,
  EditorAreaWrapper,
  EditorArea,
  EditorFooter,
  OutputPanel,
  OutputHeader,
  TabButton,
  OutputContent,
  EmptyState,
  EmptyIcon,
} from './Styled';

const WritingStudio: React.FC = () => {
  const dispatch = useAppDispatch();
  const { inputText } = useAppSelector((state) => state.editor);
  const { result, loading, error } = useAppSelector((state) => state.analysis);
  const { theme: currentTheme } = useAppSelector((state) => state.settings);
  const { user } = useAppSelector((state) => state.auth);

  const [selectedStyle, setSelectedStyle] = useState<WritingStyle>('formal');
  const [liveMode, setLiveMode] = useState(false);
  const [liveSuggestion, setLiveSuggestion] = useState<LiveSuggestion | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isGettingSuggestion, setIsGettingSuggestion] = useState(false);
  const [analysisType, setAnalysisType] = useState<'grammar' | 'phrasing'>('grammar');

  // Word selection popover state
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [wordDefinition, setWordDefinition] = useState<WordDefinition | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLookingUpWord, _setIsLookingUpWord] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [popoverPosition, _setPopoverPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSettings = () => {
    if (user?.role === 'admin') {
      dispatch(setCurrentView('admin'));
    }
  };

  const handleOpenDictionary = () => {
    dispatch(openDictionary());
  };

  const handleOpenMyWords = () => {
    dispatch(openMyWords());
  };

  const handleOpenProfile = () => {
    dispatch(setCurrentView('profile'));
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


  // Handle adding vocabulary item to dictionary
  const handleAddVocabToDictionary = useCallback(async (term: string, _definition: string, _example: string) => {
    dispatch(saveWordToBackend({ word: term }));
  }, [dispatch]);

  // Handle adding word to dictionary
  const handleAddToDictionary = () => {
    if (wordDefinition) {
      dispatch(saveWordToBackend({ word: wordDefinition.word }));
      setPopoverVisible(false);
    }
  };

  // Close popover
  const handleClosePopover = () => {
    setPopoverVisible(false);
    setWordDefinition(null);
    setSelectedWord('');
  };

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (popoverVisible && !target.closest('[data-popover]') && !target.closest('textarea')) {
        handleClosePopover();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverVisible]);

  return (
    <Container>
      <AppHeader
        currentTheme={currentTheme}
        userRole={user?.role}
        userName={user?.name}
        userEmail={user?.email}
        userAvatar={user?.avatar}
        userDisplayName={user?.displayName}
        onThemeToggle={handleThemeToggle}
        onSettings={handleSettings}
        onOpenDictionary={handleOpenDictionary}
        onOpenMyWords={handleOpenMyWords}
        onOpenProfile={handleOpenProfile}
        onSignOut={handleSignOut}>
      </AppHeader>
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
              ref={editorRef}
              value={inputText}
              onChange={handleTextChange}
              placeholder="Type your text here..."
              spellCheck={false}
            />

            {/* Live Suggestion Card */}
            <LiveSuggestionPanel 
              suggestion={liveSuggestion}
              onApply={applySuggestion}
            ></LiveSuggestionPanel>
          </EditorAreaWrapper>

          <EditorFooter>
            <StyleSelector
              selectedStyle={selectedStyle}
              onStyleChange={(s) => setSelectedStyle(s)}
            />
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
                <GrammarCheckView 
                  result={result}
                  onCopy={copyToClipboard}>
                </GrammarCheckView>
              </>
            )}

            {result && !loading && analysisType === 'phrasing' && (
              <>
                <PhrasingView 
                  result={result}
                  selectedStyle={selectedStyle}
                  onCopy={copyToClipboard}
                  onAddVocabToDictionary={handleAddVocabToDictionary}>
                </PhrasingView>
              </>
            )}
          </OutputContent>
        </OutputPanel>
      </MainContent>

      {/* Dictionary Sidebar */}
      <Dictionary />

      {/* My Words Sidebar */}
      <MyWords />

      {/* Word Selection Popover */}
      <WordLookupPopover
        visible={popoverVisible}
        position={popoverPosition}
        selectedWord={selectedWord}
        definition={wordDefinition}
        isLoading={isLookingUpWord}
        onClose={handleClosePopover}
        onAddToDictionary={handleAddToDictionary}
      >
      </WordLookupPopover>
    </Container>
  );
};

export default WritingStudio;
