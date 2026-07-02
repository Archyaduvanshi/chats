import { LogOut, Wifi, WifiOff } from 'lucide-react';

const ChatHeader = ({ username, isConnected, onlineCount, onLogout }) => (
  <header className="flex flex-col items-start justify-between gap-[18px] border-b border-[#dce4ef] bg-white px-4 py-[18px] sm:px-6 lg:flex-row lg:items-center lg:px-10">
    <div>
      <span className="mb-1 block text-[0.76rem] font-extrabold uppercase text-[#697386]">
        Socket.io room
      </span>
      <h1 className="m-0 text-[1.45rem] font-bold">Realtime Chat</h1>
    </div>
    <div className="flex w-full flex-wrap items-center justify-start gap-2.5 lg:w-auto lg:justify-end">
      <span
        className={`inline-flex min-h-[34px] items-center gap-1.5 whitespace-nowrap rounded-full px-[11px] py-[7px] text-sm font-bold ${
          isConnected ? 'bg-[#dff7e9] text-[#14623a]' : 'bg-[#ffe8e4] text-[#8d2a1d]'
        }`}
      >
        {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
        {isConnected ? 'Online' : 'Offline'}
      </span>
      <span className="inline-flex min-h-[34px] items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eef3f8] px-[11px] py-[7px] text-sm font-bold text-[#344154]">
        {username}
      </span>
      <span className="inline-flex min-h-[34px] items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eef3f8] px-[11px] py-[7px] text-sm font-bold text-[#344154]">
        {onlineCount} active
      </span>
      <button
        className="inline-grid h-9 w-9 place-items-center rounded-lg border-0 bg-[#18202f] text-white"
        type="button"
        onClick={onLogout}
        aria-label="Logout"
      >
        <LogOut size={18} />
      </button>
    </div>
  </header>
);

export default ChatHeader;
