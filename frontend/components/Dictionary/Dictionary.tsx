import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Search, Volume2, Loader, BookmarkPlus, Book, Clock, Check } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  closeDictionary,
  saveWordToBackend,
  setCurrentDefinition,
  clearCurrentDefinition,
  setIsDefining,
  addToRecentLookups,
} from '../../store/slices/dictionarySlice';
import dictionaryService from '../../services/dictionary';

// Animations
const slideIn = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const spin = `
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Layout Components
const Overlay = styled.div<{ $show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  visibility: ${({ $show }) => ($show ? 'visible' : 'hidden')};
  transition: all 0.3s ease;
  z-index: 100;
  backdrop-filter: blur(2px);
`;

const Sidebar = styled.div<{ $show: boolean }>`
  ${slideIn}
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  z-index: 101;
  display: flex;
  flex-direction: column;
  transform: ${({ $show }) => ($show ? 'translateX(0)' : 'translateX(100%)')};
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  transition: all 0.3s ease;
  animation: ${({ $show }) => ($show ? 'slideIn 0.3s ease' : 'none')};

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    background-color: ${({ theme }) => theme.colors.surfaceHover};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const SearchSection = styled.div`
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
`;

const SearchBox = styled.div`
  position: relative;
  width: 100%;
`;

const SearchIcon = styled.div<{ $isLoading?: boolean }>`
  ${spin}
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textSecondary};
  pointer-events: none;
  animation: ${({ $isLoading }) => ($isLoading ? 'spin 1s linear infinite' : 'none')};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.sm}
    ${({ theme }) => theme.spacing.sm} 40px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  transition: all ${({ theme }) => theme.transitions.base};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}15;
  }
`;

const SavedWordsSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const WordInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const WordMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
`;

const ErrorMessage = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: #ef4444;
`;

const IPA = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-family: monospace;
`;

const WordName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const WordsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const WordItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    background-color: ${({ theme }) => theme.colors.surfaceHover};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const DetailsSection = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
`;

const DetailsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Word = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const IconButton = styled.button<{ $saved?: boolean; disabled?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ $saved, theme }) =>
    $saved ? theme.colors.success + '20' : theme.colors.background};
  color: ${({ $saved, theme }) =>
    $saved ? theme.colors.success : theme.colors.primary};
  border: 1px solid ${({ $saved, theme }) =>
    $saved ? theme.colors.success : theme.colors.border};
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  transition: all ${({ theme }) => theme.transitions.base};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${({ $saved, disabled, theme }) =>
      disabled ? ($saved ? theme.colors.success + '20' : theme.colors.background) : theme.colors.primary};
    color: ${({ disabled }) => (disabled ? 'inherit' : 'white')};
    border-color: ${({ disabled, theme }) =>
      disabled ? 'inherit' : theme.colors.primary};
  }
`;

const Pronunciation = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const PartOfSpeech = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.primary};
  background-color: ${({ theme }) => theme.colors.primaryLight};
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.primary};
`;

const DetailBlock = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const DetailLabel = styled.h4`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`;

const DetailText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;
  margin: 0;
`;

const ExampleText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
  font-style: italic;
  margin: 0;
`;

const SynonymsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const SynonymTag = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.primary};
  background-color: ${({ theme }) => theme.colors.primaryLight};
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.primary}40;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const EmptyIcon = styled.div`
  width: 60px;
  height: 60px;
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

interface DictionaryProps {}

const Dictionary: React.FC<DictionaryProps> = () => {
  const dispatch = useAppDispatch();
  const { words, isOpen, currentDefinition, isDefining, recentLookups } = useAppSelector(
    (state) => state.dictionary
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleClose = () => {
    dispatch(closeDictionary());
    dispatch(clearCurrentDefinition());
    setSearchQuery('');
    setLookupError(null);
  };

  const handleSearchKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const query = searchQuery.trim();

      dispatch(setIsDefining(true));
      setLookupError(null);

      try {
        const definition = await dictionaryService.lookupWord(query);

        if (definition) {
          dispatch(setCurrentDefinition(definition));
          dispatch(addToRecentLookups(definition));
        } else {
          setLookupError('Word not found. Please try another word.');
        }
      } catch {
        setLookupError('Failed to look up word. Please try again.');
      } finally {
        dispatch(setIsDefining(false));
      }
    }
  };

  const handleRecentClick = (word: string) => {
    const recent = recentLookups.find((r) => r.word === word);
    if (recent) {
      dispatch(setCurrentDefinition(recent));
    }
  };

  const handleSaveWord = () => {
    if (currentDefinition && !words.find((w) => w.word === currentDefinition.word)) {
      dispatch(saveWordToBackend({ word: currentDefinition.word }));
    }
  };

  const isWordSaved = currentDefinition ? words.some(
    (w) => w.word === currentDefinition.word
  ) : false;

  return (
    <>
      <Overlay $show={isOpen} onClick={handleClose} />
      <Sidebar $show={isOpen}>
        <Header>
          <Title>
            <Book size={20} />
            Dictionary
          </Title>
          <CloseButton onClick={handleClose}>
            <X size={20} />
          </CloseButton>
        </Header>

        <SearchSection>
          <SearchBox>
            <SearchIcon $isLoading={isDefining}>
              {isDefining ? <Loader size={16} /> : <Search size={16} />}
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search for a word... (Press Enter)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              disabled={isDefining}
            />
          </SearchBox>
          {lookupError && (
            <ErrorMessage>
              {lookupError}
            </ErrorMessage>
          )}
        </SearchSection>

        {currentDefinition ? (
          <DetailsSection>
            <DetailsHeader>
              <Word>{currentDefinition.word}</Word>
              <div style={{ display: 'flex', gap: '8px' }}>
                <IconButton 
                  onClick={handleSaveWord} 
                  title={isWordSaved ? "Already saved" : "Save to My Words"}
                  disabled={isWordSaved}
                  $saved={isWordSaved}
                >
                  {isWordSaved ? <Check size={20} /> : <BookmarkPlus size={20} />}
                </IconButton>
                <IconButton title="Pronounce">
                  <Volume2 size={20} />
                </IconButton>
              </div>
            </DetailsHeader>

            <Pronunciation>
              {currentDefinition.pronunciation && (
                <IPA>{currentDefinition.pronunciation}</IPA>
              )}
              {currentDefinition.partOfSpeech && (
                <PartOfSpeech>{currentDefinition.partOfSpeech}</PartOfSpeech>
              )}
            </Pronunciation>

            {currentDefinition.definition && (
              <DetailBlock>
                <DetailLabel>Definition</DetailLabel>
                <DetailText>{currentDefinition.definition}</DetailText>
              </DetailBlock>
            )}

            {currentDefinition.exampleSentence && (
              <DetailBlock>
                <DetailLabel>Example</DetailLabel>
                <ExampleText>"{currentDefinition.exampleSentence}"</ExampleText>
              </DetailBlock>
            )}

            {currentDefinition.synonyms && currentDefinition.synonyms.length > 0 && (
              <DetailBlock>
                <DetailLabel>Synonyms</DetailLabel>
                <SynonymsList>
                  {currentDefinition.synonyms.map((synonym, idx) => (
                    <SynonymTag key={idx}>{synonym}</SynonymTag>
                  ))}
                </SynonymsList>
              </DetailBlock>
            )}
          </DetailsSection>
        ) : (
          <SavedWordsSection>
            <SectionHeader>
              <SectionTitle>
                <Clock size={14} />
                Recent Lookups
              </SectionTitle>
            </SectionHeader>

            {recentLookups.length === 0 ? (
              <EmptyState>
                <EmptyIcon>
                  <Search size={24} />
                </EmptyIcon>
                <EmptyText>
                  Search for a word above to see its definition.
                  <br />
                  Recent lookups will appear here.
                </EmptyText>
              </EmptyState>
            ) : (
              <WordsList>
                {recentLookups.map((lookup, idx) => (
                  <WordItem
                    key={`${lookup.word}-${idx}`}
                    onClick={() => handleRecentClick(lookup.word)}
                  >
                    <WordInfo>
                      <WordName>{lookup.word}</WordName>
                      <WordMeta>{lookup.partOfSpeech}</WordMeta>
                    </WordInfo>
                  </WordItem>
                ))}
              </WordsList>
            )}
          </SavedWordsSection>
        )}
      </Sidebar>
    </>
  );
};

export default Dictionary;
