import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const MessageList = ({
  messages,
  username,
  typingUsers,
  onCopyMessage,
  onDeleteMessage,
  onEditMessage,
}) => {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  return (
    <section className="messages" aria-label="Messages">
      {messages.length === 0 ? (
        <div className="empty-state">No messages yet. Start the conversation.</div>
      ) : (
        messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.username === username}
            onCopy={onCopyMessage}
            onDelete={onDeleteMessage}
            onEdit={onEditMessage}
          />
        ))
      )}
      {typingUsers.length > 0 && (
        <div className="typing-indicator">{typingUsers.join(', ')} typing...</div>
      )}
      <div ref={endRef} />
    </section>
  );
};

export default MessageList;
