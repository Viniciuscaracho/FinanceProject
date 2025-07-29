import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    if (isDarkMode) {
      // Aplicar modo escuro com controles mais específicos
      root.style.setProperty('--dark-mode', 'true');
      root.style.setProperty('--dark-brightness', '0.9');
      root.style.setProperty('--dark-contrast', '1.1');
      root.style.setProperty('--dark-saturate', '0.8');
      
      // Adicionar classe para controle específico
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
    } else {
      // Aplicar modo claro
      root.style.setProperty('--dark-mode', 'false');
      root.style.setProperty('--dark-brightness', '1');
      root.style.setProperty('--dark-contrast', '1');
      root.style.setProperty('--dark-saturate', '1');
      
      // Adicionar classe para controle específico
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
    }
    
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const value = {
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 