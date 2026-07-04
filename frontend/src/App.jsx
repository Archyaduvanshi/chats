import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import ChatHeader from './components/ChatHeader';
import LoginPanel from './components/LoginPanel';
import MessageComposer from './components/MessageComposer';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import { useChatSocket } from './hooks/useChatSocket';
import {
  createDirectRoom,
  createRoom,
  deleteMessage,
  editMessage,
  fetchMessages,
  fetchRooms,
  joinRoom,
  login,
  markMessagesRead,
  removeDirectRoom,
  sendMessage,
  signup,
} from './services/api';

const App = () => {
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem('chat_session');
    return stored ? JSON.parse(stored) : null;
  });
  const [authMode, setAuthMode] = useState('login');
  const [draftUsername, setDraftUsername] = useState(
    () => session?.user?.username || ''
  );
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState('');
  const [activePanel, setActivePanel] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [newRoomMaxMembers, setNewRoomMaxMembers] = useState('50');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [directUsername, setDirectUsername] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(session));

  const token = session?.token || '';
  const username = session?.user?.username || '';

  const clearSession = useCallback(() => {
    localStorage.removeItem('chat_session');
    setSession(null);
    setRooms([]);
    setActiveRoomId('');
    setMessages([]);
    setMessageText('');
    setConfirmPassword('');
    setIsLoading(false);
  }, []);

  const handleAuthError = useCallback(
    (requestError) => {
      if (requestError.status !== 401) return false;
      clearSession();
      setError('Session expired. Please log in again.');
      return true;
    },
    [clearSession]
  );

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

  const updateRoomUnreadCount = useCallback(({ roomId, unreadCount }) => {
    setRooms((currentRooms) =>
      currentRooms.map((room) =>
        room.id === roomId && room.unreadCount !== unreadCount
          ? { ...room, unreadCount }
          : room
      )
    );
  }, []);

  const activeRoom = rooms.find((room) => room.id === activeRoomId);
  const selectedRoom = activeRoom || null;
  const selectedRoomId = selectedRoom?.id || '';
  const isDirectChat = selectedRoom?.type === 'direct';

  const reloadRooms = useCallback(async () => {
    if (!token) return;
    try {
      const nextRooms = await fetchRooms(token);
      setRooms(nextRooms);
      setActiveRoomId((currentRoomId) =>
        nextRooms.some((room) => room.id === currentRoomId) ? currentRoomId : ''
      );
    } catch (loadError) {
      if (handleAuthError(loadError)) return;
      setError(loadError.message);
    }
  }, [handleAuthError, token]);

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
    token,
    username,
    roomId: selectedRoom?.id || '',
    onMessage: mergeMessage,
    onMessageDelete: removeMessageFromList,
    onMessageUpdate: updateMessageInList,
    onReadUpdate: replaceMessages,
    onRoomsRefresh: reloadRooms,
    onUnreadUpdate: updateRoomUnreadCount,
  });

  useEffect(() => {
    if (!session) return;

    const loadAccess = async () => {
      let preferredRoomId = '';
      try {
        setError('');
        const params = new URLSearchParams(window.location.search);
        const inviteRoomId = params.get('room');
        const inviteCode = params.get('invite');
        let nextRooms = await fetchRooms(token);
        if (inviteRoomId && inviteCode) {
          const room = await joinRoom({ roomId: inviteRoomId, inviteCode, token });
          preferredRoomId = room.id;
          nextRooms = await fetchRooms(token);
          setActivePanel('rooms');
          window.history.replaceState({}, '', window.location.pathname);
        }
        setRooms(nextRooms);
        setActiveRoomId((currentRoomId) =>
          preferredRoomId || (nextRooms.some((room) => room.id === currentRoomId) ? currentRoomId : '')
        );
      } catch (loadError) {
        if (handleAuthError(loadError)) return;
        setError(loadError.message);
        setIsLoading(false);
      } finally {
        if (!preferredRoomId) {
          setIsLoading(false);
        }
      }
    };

    loadAccess();
  }, [handleAuthError, session, token]);

  useEffect(() => {
    if (!session || !selectedRoomId) return;

    let isCurrentLoad = true;

    const loadMessages = async () => {
      try {
        setError('');
        setIsLoading(true);
        const history = await fetchMessages({ roomId: selectedRoomId, token });
        if (!isCurrentLoad) return;
        setMessages(history);
        const readMessages = await markMessagesRead({ roomId: selectedRoomId, token });
        if (!isCurrentLoad) return;
        setMessages(readMessages);
        updateRoomUnreadCount({ roomId: selectedRoomId, unreadCount: 0 });
      } catch (loadError) {
        if (handleAuthError(loadError)) return;
        setError(loadError.message);
      } finally {
        if (isCurrentLoad) {
          setIsLoading(false);
        }
      }
    };

    loadMessages();

    return () => {
      isCurrentLoad = false;
    };
  }, [handleAuthError, selectedRoomId, session, token, updateRoomUnreadCount]);

  const handleAuthSubmit = async () => {
    const cleanUsername = draftUsername.trim();
    if (!cleanUsername || !password) {
      setError('Username or phone and password are required.');
      return;
    }
    if (authMode === 'signup' && !phone.trim()) {
      setError('Phone number is required for signup.');
      return;
    }
    if (authMode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setError('');
      const nextSession =
        authMode === 'login'
          ? await login({ username: cleanUsername, password })
          : await signup({ username: cleanUsername, phone, password });

      localStorage.setItem('chat_session', JSON.stringify(nextSession));
      setSession(nextSession);
      setPassword('');
      setConfirmPassword('');
      setPhone('');
    } catch (authError) {
      setError(authError.message);
    }
  };

  const handleLogout = () => {
    clearSession();
  };

  const handlePanelSelect = (panel) => {
    setActivePanel(panel);
    setActiveRoomId('');
    setMessages([]);
    setMessageText('');
    setIsLoading(false);
  };

  const handleConversationBack = () => {
    setActiveRoomId('');
    setMessages([]);
    setMessageText('');
    setIsLoading(false);
    stopTyping();
  };

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text) return;
    if (!selectedRoom) {
      setError(
        activePanel === 'rooms'
          ? 'Join a room to start conversation.'
          : 'Select anyone to start conversation.'
      );
      return;
    }

    try {
      setError('');
      setMessageText('');
      stopTyping();

      if (isConnected) {
        await sendSocketMessage({ roomId: activeRoomId, text });
      } else {
        const message = await sendMessage({ roomId: activeRoomId, text, token });
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
      const payload = { id: message.id, text, token };
      if (isConnected) {
        await editSocketMessage({ id: message.id, text });
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
      if (isConnected) {
        await deleteSocketMessage({ id: message.id });
      } else {
        await deleteMessage({ id: message.id, token });
        removeMessageFromList(message.id);
      }
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const refreshRooms = async (preferredRoomId = '') => {
    const nextRooms = await fetchRooms(token);
    setRooms(nextRooms);
    setActiveRoomId(preferredRoomId);
  };

  const handleCreateRoom = async () => {
    try {
      setError('');
      const room = await createRoom({
        name: newRoomName,
        password: newRoomPassword,
        maxMembers: newRoomMaxMembers,
        token,
      });
      setNewRoomName('');
      setNewRoomPassword('');
      setNewRoomMaxMembers('50');
      await refreshRooms(room.id);
      return room;
    } catch (roomError) {
      setError(roomError.message);
      return null;
    }
  };

  const handleJoinRoom = async () => {
    try {
      setError('');
      const room = await joinRoom({
        roomId: joinRoomId,
        roomCode: joinRoomCode,
        password: joinPassword,
        inviteCode: joinInviteCode,
        token,
      });
      setJoinRoomId('');
      setJoinRoomCode('');
      setJoinPassword('');
      setJoinInviteCode('');
      await refreshRooms(room.id);
      return room;
    } catch (roomError) {
      setError(roomError.message);
      return null;
    }
  };

  const handleCreateDirectRoom = async (identifier, clearInput) => {
    try {
      setError('');
      const room = await createDirectRoom({ username: identifier, token });
      clearInput();
      await refreshRooms(room.id);
      return room;
    } catch (roomError) {
      setError(roomError.message);
      return null;
    }
  };

  const handleRemoveDirectRoom = async (roomId) => {
    try {
      setError('');
      await removeDirectRoom({ roomId, token });
      setRooms((currentRooms) => currentRooms.filter((room) => room.id !== roomId));
      if (activeRoomId === roomId) {
        setActiveRoomId('');
        setMessages([]);
        setMessageText('');
        setIsLoading(false);
        stopTyping();
      }
    } catch (roomError) {
      if (handleAuthError(roomError)) return;
      setError(roomError.message);
    }
  };

  const isPeerOnline = isDirectChat && onlineUsers.includes(selectedRoom.peerUsername);
  const activeRoomTitle = isDirectChat
    ? selectedRoom?.peerUsername || selectedRoom?.peerPhone || selectedRoom?.name
    : selectedRoom?.name;
  const inviteLink = selectedRoom
    ? `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(
        selectedRoom.id
      )}&invite=${encodeURIComponent(selectedRoom.inviteCode)}`
    : '';

  if (!session) {
    return (
      <>
        <LoginPanel
          authMode={authMode}
          confirmPassword={confirmPassword}
          password={password}
          phone={phone}
          setAuthMode={setAuthMode}
          setConfirmPassword={setConfirmPassword}
          setPassword={setPassword}
          setPhone={setPhone}
          username={draftUsername}
          setUsername={setDraftUsername}
          onSubmit={handleAuthSubmit}
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
      <div className={`grid min-h-0 px-4 py-4 sm:px-6 lg:px-10 lg:py-[18px] ${
        selectedRoom ? '' : 'place-items-center'
      }`}>
        {!selectedRoom ? (
          <div className="w-full max-w-[420px]">
            <UserList
              activeRoomId={activeRoomId}
              activePanel={activePanel}
              directPhone={directPhone}
              directUsername={directUsername}
              joinInviteCode={joinInviteCode}
              joinPassword={joinPassword}
              joinRoomCode={joinRoomCode}
              joinRoomId={joinRoomId}
              newRoomMaxMembers={newRoomMaxMembers}
              newRoomName={newRoomName}
              newRoomPassword={newRoomPassword}
              onlineUsers={onlineUsers}
              rooms={rooms}
              setActiveRoomId={setActiveRoomId}
              setActivePanel={handlePanelSelect}
              setDirectPhone={setDirectPhone}
              setDirectUsername={setDirectUsername}
              setJoinInviteCode={setJoinInviteCode}
              setJoinPassword={setJoinPassword}
              setJoinRoomCode={setJoinRoomCode}
              setJoinRoomId={setJoinRoomId}
              setNewRoomMaxMembers={setNewRoomMaxMembers}
              setNewRoomName={setNewRoomName}
              setNewRoomPassword={setNewRoomPassword}
              onCreateDirectByPhone={() =>
                handleCreateDirectRoom(directPhone, () => setDirectPhone(''))
              }
              onCreateDirectByUsername={() =>
                handleCreateDirectRoom(directUsername, () => setDirectUsername(''))
              }
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onRemoveDirectRoom={handleRemoveDirectRoom}
            />
          </div>
        ) : (
        <section className="grid min-h-[72vh] grid-rows-[1fr_auto] overflow-hidden rounded-lg border border-[#dce4ef] bg-white lg:min-h-0">
          <div className="border-b border-[#dce4ef] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  className="inline-grid h-9 w-9 flex-none place-items-center rounded-lg bg-[#eef3f8] text-[#344154]"
                  type="button"
                  onClick={handleConversationBack}
                  aria-label="Back to chat options"
                >
                  <ArrowLeft size={18} />
                </button>
                {isDirectChat && (
                  <span
                    className={`h-[10px] w-[10px] flex-none rounded-full ${
                      isPeerOnline ? 'bg-[#22a66c]' : 'bg-[#c43d32]'
                    }`}
                    title={isPeerOnline ? 'Online' : 'Offline'}
                    aria-label={isPeerOnline ? 'Online' : 'Offline'}
                  />
                )}
                <h2 className="m-0 min-w-0 truncate text-base font-bold">{activeRoomTitle || 'Select a room'}</h2>
              </div>
              {selectedRoom && !isDirectChat && (
                <div className="flex max-w-full flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-[#eef3f8] px-3 py-1.5 text-xs font-bold text-[#344154]">
                    Code: {selectedRoom.roomCode}
                  </span>
                  <span className="rounded-lg bg-[#eef3f8] px-3 py-1.5 text-xs font-bold text-[#687384]">
                    {selectedRoom.memberCount}/{selectedRoom.maxMembers}
                  </span>
                  <button
                    className="max-w-full truncate rounded-lg bg-[#eef3f8] px-3 py-1.5 text-xs font-bold text-[#687384]"
                    type="button"
                    onClick={() => navigator.clipboard.writeText(inviteLink)}
                    title={inviteLink}
                  >
                    Copy invite link
                  </button>
                </div>
              )}
            </div>
          </div>
          {isLoading ? (
            <div className="m-auto text-center text-[#687384]">Loading messages...</div>
          ) : (
            <div className="grid min-h-0 grid-rows-[auto_1fr]">
              {selectedRoom.type !== 'direct' && (
                <section className="border-b border-[#dce4ef] bg-[#f8fafc] px-4 py-3 text-sm text-[#344154]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-white px-2.5 py-1 font-bold">
                      Key: {selectedRoom.roomCode}
                    </span>
                    <span className="rounded-lg bg-white px-2.5 py-1 font-bold">
                      Members: {selectedRoom.memberCount}/{selectedRoom.maxMembers}
                    </span>
                    <span className="rounded-lg bg-white px-2.5 py-1 font-bold">
                      Created by: {selectedRoom.admins?.join(', ') || 'Room admin'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedRoom.members?.map((member) => (
                      <span
                        className="rounded-lg bg-[#eef3f8] px-2.5 py-1 text-xs font-bold text-[#687384]"
                        key={member}
                      >
                        {member}
                      </span>
                    ))}
                  </div>
                </section>
              )}
              <MessageList
                isDirectChat={isDirectChat}
                isPeerOnline={isPeerOnline}
                messages={messages}
                username={username}
                typingUsers={typingUsers}
                onCopyMessage={handleCopyMessage}
                onDeleteMessage={handleDeleteMessage}
                onEditMessage={handleEditMessage}
              />
            </div>
          )}
          <MessageComposer
            value={messageText}
            setValue={setMessageText}
            onSubmit={handleSend}
            onTyping={startTyping}
            onStopTyping={stopTyping}
            disabled={!selectedRoom}
          />
        </section>
        )}
      </div>
    </main>
  );
};

export default App;
