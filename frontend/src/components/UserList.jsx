import { Check, ChevronDown, Hash, Lock, MoreVertical, Phone, Trash2, UserCheck, X } from 'lucide-react';
import { useMemo, useState } from 'react';

const optionClass = (isActive) =>
  `flex min-h-11 w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left font-extrabold transition ${
    isActive
      ? 'border-[#1d6c8a] bg-[#e7f3f7] text-[#144b5d]'
      : 'border-[#dce4ef] bg-white text-[#344154] hover:bg-[#f8fafc]'
  }`;

const SlidePanel = ({ children, isOpen }) => (
  <div
    className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out ${
      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
    }`}
  >
    <div className="min-h-0">{children}</div>
  </div>
);

const DirectPresence = ({ isOnline }) => (
  <span
    className={`inline-grid h-[18px] w-[18px] flex-none place-items-center rounded-full ${
      isOnline ? 'bg-[#22a66c] text-white' : 'bg-[#c43d32]'
    }`}
    title={isOnline ? 'Online' : 'Offline'}
    aria-label={isOnline ? 'Online' : 'Offline'}
  >
    {isOnline && <Check size={12} strokeWidth={3} />}
  </span>
);

const UnreadBadge = ({ count }) => {
  if (!count) return null;
  const label = count > 99 ? '99+' : count;

  return (
    <span
      className="inline-grid h-6 min-w-6 flex-none place-items-center rounded-full bg-[#22a66c] px-2 text-xs font-extrabold leading-none text-white"
      aria-label={`${count} unread messages`}
    >
      {label}
    </span>
  );
};

const DirectRoomItem = ({
  activeRoomId,
  displayValue,
  isMenuOpen,
  isOnline,
  onRemove,
  onSelect,
  onToggleMenu,
  room,
}) => (
  <div
    className={`relative grid grid-cols-[1fr_36px] items-center rounded-lg text-sm font-bold ${
      activeRoomId === room.id ? 'bg-[#e7f3f7] text-[#144b5d]' : 'bg-[#eef3f8] text-[#344154]'
    }`}
  >
    <button
      className="flex min-h-10 min-w-0 items-center gap-2 rounded-l-lg px-3 py-2 text-left"
      type="button"
      onClick={onSelect}
    >
      <DirectPresence isOnline={isOnline} />
      <span className="min-w-0 truncate">{displayValue || room.name}</span>
      <span className="ml-auto">
        <UnreadBadge count={room.unreadCount} />
      </span>
    </button>
    <button
      className="inline-grid h-10 w-9 place-items-center rounded-r-lg text-[#687384] hover:bg-white/70"
      type="button"
      onClick={onToggleMenu}
      aria-label={`Open options for ${displayValue || room.name}`}
    >
      <MoreVertical size={17} />
    </button>
    {isMenuOpen && (
      <div className="absolute right-1 top-10 z-10 w-36 rounded-lg border border-[#dce4ef] bg-white p-1 shadow-[0_12px_30px_rgba(25,32,46,0.16)]">
        <button
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-bold text-[#8d2a1d] hover:bg-[#fff2ef]"
          type="button"
          onClick={onRemove}
        >
          <Trash2 size={15} />
          Remove
        </button>
      </div>
    )}
  </div>
);

const UserList = ({
  activeRoomId,
  activePanel,
  directPhone,
  directUsername,
  joinInviteCode,
  joinPassword,
  joinRoomCode,
  newRoomMaxMembers,
  newRoomName,
  newRoomPassword,
  onlineUsers,
  rooms,
  setActiveRoomId,
  setActivePanel,
  setDirectPhone,
  setDirectUsername,
  setJoinInviteCode,
  setJoinPassword,
  setJoinRoomCode,
  setNewRoomMaxMembers,
  setNewRoomName,
  setNewRoomPassword,
  onCreateDirectByPhone,
  onCreateDirectByUsername,
  onCreateRoom,
  onJoinRoom,
  onRemoveDirectRoom,
}) => {
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomAction, setRoomAction] = useState('');
  const [createdRoom, setCreatedRoom] = useState(null);
  const [createdRoomPassword, setCreatedRoomPassword] = useState('');
  const [openDirectMenuId, setOpenDirectMenuId] = useState('');

  const directRooms = useMemo(
    () => rooms.filter((room) => room.type === 'direct'),
    [rooms]
  );
  const groupRooms = useMemo(
    () => rooms.filter((room) => room.type !== 'direct'),
    [rooms]
  );
  const onlineUserSet = useMemo(() => new Set(onlineUsers), [onlineUsers]);

  const togglePanel = (panel) => {
    setOpenDirectMenuId('');
    setActivePanel(panel);
  };

  const handleSelectDirectRoom = (roomId) => {
    setOpenDirectMenuId('');
    setActiveRoomId(roomId);
  };

  const handleRemoveDirectRoom = (roomId) => {
    setOpenDirectMenuId('');
    onRemoveDirectRoom(roomId);
  };

  const handleCreateRoom = async () => {
    const passwordForSummary = newRoomPassword;
    const room = await onCreateRoom();
    if (!room) return;
    setCreatedRoom(room);
    setCreatedRoomPassword(passwordForSummary);
    setRoomAction('');
  };

  const handleJoinRoom = async () => {
    const room = await onJoinRoom();
    if (!room) return;
    setIsRoomModalOpen(false);
    setRoomAction('');
  };

  return (
    <>
      <aside
        className="min-h-0 overflow-y-auto rounded-lg border border-[#dce4ef] bg-white p-3.5 lg:p-[18px]"
        aria-label="Chat access"
      >
        <div className="grid gap-2">
          <button className={optionClass(activePanel === 'phone')} type="button" onClick={() => togglePanel('phone')}>
            <span className="flex items-center gap-2">
              <Phone size={17} />
              Chat by phone
            </span>
            <ChevronDown size={17} className={activePanel === 'phone' ? 'rotate-180 transition' : 'transition'} />
          </button>
          <SlidePanel isOpen={activePanel === 'phone'}>
            <div className="grid gap-2 border-x border-b border-[#dce4ef] px-3 py-3">
              {directRooms.length > 0 && (
                <div className="grid gap-1.5">
                  {directRooms.map((room) => (
                    <DirectRoomItem
                      activeRoomId={activeRoomId}
                      displayValue={room.peerPhone || room.peerUsername}
                      isMenuOpen={openDirectMenuId === `phone-${room.id}`}
                      isOnline={onlineUserSet.has(room.peerUsername)}
                      key={room.id}
                      onRemove={() => handleRemoveDirectRoom(room.id)}
                      onSelect={() => handleSelectDirectRoom(room.id)}
                      onToggleMenu={() =>
                        setOpenDirectMenuId(openDirectMenuId === `phone-${room.id}` ? '' : `phone-${room.id}`)
                      }
                      room={room}
                    />
                    ))}
                </div>
              )}
              <input
                className="min-h-10 rounded-lg border border-[#ccd7e5] px-3 outline-none focus:border-[#1d6c8a]"
                value={directPhone}
                onChange={(event) => setDirectPhone(event.target.value)}
                placeholder="Add new phone number"
              />
              <button
                className="rounded-lg bg-[#cd5f44] px-3 py-2 font-extrabold text-white disabled:opacity-50"
                type="button"
                disabled={!directPhone.trim()}
                onClick={onCreateDirectByPhone}
              >
                Start phone chat
              </button>
            </div>
          </SlidePanel>

          <button className={optionClass(activePanel === 'username')} type="button" onClick={() => togglePanel('username')}>
            <span className="flex items-center gap-2">
              <UserCheck size={17} />
              Chat by username
            </span>
            <ChevronDown size={17} className={activePanel === 'username' ? 'rotate-180 transition' : 'transition'} />
          </button>
          <SlidePanel isOpen={activePanel === 'username'}>
            <div className="grid gap-2 border-x border-b border-[#dce4ef] px-3 py-3">
              {directRooms.length > 0 && (
                <div className="grid gap-1.5">
                  {directRooms.map((room) => (
                    <DirectRoomItem
                      activeRoomId={activeRoomId}
                      displayValue={room.peerUsername || room.peerPhone}
                      isMenuOpen={openDirectMenuId === `username-${room.id}`}
                      isOnline={onlineUserSet.has(room.peerUsername)}
                      key={room.id}
                      onRemove={() => handleRemoveDirectRoom(room.id)}
                      onSelect={() => handleSelectDirectRoom(room.id)}
                      onToggleMenu={() =>
                        setOpenDirectMenuId(
                          openDirectMenuId === `username-${room.id}` ? '' : `username-${room.id}`
                        )
                      }
                      room={room}
                    />
                  ))}
                </div>
              )}
              <input
                className="min-h-10 rounded-lg border border-[#ccd7e5] px-3 outline-none focus:border-[#1d6c8a]"
                value={directUsername}
                onChange={(event) => setDirectUsername(event.target.value)}
                placeholder="Add new username"
              />
              <button
                className="rounded-lg bg-[#cd5f44] px-3 py-2 font-extrabold text-white disabled:opacity-50"
                type="button"
                disabled={!directUsername.trim()}
                onClick={onCreateDirectByUsername}
              >
                Start username chat
              </button>
            </div>
          </SlidePanel>

          <button className={optionClass(activePanel === 'rooms')} type="button" onClick={() => togglePanel('rooms')}>
            <span className="flex items-center gap-2">
              <Hash size={17} />
              Room chat
            </span>
            <ChevronDown size={17} className={activePanel === 'rooms' ? 'rotate-180 transition' : 'transition'} />
          </button>
          <SlidePanel isOpen={activePanel === 'rooms'}>
            <div className="grid gap-2 border-x border-b border-[#dce4ef] px-3 py-3">
              {groupRooms.map((room) => (
                <button
                  className={`flex min-h-10 items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold ${
                    activeRoomId === room.id ? 'bg-[#e7f3f7] text-[#144b5d]' : 'bg-[#eef3f8] text-[#344154]'
                  }`}
                  key={room.id}
                  type="button"
                  onClick={() => setActiveRoomId(room.id)}
                >
                  <span className="min-w-0 truncate">{room.name}</span>
                  <span className="flex items-center gap-1.5 text-xs text-[#687384]">
                    {room.roomCode}
                    {room.hasPassword && <Lock size={14} />}
                  </span>
                </button>
              ))}
              <button
                className="rounded-lg bg-[#1d6c8a] px-3 py-2 font-extrabold text-white"
                type="button"
                onClick={() => {
                  setIsRoomModalOpen(true);
                  setRoomAction('');
                }}
              >
                Open room options
              </button>
            </div>
          </SlidePanel>
        </div>
      </aside>

      {isRoomModalOpen && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-[#18202f]/35 p-4 backdrop-blur-sm">
          <section className="max-h-[88vh] w-full max-w-[520px] overflow-y-auto rounded-lg border border-[#dce4ef] bg-white p-4 shadow-[0_24px_70px_rgba(25,32,46,0.2)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="m-0 text-lg font-bold">Room chat</h2>
              <button
                className="inline-grid h-9 w-9 place-items-center rounded-lg bg-[#eef3f8] text-[#344154]"
                type="button"
                onClick={() => setIsRoomModalOpen(false)}
                aria-label="Close room options"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                className={`rounded-lg px-3 py-2.5 font-extrabold ${
                  roomAction === 'create' ? 'bg-[#1d6c8a] text-white' : 'bg-[#eef3f8] text-[#344154]'
                }`}
                type="button"
                onClick={() => {
                  setRoomAction(roomAction === 'create' ? '' : 'create');
                  setCreatedRoom(null);
                }}
              >
                Create room
              </button>
              <button
                className={`rounded-lg px-3 py-2.5 font-extrabold ${
                  roomAction === 'join' ? 'bg-[#18202f] text-white' : 'bg-[#eef3f8] text-[#344154]'
                }`}
                type="button"
                onClick={() => {
                  setRoomAction(roomAction === 'join' ? '' : 'join');
                  setCreatedRoom(null);
                }}
              >
                Join room
              </button>
            </div>

            <SlidePanel isOpen={roomAction === 'create'}>
              <div className="mt-4 grid gap-2">
                <input
                  className="min-h-11 rounded-lg border border-[#ccd7e5] px-3 outline-none focus:border-[#1d6c8a]"
                  value={newRoomName}
                  onChange={(event) => setNewRoomName(event.target.value)}
                  placeholder="Room name"
                />
                <input
                  className="min-h-11 rounded-lg border border-[#ccd7e5] px-3 outline-none focus:border-[#1d6c8a]"
                  value={newRoomPassword}
                  onChange={(event) => setNewRoomPassword(event.target.value)}
                  placeholder="Optional room password"
                  type="password"
                />
                <input
                  className="min-h-11 rounded-lg border border-[#ccd7e5] px-3 outline-none focus:border-[#1d6c8a]"
                  value={newRoomMaxMembers}
                  onChange={(event) => setNewRoomMaxMembers(event.target.value)}
                  min={2}
                  max={500}
                  placeholder="Number of members"
                  type="number"
                />
                <button
                  className="rounded-lg bg-[#1d6c8a] px-3 py-3 font-extrabold text-white disabled:opacity-50"
                  type="button"
                  disabled={!newRoomName.trim()}
                  onClick={handleCreateRoom}
                >
                  Create room
                </button>
              </div>
            </SlidePanel>

            <SlidePanel isOpen={roomAction === 'join'}>
              <div className="mt-4 grid gap-2">
                <input
                  className="min-h-11 rounded-lg border border-[#ccd7e5] px-3 uppercase outline-none focus:border-[#1d6c8a]"
                  value={joinRoomCode}
                  onChange={(event) => setJoinRoomCode(event.target.value.toUpperCase())}
                  placeholder="Room unique key"
                />
                <input
                  className="min-h-11 rounded-lg border border-[#ccd7e5] px-3 outline-none focus:border-[#1d6c8a]"
                  value={joinPassword}
                  onChange={(event) => setJoinPassword(event.target.value)}
                  placeholder="Password if room has one"
                  type="password"
                />
                <input
                  className="min-h-11 rounded-lg border border-[#ccd7e5] px-3 outline-none focus:border-[#1d6c8a]"
                  value={joinInviteCode}
                  onChange={(event) => setJoinInviteCode(event.target.value)}
                  placeholder="Invite code if shared"
                />
                <button
                  className="rounded-lg bg-[#18202f] px-3 py-3 font-extrabold text-white disabled:opacity-50"
                  type="button"
                  disabled={!joinRoomCode.trim() && !joinInviteCode.trim()}
                  onClick={handleJoinRoom}
                >
                  Join room
                </button>
              </div>
            </SlidePanel>

            {createdRoom && (
              <div className="mt-4 rounded-lg border border-[#dce4ef] bg-[#f8fafc] p-3">
                <h3 className="m-0 mb-2 text-base font-bold">Room created</h3>
                <div className="grid gap-1.5 text-sm text-[#344154]">
                  <span>Name: {createdRoom.name}</span>
                  <span>Password: {createdRoomPassword || 'No password'}</span>
                  <span>Unique key: {createdRoom.roomCode}</span>
                  <span>Members: {createdRoom.memberCount}/{createdRoom.maxMembers}</span>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
};

export default UserList;
