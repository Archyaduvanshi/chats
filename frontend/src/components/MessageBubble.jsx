import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckCheck, Copy, MoreVertical, Pencil, Trash2, X } from 'lucide-react';
import { formatMessageTime } from '../utils/date';

const EDIT_LIMIT_MS = 60 * 1000;

const MessageBubble = ({ message, isOwn, onCopy, onDelete, onEdit }) => {
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

  return (
    <article className={`message-row ${isOwn ? 'own' : ''}`}>
      <div className="message-bubble">
        <div className="message-meta">
          <strong>{message.username}</strong>
          <div className="message-meta-actions">
            <span>{formatMessageTime(message.createdAt)}</span>
            <div className="message-menu" ref={menuRef}>
              <button
                type="button"
                className="message-menu-button"
                onClick={() => setIsMenuOpen((current) => !current)}
                aria-label="Message options"
                aria-expanded={isMenuOpen}
              >
                <MoreVertical size={16} />
              </button>
              {isMenuOpen && (
                <div className="message-menu-popover">
                  <button type="button" onClick={handleCopy}>
                    <Copy size={15} />
                    Copy
                  </button>
                  {isOwn && (
                    <>
                      <button type="button" onClick={handleEditStart} disabled={!canEdit}>
                        <Pencil size={15} />
                        Edit
                      </button>
                      <button type="button" onClick={handleDelete} className="danger">
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
          <div className="message-edit">
            <input
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              maxLength={1000}
              autoFocus
              disabled={isSaving}
            />
            <button
              type="button"
              onClick={handleEditSave}
              disabled={isSaving || !editText.trim()}
              aria-label="Save edited message"
            >
              <Check size={16} />
            </button>
            <button
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
          <p>
            {message.text}
            {message.editedAt && <span className="edited-label">edited</span>}
          </p>
        )}
        {isOwn && (
          <span className="receipt">
            <CheckCheck size={14} />
            {message.readBy?.length > 1 ? 'Read' : 'Delivered'}
          </span>
        )}
      </div>
    </article>
  );
};

export default MessageBubble;
