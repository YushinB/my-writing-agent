import React from 'react';
import { PenLine, Book, Sun, Moon, Settings, Library, UserCircle, User } from 'lucide-react';
import styled from 'styled-components';
import { Header, Logo, LogoIcon, LogoText, HeaderActions, SignOutButton, IconButton } from '../../Common/Styled';

interface AppHeaderProps {
  currentTheme: 'light' | 'dark';
  userRole?: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string | null;
  userDisplayName?: string | null;
  onThemeToggle: () => void;
  onSettings: () => void;
  onOpenDictionary: () => void;
  onOpenMyWords: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  currentTheme,
  userRole,
  userName,
  userEmail,
  userAvatar,
  userDisplayName,
  onThemeToggle,
  onSettings,
  onOpenDictionary,
  onOpenMyWords,
  onOpenProfile,
  onSignOut,
}) => {
  const displayName = userDisplayName || userName || userEmail?.split('@')[0] || 'User';

  return (
    <Header>
      <Logo>
        <LogoIcon>
          <PenLine size={24} />
        </LogoIcon>
        <LogoText>ProsePolish</LogoText>
      </Logo>
      <HeaderActions>
        <IconButton onClick={onThemeToggle} title="Toggle theme">
          {currentTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </IconButton>
        {userRole === 'admin' && (
          <IconButton onClick={onSettings} title="Admin Settings">
            <Settings size={20} />
          </IconButton>
        )}
        <IconButton onClick={onOpenDictionary} title="Dictionary">
          <Book size={20} />
        </IconButton>
        <IconButton onClick={onOpenMyWords} title="My Words">
          <Library size={20} />
        </IconButton>
        <UserInfo onClick={onOpenProfile} title="View Profile">
          {userAvatar ? (
            <UserAvatar src={userAvatar} alt={displayName} />
          ) : (
            <UserAvatarPlaceholder>
              <User size={18} />
            </UserAvatarPlaceholder>
          )}
          <UserName>{displayName}</UserName>
        </UserInfo>
        <SignOutButton onClick={onSignOut}>
          Sign Out
        </SignOutButton>
      </HeaderActions>
    </Header>
  );
};

const UserInfo = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
    border-color: ${({ theme }) => theme.colors.borderHover};
  }
`;

const UserAvatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
`;

const UserAvatarPlaceholder = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const UserName = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;


export default AppHeader;
