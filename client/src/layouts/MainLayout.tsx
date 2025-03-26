// client/src/layouts/MainLayout.tsx
import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Header from '../components/navigation/Header';
import ChatPanel from '../components/chat/ChatPanel';
import MobileNav from '../components/navigation/MobileNav';

function MainLayout() {
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true); // Start collapsed

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - desktop */}
      <div className={`hidden md:block bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      } transition-all duration-200 z-10`}>
        <Sidebar 
          collapsed={isSidebarCollapsed} 
          onToggle={toggleSidebar} 
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <Header toggleChat={toggleChat} isChatOpen={isChatOpen} />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </main>
          {isChatOpen && (
            <div className="hidden md:block w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
              <ChatPanel onClose={toggleChat} />
            </div>
          )}
        </div>
        <MobileNav toggleChat={toggleChat} isChatOpen={isChatOpen} />
      </div>
    </div>
  );
}

export default MainLayout;