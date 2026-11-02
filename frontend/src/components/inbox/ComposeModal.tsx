import React, { useState } from 'react';
import { X, SendHorizontal, Paperclip, Minimize2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, body: string) => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onSend,
}) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject) return;
    onSend(to, subject, body);
    setTo('');
    setSubject('');
    setBody('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/20 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white border border-border-strong rounded-lg shadow-command overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-canvas-alt">
          <span className="text-xs font-semibold text-ink-primary">
            New Message
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-canvas-surface text-ink-muted hover:text-ink-primary"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-canvas-surface text-ink-muted hover:text-ink-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="border-b border-border-subtle px-4 py-2 flex items-center gap-2">
            <span className="text-xs font-mono text-ink-muted w-12">To:</span>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              required
              className="w-full text-xs text-ink-primary focus:outline-none"
            />
          </div>

          <div className="border-b border-border-subtle px-4 py-2 flex items-center gap-2">
            <span className="text-xs font-mono text-ink-muted w-12">Subject:</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject"
              required
              className="w-full text-xs text-ink-primary focus:outline-none"
            />
          </div>

          <div className="p-4 flex-1">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Write your email here..."
              className="w-full text-xs text-ink-primary leading-relaxed focus:outline-none resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle bg-canvas-alt">
            <div className="flex items-center gap-2 text-ink-muted">
              <button
                type="button"
                className="p-1.5 rounded hover:bg-canvas-surface hover:text-ink-primary transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono text-ink-subtle">
                Draft auto-saved
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Discard
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={<SendHorizontal className="w-3.5 h-3.5" />}
              >
                Send
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
