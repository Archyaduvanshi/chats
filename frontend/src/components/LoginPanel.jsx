import { MessageCircle } from 'lucide-react';

const LoginPanel = ({ username, setUsername, onLogin }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin();
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f8fafc] bg-[linear-gradient(135deg,rgba(29,108,138,0.14),transparent_38%),linear-gradient(315deg,rgba(205,95,68,0.14),transparent_42%)] p-6">
      <section
        className="w-full max-w-[420px] rounded-lg border border-[#dce4ef] bg-white p-6 shadow-[0_24px_70px_rgba(25,32,46,0.1)] sm:p-8"
        aria-label="Chat login"
      >
        <div className="grid h-[58px] w-[58px] place-items-center rounded-lg bg-[#144b5d] text-white">
          <MessageCircle size={34} aria-hidden="true" />
        </div>
        <h1 className="mt-6 mb-0 text-3xl font-bold">Realtime Chat</h1>
        <p className="mt-2 mb-7 text-[#687384]">Choose a display name to join the room.</p>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <label className="font-bold" htmlFor="username">
            Username
          </label>
          <input
            className="w-full rounded-lg border border-[#ccd7e5] bg-white px-[15px] py-3.5 text-[#18202f] outline-none focus:border-[#1d6c8a] focus:shadow-[0_0_0_3px_rgba(29,108,138,0.14)]"
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={32}
            placeholder="Enter your name"
            autoComplete="name"
          />
          <button
            className="rounded-lg border-0 bg-[#1d6c8a] px-[18px] py-3.5 font-extrabold text-white"
            type="submit"
          >
            Join chat
          </button>
        </form>
      </section>
    </main>
  );
};

export default LoginPanel;
