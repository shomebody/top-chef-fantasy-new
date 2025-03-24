import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.jsx';
import Logo from '../components/ui/Logo.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';

const AuthLayout = () => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="py-4 px-6 flex justify-between items-center">
        <Logo />
        <ThemeToggle />
      </header>
      
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
      
      <footer className="py-4 px-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Top Chef Fantasy League &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default AuthLayout;

