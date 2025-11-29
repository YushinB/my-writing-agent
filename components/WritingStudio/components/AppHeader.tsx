import React from 'react';
import { PenLine, Book, Sun, Moon, Settings } from 'lucide-react';
import { Header, Logo, LogoIcon, LogoText, HeaderActions, SignOutButton, IconButton } from '../../Common/Styled';

interface AppHeaderProps {
  currentTheme: 'light' | 'dark';
  userRole?: string;
  onThemeToggle: () => void;
  onSettings: () => void;
  onOpenDictionary: () => void;
  onSignOut: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  currentTheme,
  userRole,
  onThemeToggle,
  onSettings,
  onOpenDictionary,
  onSignOut,
}) => {
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
        <SignOutButton onClick={onSignOut}>
          Sign Out
        </SignOutButton>
      </HeaderActions>
    </Header>
  );
};

export default AppHeader;
