
import { formatDistanceToNow } from 'date-fns';

/**
 * @typedef {Object} Message
 * @property {string} type - The type of the message (e.g., 'system').
 * @property {string} content - The content of the message.
 * @property {string} [createdAt] - The timestamp of when the message was created.
 * @property {Object} [sender] - The sender of the message.
 * @property {string} [sender.name] - The name of the sender.
 */

/**
 * @param {{ message: Message, isOwnMessage: boolean }} props
 */
const ChatMessage = ({ message, isOwnMessage }) => {
  // Format the timestamp
  const formattedTime = message.createdAt
    ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })
    : '';

  // System message
  if (message.type === 'system') {
    return (
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[75%]">
        {/* Message bubble */}
        <div
          className={`rounded-lg px-4 py-2 inline-block ${
            isOwnMessage
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
          }`}
        >
          {!isOwnMessage && (
            <div className="font-medium text-xs mb-1">
              {message.sender?.name || 'Unknown'}
            </div>
          )}
          <div className="break-words">{message.content}</div>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formattedTime}
        </div>
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0 ml-2">
        {!isOwnMessage && (
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300">
            {message.sender?.name?.charAt(0) || '?'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;