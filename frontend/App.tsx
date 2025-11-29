import React from 'react';
import { ThemeProvider } from 'styled-components';
import { Provider } from 'react-redux';
import { store, useAppSelector } from './store';
import { GlobalStyles } from './styles/GlobalStyles';
import { lightTheme, darkTheme } from './styles/theme';
import Login from './components/Auth/Login';
import WritingStudio from './components/WritingStudio/WritingStudio';
import AdminDashboard from './components/Admin/AdminDashboard';

// Main application content based on authentication and view state
// separated for clarity
const AppContent: React.FC = () => {
  const { isAuthenticated, currentView } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Login />;
  }

  if (currentView === 'admin') {
    return <AdminDashboard />;
  }

  return <WritingStudio />;
};

// Theme wrapper to provide theme based on settings
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useAppSelector((state) => state.settings);
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

  return <ThemeProvider theme={currentTheme}>{children}</ThemeProvider>;
};
// Main App component
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeWrapper>
        <GlobalStyles />
        <AppContent />
      </ThemeWrapper>
    </Provider>
  );
};

export default App;
