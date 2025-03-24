import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useLeague } from '../../hooks/useLeague.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';

const Header = ({ 
  toggleChat = () => {}, 
  isChatOpen = false 
}) => {
  // Add defaults for context values
  const { user = null } = useAuth();
  const { currentLeague = null, leagues = [], switchLeague = () => {} } = useLeague();
  
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* League selector */}
        {leagues.length > 0 && (
          <div className="relative">
            <select
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={currentLeague?._id || ''}
              onChange={(e) => switchLeague(e.target.value)}
              aria-label="Select league"
            >
              {leagues.map((league) => (
                <option key={league._id || Math.random().toString()} value={league._id || ''}>
                  {league.name || 'Unnamed League'}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
        
        {/* League actions */}
        {currentLeague && (
          <div className="hidden md:flex items-center space-x-2">
            <Link
              to="/leagues"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              View Details
            </Link>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Chat toggle */}
        <button
          type="button"
          onClick={toggleChat}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none relative"
          aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {/* Notification badge - can be conditionally rendered */}
          <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-primary-500"></span>
        </button>
        
        {/* Theme toggle - visible on desktop */}
        <div className="hidden md:block">
          <ThemeToggle />
        </div>
        
        {/* User menu */}
        <div className="relative">
          <Link to="/settings" className="flex items-center space-x-2" aria-label="User settings">
            <div className="w-8 h-8 rounded-full bg-primary-200 dark:bg-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300">
              {user?.name?.charAt(0) || '?'}
            </div>
            <span className="hidden md:inline-block text-sm font-medium text-gray-700 dark:text-gray-200">
              {user?.name || 'User'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;