import { Eye, EyeOff, LogIn, MessageCircle, UserPlus } from 'lucide-react';
import { useState } from 'react';

const LoginPanel = ({
  authMode,
  confirmPassword,
  password,
  phone,
  setAuthMode,
  setConfirmPassword,
  setPassword,
  setPhone,
  setUsername,
  username,
  onSubmit,
}) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const passwordType = isPasswordVisible ? 'text' : 'password';
  const confirmPasswordType = isConfirmPasswordVisible ? 'text' : 'password';

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
        <p className="mt-2 mb-7 text-[#687384]">
          Sign in or create an account to start chatting.
        </p>
        <div className="mb-4 grid grid-cols-2 rounded-lg border border-[#dce4ef] bg-[#eef3f8] p-1">
          <button
            className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 font-bold ${
              authMode === 'login' ? 'bg-white text-[#18202f] shadow-sm' : 'text-[#687384]'
            }`}
            type="button"
            onClick={() => setAuthMode('login')}
          >
            <LogIn size={16} />
            Login
          </button>
          <button
            className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 font-bold ${
              authMode === 'signup' ? 'bg-white text-[#18202f] shadow-sm' : 'text-[#687384]'
            }`}
            type="button"
            onClick={() => setAuthMode('signup')}
          >
            <UserPlus size={16} />
            Signup
          </button>
        </div>
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
            placeholder={authMode === 'login' ? 'Username or phone number' : 'Choose a username'}
            autoComplete={authMode === 'login' ? 'username' : 'nickname'}
          />
          {authMode === 'signup' && (
            <>
              <label className="font-bold" htmlFor="phone">
                Phone number
              </label>
              <input
                className="w-full rounded-lg border border-[#ccd7e5] bg-white px-[15px] py-3.5 text-[#18202f] outline-none focus:border-[#1d6c8a] focus:shadow-[0_0_0_3px_rgba(29,108,138,0.14)]"
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                maxLength={20}
                placeholder="+919876543210"
                autoComplete="tel"
              />
            </>
          )}
          <label className="font-bold" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              className="w-full rounded-lg border border-[#ccd7e5] bg-white py-3.5 pr-12 pl-[15px] text-[#18202f] outline-none focus:border-[#1d6c8a] focus:shadow-[0_0_0_3px_rgba(29,108,138,0.14)]"
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              placeholder="At least 6 characters"
              type={passwordType}
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
            />
            <button
              className="absolute top-1/2 right-2 inline-grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-[#687384] hover:bg-[#eef3f8]"
              type="button"
              onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            >
              {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {authMode === 'signup' && (
            <>
              <label className="font-bold" htmlFor="confirm-password">
                Confirm password
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-[#ccd7e5] bg-white py-3.5 pr-12 pl-[15px] text-[#18202f] outline-none focus:border-[#1d6c8a] focus:shadow-[0_0_0_3px_rgba(29,108,138,0.14)]"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={6}
                  placeholder="Re-enter password"
                  type={confirmPasswordType}
                  autoComplete="new-password"
                />
                <button
                  className="absolute top-1/2 right-2 inline-grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-[#687384] hover:bg-[#eef3f8]"
                  type="button"
                  onClick={() => setIsConfirmPasswordVisible((isVisible) => !isVisible)}
                  aria-label={isConfirmPasswordVisible ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {isConfirmPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </>
          )}
          <button
            className="rounded-lg border-0 bg-[#1d6c8a] px-[18px] py-3.5 font-extrabold text-white"
            type="submit"
          >
            {authMode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  );
};

export default LoginPanel;
