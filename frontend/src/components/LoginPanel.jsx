import { MessageCircle } from 'lucide-react';

const LoginPanel = ({ username, setUsername, onLogin }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin();
  };

  return (
    <main className="login-screen">
      <section className="login-panel" aria-label="Chat login">
        <div className="brand-mark">
          <MessageCircle size={34} aria-hidden="true" />
        </div>
        <h1>Realtime Chat</h1>
        <p>Choose a display name to join the room.</p>
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={32}
            placeholder="Enter your name"
            autoComplete="name"
          />
          <button type="submit">Join chat</button>
        </form>
      </section>
    </main>
  );
};

export default LoginPanel;
