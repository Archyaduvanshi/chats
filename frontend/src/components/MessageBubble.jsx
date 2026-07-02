import { CheckCheck } from 'lucide-react';
import { formatMessageTime } from '../utils/date';

const MessageBubble = ({ message, isOwn }) => (
  <article className={`message-row ${isOwn ? 'own' : ''}`}>
    <div className="message-bubble">
      <div className="message-meta">
        <strong>{message.username}</strong>
        <span>{formatMessageTime(message.createdAt)}</span>
      </div>
      <p>{message.text}</p>
      {isOwn && (
        <span className="receipt">
          <CheckCheck size={14} />
          {message.readBy?.length > 1 ? 'Read' : 'Delivered'}
        </span>
      )}
    </div>
  </article>
);

export default MessageBubble;
