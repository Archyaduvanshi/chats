import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckCheck, Copy, MoreVertical, Pencil, Trash2, X } from 'lucide-react';
import { formatMessageTime } from '../utils/date';

const EDIT_LIMIT_MS = 60 * 1000;

const MessageBubble = ({
  message,
  isDirectChat,
  isOwn,
  isPeerOnline,
  onCopy,
  onDelete,
  onEdit,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditWindowOpen, setIsEditWindowOpen] = useState(false);
  const menuRef = useRef(null);

  const canEdit = useMemo(
    () => isOwn && isEditWindowOpen,
    [isEditWindowOpen, isOwn]
  );

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isOwn) return undefined;

    const updateEditWindow = () => {
      const isStillOpen =
        Date.now() - new Date(message.createdAt).getTime() <= EDIT_LIMIT_MS;
      setIsEditWindowOpen(isStillOpen);
      if (!isStillOpen) {
        setIsEditing(false);
      }
    };

    const startTimer = setTimeout(updateEditWindow, 0);
    const timer = setInterval(updateEditWindow, 1000);
    return () => {
      clearTimeout(startTimer);
      clearInterval(timer);
    };
  }, [isOwn, message.createdAt]);

  const handleCopy = () => {
    onCopy(message.text);
    setIsMenuOpen(false);
  };

  const handleEditStart = () => {
    if (!canEdit) return;
    setEditText(message.text);
    setIsEditing(true);
    setIsMenuOpen(false);
  };

  const handleEditSave = async () => {
    const nextText = editText.trim();
    if (!nextText || nextText === message.text) {
      setIsEditing(false);
      setEditText(message.text);
      return;
    }

    setIsSaving(true);
    try {
      await onEdit(message, nextText);
      setIsEditing(false);
    } catch {
      setEditText(message.text);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onDelete(message);
  };

  const bubbleClassName = `relative min-w-[min(220px,88vw)] max-w-[88%] rounded-lg px-3.5 py-3 sm:max-w-[min(68%,680px)] ${
    isOwn ? 'bg-[#1d6c8a] text-white' : 'bg-[#eef3f8] text-[#18202f]'
  }`;
  const isReadByPeer = message.readBy?.some((reader) => reader !== message.username);
  const StatusIcon = isPeerOnline || isReadByPeer ? CheckCheck : Check;

  return (
    <article className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={bubbleClassName}>
        <div className="mb-[7px] flex items-center justify-between gap-3 text-[0.8rem]">
          <strong>{message.username}</strong>
          <div className="inline-flex flex-none items-center gap-1.5">
            <span className="opacity-80">{formatMessageTime(message.createdAt)}</span>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className={`inline-grid h-7 w-7 place-items-center rounded-lg border-0 text-inherit ${
                  isOwn ? 'bg-white/15' : 'bg-[#18202f]/10'
                }`}
                onClick={() => setIsMenuOpen((current) => !current)}
                aria-label="Message options"
                aria-expanded={isMenuOpen}
              >
                <MoreVertical size={16} />
              </button>
              {isMenuOpen && (
                <div className="absolute top-[calc(100%+6px)] right-0 z-40 w-[142px] rounded-lg border border-[#dce4ef] bg-white p-1.5 text-[#18202f] shadow-[0_16px_40px_rgba(25,32,46,0.16)]">
                  <button
                    className="flex min-h-[34px] w-full items-center gap-2 rounded-md border-0 bg-transparent px-2 py-[7px] text-left text-inherit hover:bg-[#eef3f8]"
                    type="button"
                    onClick={handleCopy}
                  >
                    <Copy size={15} />
                    Copy
                  </button>
                  {isOwn && (
                    <>
                      <button
                        className="flex min-h-[34px] w-full items-center gap-2 rounded-md border-0 bg-transparent px-2 py-[7px] text-left text-inherit hover:bg-[#eef3f8] disabled:cursor-not-allowed disabled:opacity-45"
                        type="button"
                        onClick={handleEditStart}
                        disabled={!canEdit}
                      >
                        <Pencil size={15} />
                        Edit
                      </button>
                      <button
                        className="flex min-h-[34px] w-full items-center gap-2 rounded-md border-0 bg-transparent px-2 py-[7px] text-left text-[#9b2f20] hover:bg-[#eef3f8]"
                        type="button"
                        onClick={handleDelete}
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {isEditing ? (
          <div className="grid grid-cols-[1fr_34px_34px] gap-[7px]">
            <input
              className={`min-h-9 min-w-0 rounded-lg px-2.5 outline-none ${
                isOwn
                  ? 'border border-white/35 bg-white text-[#18202f]'
                  : 'border border-[#18202f]/20 bg-white text-[#18202f]'
              }`}
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              maxLength={1000}
              autoFocus
              disabled={isSaving}
            />
            <button
              className={`inline-grid h-9 w-[34px] place-items-center rounded-lg border-0 ${
                isOwn ? 'bg-white/20 text-white' : 'bg-[#18202f]/10 text-inherit'
              } disabled:cursor-not-allowed disabled:opacity-50`}
              type="button"
              onClick={handleEditSave}
              disabled={isSaving || !editText.trim()}
              aria-label="Save edited message"
            >
              <Check size={16} />
            </button>
            <button
              className={`inline-grid h-9 w-[34px] place-items-center rounded-lg border-0 ${
                isOwn ? 'bg-white/20 text-white' : 'bg-[#18202f]/10 text-inherit'
              } disabled:cursor-not-allowed disabled:opacity-50`}
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditText(message.text);
              }}
              disabled={isSaving}
              aria-label="Cancel edit"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <p className="m-0 leading-[1.45] break-words [overflow-wrap:anywhere]">
            {message.text}
            {message.editedAt && (
              <span className="ml-2 inline-block text-[0.72rem] opacity-70">edited</span>
            )}
          </p>
        )}
        {isOwn && isDirectChat && (
          <span
            className={`mt-2 inline-flex w-full items-center justify-end gap-1.5 whitespace-nowrap rounded-full text-[0.76rem] ${
              isReadByPeer ? 'text-[#61d8ff]' : 'text-white/80'
            }`}
            aria-label={isReadByPeer ? 'Read' : isPeerOnline ? 'Delivered' : 'Sent'}
            title={isReadByPeer ? 'Read' : isPeerOnline ? 'Delivered' : 'Sent'}
          >
            <StatusIcon size={15} strokeWidth={2.7} />
          </span>
        )}
      </div>
    </article>
  );
};

export default MessageBubble;
