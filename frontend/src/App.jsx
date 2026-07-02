import { useCallback, useEffect, useState } from 'react';
import ChatHeader from './components/ChatHeader';
import LoginPanel from './components/LoginPanel';
import MessageComposer from './components/MessageComposer';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import { useChatSocket } from './hooks/useChatSocket';
import {
  deleteMessage,
  editMessage,
  fetchMessages,
  markMessagesRead,
  sendMessage,
} from './services/api';
import './App.css';

const App = () => {
  const [draftUsername, setDraftUsername] = useState(
    () => localStorage.getItem('chat_username') || ''
  );
  const [username, setUsername] = useState(() => localStorage.getItem('chat_username') || '');
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(username));

  const mergeMessage = useCallback((incomingMessage) => {
    setMessages((currentMessages) => {
      if (currentMessages.some((message) => message.id === incomingMessage.id)) {
        return currentMessages;
      }
      return [...currentMessages, incomingMessage];
    });
  }, []);

  const updateMessageInList = useCallback((updatedMessage) => {
    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === updatedMessage.id ? updatedMessage : message
      )
    );
  }, []);

  const removeMessageFromList = useCallback((messageId) => {
    setMessages((currentMessages) =>
      currentMessages.filter((message) => message.id !== messageId)
    );
  }, []);

  const replaceMessages = useCallback((nextMessages) => {
    setMessages(nextMessages);
  }, []);

  const {
    isConnected,
    onlineUsers,
    typingUsers,
    deleteSocketMessage,
    editSocketMessage,
    sendSocketMessage,
    startTyping,
    stopTyping,
  } = useChatSocket({
    username,
    onMessage: mergeMessage,
    onMessageDelete: removeMessageFromList,
    onMessageUpdate: updateMessageInList,
    onReadUpdate: replaceMessages,
  });

  useEffect(() => {
    if (!username) return;

    const loadMessages = async () => {
      try {
        setError('');
        setIsLoading(true);
        const history = await fetchMessages();
        setMessages(history);
        await markMessagesRead(username);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [username]);

  const handleLogin = () => {
    const cleanUsername = draftUsername.trim();
    if (!cleanUsername) {
      setError('Please enter a username.');
      return;
    }
    localStorage.setItem('chat_username', cleanUsername);
    setUsername(cleanUsername);
    setError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_username');
    setUsername('');
    setMessages([]);
    setMessageText('');
  };

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text) return;

    try {
      setError('');
      setMessageText('');
      stopTyping();

      if (isConnected) {
        await sendSocketMessage({ username, text });
      } else {
        const message = await sendMessage({ username, text });
        mergeMessage(message);
      }
    } catch (sendError) {
      setError(sendError.message);
      setMessageText(text);
    }
  };

  const handleCopyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setError('');
    } catch {
      setError('Unable to copy message.');
    }
  };

  const handleEditMessage = async (message, text) => {
    try {
      setError('');
      const payload = { id: message.id, username, text };
      if (isConnected) {
        await editSocketMessage(payload);
      } else {
        const updatedMessage = await editMessage(payload);
        updateMessageInList(updatedMessage);
      }
    } catch (editError) {
      setError(editError.message);
      throw editError;
    }
  };

  const handleDeleteMessage = async (message) => {
    try {
      setError('');
      const payload = { id: message.id, username };
      if (isConnected) {
        await deleteSocketMessage(payload);
      } else {
        await deleteMessage(payload);
        removeMessageFromList(message.id);
      }
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  if (!username) {
    return (
      <>
        <LoginPanel
          username={draftUsername}
          setUsername={setDraftUsername}
          onLogin={handleLogin}
        />
        {error && <div className="toast">{error}</div>}
      </>
    );
  }

  return (
    <main className="app-shell">
      <ChatHeader
        username={username}
        isConnected={isConnected}
        onlineCount={onlineUsers.length}
        onLogout={handleLogout}
      />
      {error && <div className="toast">{error}</div>}
      <div className="chat-layout">
        <UserList onlineUsers={onlineUsers} />
        <section className="chat-panel">
          {isLoading ? (
            <div className="empty-state">Loading messages...</div>
          ) : (
            <MessageList
              messages={messages}
              username={username}
              typingUsers={typingUsers}
              onCopyMessage={handleCopyMessage}
              onDeleteMessage={handleDeleteMessage}
              onEditMessage={handleEditMessage}
            />
          )}
          <MessageComposer
            value={messageText}
            setValue={setMessageText}
            onSubmit={handleSend}
            onTyping={startTyping}
            onStopTyping={stopTyping}
            disabled={isLoading}
          />
        </section>
      </div>
    </main>
  );
};

export default App;
