import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { X, Search, Volume2, Star, Calendar, Loader, Trash2, Download, Upload, Tag, Filter } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  closeMyWords,
  fetchSavedWords,
  removeWordFromBackend,
  clearCurrentDefinition,
  updateWordInStore,
  toggleFavoriteInStore,
} from '../../store/slices/dictionarySlice';
import { SavedWord, WordDefinition } from '../../types';
import dictionaryService from '../../services/dictionary';
import myWordsService from '../../services/myWords';

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
  width: 450px;
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

const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
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

const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    background-color: ${({ theme }) => theme.colors.surfaceHover};
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FilterSection = styled.div`
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const FilterBox = styled.div`
  position: relative;
  width: 100%;
`;

const FilterIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textSecondary};
  pointer-events: none;
`;

const FilterInput = styled.input`
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

const FilterChips = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

const FilterChip = styled.button<{ $active?: boolean }>`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) => ($active ? 'white' : theme.colors.textSecondary)};
  border: 1px solid
    ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.full};
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
  background-color: ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  color: ${({ $active, theme }) => ($active ? 'white' : theme.colors.textSecondary)};
  border: 1px solid
    ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.border)};
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
  border: 1px solid
    ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    background-color: ${({ $active, theme }) =>
      $active ? theme.colors.primaryLight : theme.colors.surfaceHover};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const WordInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const WordName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const WordMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

const MetaText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
`;

const TagBadge = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.primary};
  background-color: ${({ theme }) => theme.colors.primaryLight};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.primary}40;
`;

const WordActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const WordActionButton = styled.button<{ $danger?: boolean; $active?: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: ${({ $active, theme }) => ($active ? '#f59e0b' : theme.colors.textTertiary)};
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    background-color: ${({ $danger, $active }) =>
      $danger ? '#fee2e2' : $active ? '#fef3c7' : '#e0e7ff'};
    color: ${({ $danger, $active }) =>
      $danger ? '#dc2626' : $active ? '#f59e0b' : '#4f46e5'};
  }
`;

const DetailsSection = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
  max-height: 50%;
  overflow-y: auto;
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

const IPA = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-family: monospace;
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

const TagsSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const TagInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const TagItem = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.primary};
  background-color: ${({ theme }) => theme.colors.primaryLight};
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.primary}40;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
  }
`;

const NotesSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const NotesTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const DateAdded = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-top: ${({ theme }) => theme.spacing.md};
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

const LoadingOverlay = styled.div`
  ${spin}
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.primary};

  svg {
    animation: spin 1s linear infinite;
  }
`;

const ConfirmDialog = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  z-index: 102;
  min-width: 300px;
`;

const DialogTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
`;

const DialogText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
`;

const DialogActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
`;

const DialogButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  ${({ $variant, theme }) => {
    if ($variant === 'danger') {
      return `
        background-color: #dc2626;
        color: white;
        &:hover {
          background-color: #b91c1c;
        }
      `;
    }
    return `
      background-color: ${theme.colors.surface};
      color: ${theme.colors.text};
      border: 1px solid ${theme.colors.border};
      &:hover {
        background-color: ${theme.colors.surfaceHover};
      }
    `;
  }}
`;

const HiddenInput = styled.input`
  display: none;
`;

type SortType = 'alphabetical' | 'date';
type FilterType = 'all' | 'favorites';

const MyWords: React.FC = () => {
  const dispatch = useAppDispatch();
  const { words, isMyWordsOpen, isLoading } = useAppSelector((state) => state.dictionary);

  const [filterQuery, setFilterQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('date');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedWord, setSelectedWord] = useState<SavedWord | null>(null);
  const [wordDefinition, setWordDefinition] = useState<WordDefinition | null>(null);
  const [isLoadingDefinition, setIsLoadingDefinition] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMyWordsOpen) {
      dispatch(fetchSavedWords({ page: 1, limit: 100 }));
    }
  }, [isMyWordsOpen, dispatch]);

  useEffect(() => {
    const fetchDefinition = async () => {
      if (selectedWord) {
        setIsLoadingDefinition(true);
        setNotes(selectedWord.notes || '');
        try {
          const definition = await dictionaryService.lookupWord(selectedWord.word);
          setWordDefinition(definition);
        } catch {
          setWordDefinition({
            word: selectedWord.word,
            definition: selectedWord.definition || 'Definition not available',
            partOfSpeech: selectedWord.partOfSpeech || '',
            exampleSentence: selectedWord.exampleSentence || '',
            synonyms: selectedWord.synonyms || [],
            pronunciation: selectedWord.pronunciation,
          });
        } finally {
          setIsLoadingDefinition(false);
        }
      }
    };

    fetchDefinition();
  }, [selectedWord]);

  const handleClose = () => {
    dispatch(closeMyWords());
    dispatch(clearCurrentDefinition());
    setFilterQuery('');
    setSelectedWord(null);
    setWordDefinition(null);
  };

  const handleRemoveWord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await dispatch(removeWordFromBackend(deleteConfirm));
      if (selectedWord && selectedWord.id === deleteConfirm) {
        setSelectedWord(null);
        setWordDefinition(null);
      }
      setDeleteConfirm(null);
    }
  };

  const handleSelectWord = (word: SavedWord) => {
    setSelectedWord(word);
  };

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await myWordsService.toggleFavorite(id);
      dispatch(toggleFavoriteInStore({ id, favorite: updated.favorite }));
      if (selectedWord && selectedWord.id === id) {
        setSelectedWord({ ...selectedWord, favorite: updated.favorite });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleAddTag = async () => {
    if (!selectedWord || !newTag.trim()) return;

    const currentTags = selectedWord.tags || [];
    const updatedTags = [...currentTags, newTag.trim()];

    try {
      const updated = await myWordsService.updateWord(selectedWord.id, { tags: updatedTags });
      dispatch(updateWordInStore({ id: selectedWord.id, tags: updated.tags }));
      setSelectedWord({ ...selectedWord, tags: updated.tags });
      setNewTag('');
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!selectedWord) return;

    const currentTags = selectedWord.tags || [];
    const updatedTags = currentTags.filter((t) => t !== tag);

    try {
      const updated = await myWordsService.updateWord(selectedWord.id, { tags: updatedTags });
      dispatch(updateWordInStore({ id: selectedWord.id, tags: updated.tags }));
      setSelectedWord({ ...selectedWord, tags: updated.tags });
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  const handleNotesBlur = async () => {
    if (!selectedWord || notes === (selectedWord.notes || '')) return;

    try {
      await myWordsService.updateNotes(selectedWord.id, notes);
      dispatch(updateWordInStore({ id: selectedWord.id, notes }));
      setSelectedWord({ ...selectedWord, notes });
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const blob = await myWordsService.exportWords(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-words-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export words:', error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const wordsToImport = Array.isArray(data)
        ? data.map((item: any) => ({
            word: item.word,
            notes: item.notes,
            tags: item.tags || [],
            favorite: item.favorite || false,
          }))
        : [];

      const result = await myWordsService.importWords(wordsToImport);
      alert(
        `Import complete!\nImported: ${result.imported}\nSkipped: ${result.skipped}\n${
          result.errors.length > 0 ? 'Errors: ' + result.errors.join(', ') : ''
        }`
      );

      dispatch(fetchSavedWords({ page: 1, limit: 100 }));
    } catch (error) {
      console.error('Failed to import words:', error);
      alert('Failed to import words. Please check the file format.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredWords = words
    .filter((word) => {
      const matchesSearch = word.word.toLowerCase().includes(filterQuery.toLowerCase());
      const matchesFilter = filterType === 'all' || (filterType === 'favorites' && word.favorite);
      return matchesSearch && matchesFilter;
    });

  const sortedWords = [...filteredWords].sort((a, b) => {
    if (sortType === 'alphabetical') {
      return a.word.localeCompare(b.word);
    } else {
      return b.dateAdded - a.dateAdded;
    }
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Overlay $show={isMyWordsOpen} onClick={handleClose} />
      <Sidebar $show={isMyWordsOpen}>
        <Header>
          <Title>
            <Star size={20} />
            My Words
          </Title>
          <HeaderActions>
            <ActionButton onClick={() => fileInputRef.current?.click()} title="Import words">
              <Upload size={16} />
            </ActionButton>
            <ActionButton onClick={() => handleExport('json')} title="Export as JSON">
              <Download size={16} />
            </ActionButton>
            <CloseButton onClick={handleClose}>
              <X size={20} />
            </CloseButton>
          </HeaderActions>
        </Header>

        <HiddenInput ref={fileInputRef} type="file" accept=".json" onChange={handleImport} />

        <FilterSection>
          <FilterBox>
            <FilterIcon>
              <Search size={16} />
            </FilterIcon>
            <FilterInput
              type="text"
              placeholder="Search words..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </FilterBox>
          <FilterChips>
            <FilterChip $active={filterType === 'all'} onClick={() => setFilterType('all')}>
              <Filter size={12} />
              All
            </FilterChip>
            <FilterChip
              $active={filterType === 'favorites'}
              onClick={() => setFilterType('favorites')}
            >
              <Star size={12} />
              Favorites
            </FilterChip>
          </FilterChips>
        </FilterSection>

        <SavedWordsSection>
          <SectionHeader>
            <div>
              <SectionTitle>
                Saved Words <WordCount>({sortedWords.length})</WordCount>
              </SectionTitle>
            </div>
            <SortButtons>
              <SortButton
                $active={sortType === 'alphabetical'}
                onClick={() => setSortType('alphabetical')}
              >
                A-Z
              </SortButton>
              <SortButton $active={sortType === 'date'} onClick={() => setSortType('date')}>
                <Calendar size={12} />
              </SortButton>
            </SortButtons>
          </SectionHeader>

          {isLoading ? (
            <LoadingOverlay>
              <Loader size={32} />
            </LoadingOverlay>
          ) : sortedWords.length === 0 ? (
            <EmptyState>
              <EmptyIcon>
                <Star size={24} />
              </EmptyIcon>
              <EmptyText>
                {filterQuery || filterType !== 'all'
                  ? 'No words found matching your filters.'
                  : 'No saved words yet. Use the Dictionary to look up and save words!'}
              </EmptyText>
            </EmptyState>
          ) : (
            <WordsList>
              {sortedWords.map((word) => (
                <WordItem
                  key={word.id}
                  $active={selectedWord?.id === word.id}
                  onClick={() => handleSelectWord(word)}
                >
                  <WordInfo>
                    <WordName>{word.word}</WordName>
                    <WordMeta>
                      <MetaText>{formatDate(word.dateAdded)}</MetaText>
                      {word.tags && word.tags.length > 0 && (
                        <>
                          {word.tags.slice(0, 2).map((tag, idx) => (
                            <TagBadge key={idx}>{tag}</TagBadge>
                          ))}
                          {word.tags.length > 2 && (
                            <MetaText>+{word.tags.length - 2}</MetaText>
                          )}
                        </>
                      )}
                    </WordMeta>
                  </WordInfo>
                  <WordActions>
                    <WordActionButton
                      $active={word.favorite}
                      onClick={(e) => handleToggleFavorite(word.id, e)}
                      title={word.favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star size={14} fill={word.favorite ? '#f59e0b' : 'none'} />
                    </WordActionButton>
                    <WordActionButton title="Pronounce">
                      <Volume2 size={14} />
                    </WordActionButton>
                    <WordActionButton
                      $danger
                      onClick={(e) => handleRemoveWord(word.id, e)}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </WordActionButton>
                  </WordActions>
                </WordItem>
              ))}
            </WordsList>
          )}
        </SavedWordsSection>

        {selectedWord && (
          <DetailsSection>
            {isLoadingDefinition ? (
              <LoadingOverlay>
                <Loader size={24} />
              </LoadingOverlay>
            ) : wordDefinition ? (
              <>
                <DetailsHeader>
                  <Word>{wordDefinition.word}</Word>
                  <IconButton title="Pronounce">
                    <Volume2 size={20} />
                  </IconButton>
                </DetailsHeader>

                <Pronunciation>
                  {wordDefinition.pronunciation && <IPA>{wordDefinition.pronunciation}</IPA>}
                  {wordDefinition.partOfSpeech && (
                    <PartOfSpeech>{wordDefinition.partOfSpeech}</PartOfSpeech>
                  )}
                </Pronunciation>

                {wordDefinition.definition && (
                  <DetailBlock>
                    <DetailLabel>Definition</DetailLabel>
                    <DetailText>{wordDefinition.definition}</DetailText>
                  </DetailBlock>
                )}

                {wordDefinition.exampleSentence && (
                  <DetailBlock>
                    <DetailLabel>Example</DetailLabel>
                    <ExampleText>"{wordDefinition.exampleSentence}"</ExampleText>
                  </DetailBlock>
                )}

                {wordDefinition.synonyms && wordDefinition.synonyms.length > 0 && (
                  <DetailBlock>
                    <DetailLabel>Synonyms</DetailLabel>
                    <SynonymsList>
                      {wordDefinition.synonyms.map((synonym, idx) => (
                        <SynonymTag key={idx}>{synonym}</SynonymTag>
                      ))}
                    </SynonymsList>
                  </DetailBlock>
                )}

                <TagsSection>
                  <DetailLabel>Tags</DetailLabel>
                  <TagInput
                    type="text"
                    placeholder="Add a tag and press Enter..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <TagsList>
                    {selectedWord.tags && selectedWord.tags.length > 0 ? (
                      selectedWord.tags.map((tag, idx) => (
                        <TagItem key={idx} onClick={() => handleRemoveTag(tag)}>
                          <Tag size={12} />
                          {tag}
                          <X size={12} />
                        </TagItem>
                      ))
                    ) : (
                      <EmptyText>No tags yet</EmptyText>
                    )}
                  </TagsList>
                </TagsSection>

                <NotesSection>
                  <DetailLabel>Notes</DetailLabel>
                  <NotesTextarea
                    placeholder="Add personal notes about this word..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                  />
                </NotesSection>

                <DateAdded>Added on {formatDate(selectedWord.dateAdded)}</DateAdded>
              </>
            ) : null}
          </DetailsSection>
        )}
      </Sidebar>

      {deleteConfirm && (
        <>
          <Overlay $show={true} onClick={() => setDeleteConfirm(null)} />
          <ConfirmDialog>
            <DialogTitle>Delete Word?</DialogTitle>
            <DialogText>
              Are you sure you want to remove this word from your collection? This action cannot be
              undone.
            </DialogText>
            <DialogActions>
              <DialogButton onClick={() => setDeleteConfirm(null)}>Cancel</DialogButton>
              <DialogButton $variant="danger" onClick={confirmDelete}>
                Delete
              </DialogButton>
            </DialogActions>
          </ConfirmDialog>
        </>
      )}
    </>
  );
};

export default MyWords;
