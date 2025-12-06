import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import App from './App';
import { store } from './store';
import { lightTheme } from './styles/theme';
import { GlobalStyles } from './styles/GlobalStyles';

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find root element');

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <GlobalStyles />
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
