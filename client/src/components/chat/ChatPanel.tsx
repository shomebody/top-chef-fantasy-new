import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useLeague } from '../../hooks/useLeague';
import ChatMessage from './ChatMessage';

// JSDoc type definitions for TypeScript checking
/**
 * @typedef {Object} User
 * @property {string} _id
 */

/**
 * @typedef {Object} League
 * @property {string} _id
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} _id
 * @property {Object} [sender]
 * @property {string} sender._id
 * @property {string} sender.name
 * @property {string} content
 * @property {string} [createdAt]
 */

/**
 * Chat Panel Component
 * @param {Object} props
 * @param {Function} props.onClose - Function to close the chat panel
 */
const ChatPanel = ({ onClose }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Get league and user data
  const { currentLeague } = useLeague();
  const { user } = useAuth();

  // Use chat hook (destructuring directly avoids the void type check issue)
  const { 
    messages = [], 
    loading = false, 
    error = null, 
    typingUsers = [], 
    sendMessage = () => {}, 
    sendTypingIndicator = () => {} 
  } = useChat(currentLeague?._id);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Define handlers with proper event types
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && currentLeague) {
      // Don't pass any arguments if sendMessage doesn't accept them
      sendMessage(message.trim());
      setMessage('');
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    sendTypingIndicator();
  };

  // Define a proper React event handler for onClick
  const handleClose = (e) => {
    onClose();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">League Chat</h3>
        <button
          onClick={handleClose}
          className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
          aria-label="Close chat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <svg
              className="animate-spin h-8 w-8 text-primary-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 dark:text-red-400">{error}</div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <ChatMessage
                  key={msg._id}
                  message={msg}
                  isOwnMessage={msg.sender?._id === user?._id}
                />
              ))
            )}

            {typingUsers.length > 0 && (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                {typingUsers.length === 1
                  ? `${typingUsers[0].username} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Type a message..."
            value={message}
            onChange={handleInputChange}
            disabled={!currentLeague}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!message.trim() || !currentLeague}
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;