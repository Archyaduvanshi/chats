import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const MessageList = ({
  isDirectChat,
  isPeerOnline,
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
    <section
      className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4 sm:p-[22px]"
      aria-label="Messages"
    >
      {messages.length === 0 ? (
        <div className="m-auto text-center text-[#687384]">
          No messages yet. Start the conversation.
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isDirectChat={isDirectChat}
            isOwn={message.username === username}
            isPeerOnline={isPeerOnline}
            onCopy={onCopyMessage}
            onDelete={onDeleteMessage}
            onEdit={onEditMessage}
          />
        ))
      )}
      {typingUsers.length > 0 && (
        <div className="px-1 py-1.5 text-sm font-bold text-[#687384]">
          {typingUsers.join(', ')} typing...
        </div>
      )}
      <div ref={endRef} />
    </section>
  );
};

export default MessageList;
