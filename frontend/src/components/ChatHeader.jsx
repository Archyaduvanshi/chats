import { LogOut, Wifi, WifiOff } from 'lucide-react';

const ChatHeader = ({ username, isConnected, onlineCount, onLogout }) => (
  <header className="chat-header">
    <div>
      <span className="eyebrow">Socket.io room</span>
      <h1>Realtime Chat</h1>
    </div>
    <div className="header-actions">
      <span className={isConnected ? 'status online' : 'status offline'}>
        {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
        {isConnected ? 'Online' : 'Offline'}
      </span>
      <span className="user-pill">{username}</span>
      <span className="user-pill">{onlineCount} active</span>
      <button className="icon-button" type="button" onClick={onLogout} aria-label="Logout">
        <LogOut size={18} />
      </button>
    </div>
  </header>
);

export default ChatHeader;
