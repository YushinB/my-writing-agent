import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
    overflow: hidden;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.sans};
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    transition: background-color ${({ theme }) => theme.transitions.base},
                color ${({ theme }) => theme.transitions.base};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.borderHover};
  }

  /* Selection styles */
  ::selection {
    background-color: ${({ theme }) => theme.colors.primaryLight};
    color: ${({ theme }) => theme.colors.primary};
  }

  /* Focus styles */
  *:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  /* Button reset */
  button {
    font-family: inherit;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
    color: inherit;
  }

  /* Input reset */
  input, textarea {
    font-family: inherit;
    border: none;
    background: none;
    color: inherit;
  }

  /* Link reset */
  a {
    color: inherit;
    text-decoration: none;
  }

  /* Heading styles */
  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.2;
  }

  /* Animation utilities */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      transform: translateY(10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(-25%);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    50% {
      transform: translateY(0);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
  }

  .animate-fade-in {
    animation: fadeIn 200ms ease;
  }

  .animate-slide-in {
    animation: slideIn 300ms ease;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  .animate-bounce {
    animation: bounce 1s infinite;
  }

  /* Utility classes */
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }

  /* Font family utilities */
  .font-sans {
    font-family: ${({ theme }) => theme.fonts.sans};
  }

  .font-serif {
    font-family: ${({ theme }) => theme.fonts.serif};
  }

  .font-mono {
    font-family: ${({ theme }) => theme.fonts.mono};
  }

  .font-display {
    font-family: ${({ theme }) => theme.fonts.display};
  }
`;
