import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar.jsx';
import Header from '../components/navigation/Header.jsx';
import ChatPanel from '../components/chat/ChatPanel.jsx';
import MobileNav from '../components/navigation/MobileNav.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme.jsx';

const MainLayout = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - desktop */}
      <div className="bg-white dark:bg-gray-800 border-r border-gray-200">
        <Sidebar 
          user={user} 
          collapsed={isSidebarCollapsed} 
          onToggle={toggleSidebar} 
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Header */}
        <Header toggleChat={toggleChat} isChatOpen={isChatOpen} />

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </main>

          {/* Chat panel */}
          <div 
            className="bg-white dark:bg-gray-800 border-r border-gray-200"
          >
            {isChatOpen && <ChatPanel onClose={toggleChat} />}
          </div>
        </div>

        {/* Mobile navigation */}
        <MobileNav toggleChat={toggleChat} isChatOpen={isChatOpen} />
      </div>
    </div>
  );
};

export default MainLayout;

