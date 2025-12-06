import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Search, Volume2, Star, Calendar, Loader, BookmarkPlus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  closeDictionary,
  removeWord,
  addWord,
  setCurrentDefinition,
  clearCurrentDefinition,
  setIsDefining,
} from '../../store/slices/dictionarySlice';
import { SavedWord } from '../../types';
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
`;

const WordCount = styled.span`
  color: ${({ theme }) => theme.colors.textTertiary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const SortButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const SortButton = styled.button<{ $active?: boolean }>`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? 'white' : theme.colors.textSecondary};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  &:hover {
    background-color: ${({ $active, theme }) =>
      $active ? theme.colors.primaryHover : theme.colors.surfaceHover};
  }
`;

const WordsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const WordItem = styled.div<{ $active?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.primaryLight : theme.colors.background};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    background-color: ${({ $active, theme }) =>
      $active ? theme.colors.primaryLight : theme.colors.surfaceHover};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const WordName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const RemoveButton = styled.button`
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.textTertiary};
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    background-color: #fee2e2;
    color: #dc2626;
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

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
    border-color: ${({ theme }) => theme.colors.primary};
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

type SortType = 'alphabetical' | 'date';

interface DictionaryProps {}

const Dictionary: React.FC<DictionaryProps> = () => {
  const dispatch = useAppDispatch();
  const { words, isOpen, currentDefinition, isDefining } = useAppSelector(
    (state) => state.dictionary
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('date');
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleClose = () => {
    dispatch(closeDictionary());
    dispatch(clearCurrentDefinition());
    setSearchQuery('');
    setLookupError(null);
  };

  const handleRemoveWord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(removeWord(id));
    if (currentDefinition && words.find((w) => w.id === id)?.word === currentDefinition.word) {
      dispatch(clearCurrentDefinition());
    }
  };

  const handleSelectWord = (word: SavedWord) => {
    dispatch(setCurrentDefinition(word));
    setLookupError(null);
  };

  const handleSearchKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const query = searchQuery.trim();

      // Check if word is already in saved words
      const existingWord = words.find(
        (w) => w.word.toLowerCase() === query.toLowerCase()
      );

      if (existingWord) {
        handleSelectWord(existingWord);
        return;
      }

      // Look up the word using the API
      dispatch(setIsDefining(true));
      setLookupError(null);

      try {
        const definition = await dictionaryService.lookupWord(query);

        if (definition) {
          dispatch(setCurrentDefinition(definition));
        } else {
          setLookupError('Word not found. Please try another word.');
        }
      } catch (error) {
        setLookupError('Failed to look up word. Please try again.');
      } finally {
        dispatch(setIsDefining(false));
      }
    }
  };

  const handleSaveWord = () => {
    if (currentDefinition && !words.find((w) => w.word === currentDefinition.word)) {
      dispatch(addWord(currentDefinition));
    }
  };

  const isWordSaved = currentDefinition && words.some(
    (w) => w.word === currentDefinition.word
  );

  // Filter words based on search query
  const filteredWords = words.filter((word) =>
    word.word.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort words
  const sortedWords = [...filteredWords].sort((a, b) => {
    if (sortType === 'alphabetical') {
      return a.word.localeCompare(b.word);
    } else {
      return b.dateAdded - a.dateAdded;
    }
  });

  return (
    <>
      <Overlay $show={isOpen} onClick={handleClose} />
      <Sidebar $show={isOpen}>
        <Header>
          <Title>Dictionary</Title>
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
            <div style={{
              marginTop: '8px',
              fontSize: '12px',
              color: '#ef4444'
            }}>
              {lookupError}
            </div>
          )}
        </SearchSection>

        <SavedWordsSection>
          <SectionHeader>
            <div>
              <SectionTitle>
                Saved Words <WordCount>({words.length})</WordCount>
              </SectionTitle>
            </div>
            <SortButtons>
              <SortButton
                $active={sortType === 'alphabetical'}
                onClick={() => setSortType('alphabetical')}
              >
                A-Z
              </SortButton>
              <SortButton
                $active={sortType === 'date'}
                onClick={() => setSortType('date')}
              >
                <Calendar size={12} />
              </SortButton>
            </SortButtons>
          </SectionHeader>

          {sortedWords.length === 0 ? (
            <EmptyState>
              <EmptyIcon>
                <Star size={24} />
              </EmptyIcon>
              <EmptyText>
                {searchQuery
                  ? 'No words found matching your search.'
                  : 'No saved words yet. Start saving words to build your vocabulary!'}
              </EmptyText>
            </EmptyState>
          ) : (
            <WordsList>
              {sortedWords.map((word) => (
                <WordItem
                  key={word.id}
                  $active={currentDefinition?.word === word.word}
                  onClick={() => handleSelectWord(word)}
                >
                  <WordName>{word.word}</WordName>
                  <RemoveButton onClick={(e) => handleRemoveWord(word.id, e)}>
                    <X size={16} />
                  </RemoveButton>
                </WordItem>
              ))}
            </WordsList>
          )}
        </SavedWordsSection>

        {currentDefinition && (
          <DetailsSection>
            <DetailsHeader>
              <Word>{currentDefinition.word}</Word>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!isWordSaved && (
                  <IconButton onClick={handleSaveWord} title="Save word">
                    <BookmarkPlus size={20} />
                  </IconButton>
                )}
                <IconButton title="Pronounce">
                  <Volume2 size={20} />
                </IconButton>
              </div>
            </DetailsHeader>

            <Pronunciation>
              <PartOfSpeech>{currentDefinition.partOfSpeech}</PartOfSpeech>
            </Pronunciation>

            <DetailBlock>
              <DetailLabel>Definition</DetailLabel>
              <DetailText>{currentDefinition.definition}</DetailText>
            </DetailBlock>

            <DetailBlock>
              <DetailLabel>Example</DetailLabel>
              <ExampleText>"{currentDefinition.exampleSentence}"</ExampleText>
            </DetailBlock>

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
        )}
      </Sidebar>
    </>
  );
};

export default Dictionary;
