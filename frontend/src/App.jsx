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
        {error && (
          <div className="fixed top-4 left-1/2 z-10 max-w-[min(92vw,520px)] -translate-x-1/2 rounded-lg bg-[#8d2a1d] px-3.5 py-3 text-white shadow-[0_16px_40px_rgba(25,32,46,0.18)]">
            {error}
          </div>
        )}
      </>
    );
  }

  return (
    <main className="grid min-h-screen grid-rows-[auto_1fr]">
      <ChatHeader
        username={username}
        isConnected={isConnected}
        onlineCount={onlineUsers.length}
        onLogout={handleLogout}
      />
      {error && (
        <div className="fixed top-4 left-1/2 z-10 max-w-[min(92vw,520px)] -translate-x-1/2 rounded-lg bg-[#8d2a1d] px-3.5 py-3 text-white shadow-[0_16px_40px_rgba(25,32,46,0.18)]">
          {error}
        </div>
      )}
      <div className="grid min-h-0 grid-cols-1 grid-rows-[auto_1fr] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(190px,260px)_1fr] lg:grid-rows-1 lg:gap-[18px] lg:px-10 lg:py-[18px]">
        <UserList onlineUsers={onlineUsers} />
        <section className="grid min-h-[68vh] grid-rows-[1fr_auto] overflow-hidden rounded-lg border border-[#dce4ef] bg-white lg:min-h-0">
          {isLoading ? (
            <div className="m-auto text-center text-[#687384]">Loading messages...</div>
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
