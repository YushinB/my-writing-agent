import React, { useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import { Provider } from 'react-redux';
import { store, useAppSelector } from './store';
import { GlobalStyles } from './styles/GlobalStyles';
import { lightTheme, darkTheme } from './styles/theme';
import Login from './components/Auth/Login';
import WritingStudio from './components/WritingStudio/WritingStudio';
import AdminDashboard from './components/Admin/AdminDashboard';

const AppContent: React.FC = () => {
  const { isAuthenticated, currentView } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.settings);

  useEffect(() => {
    // Apply theme class to document on mount and theme change
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

  if (!isAuthenticated) {
    return <Login />;
  }

  if (currentView === 'admin') {
    return <AdminDashboard />;
  }

  return <WritingStudio />;
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <GlobalStyles />
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
};

export default App;
