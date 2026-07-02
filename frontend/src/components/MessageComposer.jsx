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
    <form className="composer" onSubmit={handleSubmit}>
      <input
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
      <button type="submit" disabled={disabled || !value.trim()} aria-label="Send message">
        <Send size={18} />
      </button>
    </form>
  );
};

export default MessageComposer;
