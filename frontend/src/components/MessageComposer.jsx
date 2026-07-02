import { Send } from 'lucide-react';

const MessageComposer = ({
  value,
  setValue,
  onSubmit,
  onTyping,
  onStopTyping,
  disabled,
}) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      className="grid grid-cols-[1fr_46px] gap-2.5 border-t border-[#dce4ef] bg-white p-3.5"
      onSubmit={handleSubmit}
    >
      <input
        className="min-h-[46px] w-full rounded-lg border border-[#ccd7e5] bg-white px-3.5 text-[#18202f] outline-none focus:border-[#1d6c8a] focus:shadow-[0_0_0_3px_rgba(29,108,138,0.14)]"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          onTyping();
        }}
        onBlur={onStopTyping}
        placeholder="Type a message"
        maxLength={1000}
        disabled={disabled}
      />
      <button
        className="inline-grid h-[46px] w-[46px] place-items-center rounded-lg border-0 bg-[#cd5f44] text-white disabled:cursor-not-allowed disabled:opacity-50"
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        <Send size={18} />
      </button>
    </form>
  );
};

export default MessageComposer;
