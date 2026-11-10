import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmailListItem } from '../../components/inbox/EmailListItem';
import { EmailFilters } from '../../components/inbox/EmailFilters';
import { EmailDetail } from '../../components/inbox/EmailDetail';
import { ComposeModal } from '../../components/inbox/ComposeModal';
import { CommandPalette } from '../../components/inbox/CommandPalette';
import { EmailThread } from '../../types/email';

const mockEmail: EmailThread = {
  id: 'thread-test-1',
  sender: {
    name: 'Sarah Jenkins',
    email: 'sarah@kinto.ventures',
    role: 'General Partner',
    avatar: 'SJ',
  },
  recipient: {
    name: 'Alex Rivera',
    email: 'alex@jiosi.online',
  },
  subject: 'Q3 Term Sheet Review',
  snippet: 'Please review the attached term sheet clean copy...',
  body: 'Hi Alex,\n\nPlease review the clean term sheet.\n\nBest,\nSarah',
  timestamp: '10:42 AM',
  date: 'Today',
  isUnread: true,
  isStarred: false,
  isNeedsReply: true,
  tags: ['VIP', 'Fundraising'],
  aiSummary: 'Sarah sent the term sheet and requested a review.',
  actionItems: ['Review term sheet with legal counsel'],
};

describe('Inbox View Components', () => {
  describe('EmailListItem Component', () => {
    it('renders sender, subject, and snippet', () => {
      render(
        <EmailListItem
          email={mockEmail}
          isSelected={false}
          isChecked={false}
          onSelect={vi.fn()}
          onToggleCheck={vi.fn()}
        />
      );
      expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
      expect(screen.getByText('Q3 Term Sheet Review')).toBeInTheDocument();
      expect(screen.getByText(/Please review the attached/)).toBeInTheDocument();
    });

    it('renders the Red Action Indicator specifically for Needs Reply', () => {
      render(
        <EmailListItem
          email={mockEmail}
          isSelected={false}
          isChecked={false}
          onSelect={vi.fn()}
          onToggleCheck={vi.fn()}
        />
      );
      const urgentDot = screen.getByTitle('Needs Reply (Actionable)');
      expect(urgentDot).toBeInTheDocument();
      expect(urgentDot).toHaveClass('bg-action-urgent');
    });

    it('triggers onToggleStar when star icon is clicked', () => {
      const handleStar = vi.fn();
      render(
        <EmailListItem
          email={mockEmail}
          isSelected={false}
          isChecked={false}
          onSelect={vi.fn()}
          onToggleCheck={vi.fn()}
          onToggleStar={handleStar}
        />
      );
      const starBtn = screen.getByRole('button', { name: /star/i });
      fireEvent.click(starBtn);
      expect(handleStar).toHaveBeenCalledTimes(1);
    });
  });

  describe('EmailFilters Component', () => {
    it('renders category filter buttons with correct counts', () => {
      const handleSelect = vi.fn();
      render(
        <EmailFilters
          currentFilter="all"
          onSelectFilter={handleSelect}
          counts={{ all: 10, unread: 3, 'needs-reply': 2, vip: 1 }}
          allSelected={false}
          onToggleSelectAll={vi.fn()}
          onMarkSelectedAsRead={vi.fn()}
          hasSelection={false}
        />
      );

      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Unread')).toBeInTheDocument();
      expect(screen.getByText('Needs Reply')).toBeInTheDocument();
      expect(screen.getByText('VIP')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Needs Reply'));
      expect(handleSelect).toHaveBeenCalledWith('needs-reply');
    });
  });

  describe('EmailDetail Component', () => {
    it('renders empty state when no email is selected', () => {
      render(
        <EmailDetail
          email={null}
          onArchive={vi.fn()}
          onDelete={vi.fn()}
        />
      );
      expect(screen.getByText('Select an email to read')).toBeInTheDocument();
    });

    it('renders email content and triggers AI summarize toggle', () => {
      render(
        <EmailDetail
          email={mockEmail}
          onArchive={vi.fn()}
          onDelete={vi.fn()}
        />
      );
      expect(screen.getByRole('heading', { name: 'Q3 Term Sheet Review' })).toBeInTheDocument();
      expect(screen.getByText(/Hi Alex,/)).toBeInTheDocument();

      const summarizeBtn = screen.getByRole('button', { name: /✨ summarize/i });
      fireEvent.click(summarizeBtn);
      expect(screen.getByText('AI Key Takeaways')).toBeInTheDocument();
      expect(screen.getByText('Sarah sent the term sheet and requested a review.')).toBeInTheDocument();
    });

    it('renders triage classification and action items on user toggle', () => {
      const emailWithTriage = {
        ...mockEmail,
        actionItems: ['Review term sheet pro-rata clauses', 'Confirm closing call with Sarah'],
        triage: {
          category: 'primary',
          importanceScore: 85,
          importanceReason: 'Direct request awaiting reply',
          urgencyScore: 70,
          urgencyReason: 'Closing call requested Thursday',
          needsReply: true,
          evidence: ['Please review by Thursday'],
          confidence: 0.95,
        },
      };

      render(
        <EmailDetail
          email={emailWithTriage}
          onArchive={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText('Imp: 85/100')).toBeInTheDocument();
      expect(screen.getByText('Urg: 70/100')).toBeInTheDocument();
      expect(screen.getByText('primary')).toBeInTheDocument();

      const actionsBtn = screen.getByRole('button', { name: /action items/i });
      fireEvent.click(actionsBtn);
      expect(screen.getByText(/Identified Action Items/)).toBeInTheDocument();
      expect(screen.getByText('Review term sheet pro-rata clauses')).toBeInTheDocument();
    });

    it('triggers archive action on archive button click', () => {
      const handleArchive = vi.fn();
      render(
        <EmailDetail
          email={mockEmail}
          onArchive={handleArchive}
          onDelete={vi.fn()}
        />
      );
      const archiveBtn = screen.getByRole('button', { name: /archive/i });
      fireEvent.click(archiveBtn);
      expect(handleArchive).toHaveBeenCalledWith('thread-test-1');
    });
  });

  describe('ComposeModal Component', () => {
    it('validates empty recipient email', () => {
      const handleSend = vi.fn();
      render(
        <ComposeModal
          isOpen={true}
          onClose={vi.fn()}
          onSend={handleSend}
        />
      );
      const sendBtn = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(sendBtn);
      expect(screen.getByText(/please specify a recipient email address/i)).toBeInTheDocument();
      expect(handleSend).not.toHaveBeenCalled();
    });

    it('validates invalid email format without @', () => {
      const handleSend = vi.fn();
      render(
        <ComposeModal
          isOpen={true}
          onClose={vi.fn()}
          onSend={handleSend}
        />
      );
      const toInput = screen.getByPlaceholderText('name@company.com');
      fireEvent.change(toInput, { target: { value: 'invalid-email-string' } });

      const sendBtn = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(sendBtn);
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(handleSend).not.toHaveBeenCalled();
    });

    it('sends email successfully with valid inputs', () => {
      const handleSend = vi.fn();
      render(
        <ComposeModal
          isOpen={true}
          onClose={vi.fn()}
          onSend={handleSend}
        />
      );
      const toInput = screen.getByPlaceholderText('name@company.com');
      const subjectInput = screen.getByPlaceholderText('Subject line');
      const bodyInput = screen.getByPlaceholderText(/type your message here/i);

      fireEvent.change(toInput, { target: { value: 'partner@example.com' } });
      fireEvent.change(subjectInput, { target: { value: 'Project Update' } });
      fireEvent.change(bodyInput, { target: { value: 'Everything is on track.' } });

      const sendBtn = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(sendBtn);
      expect(handleSend).toHaveBeenCalledWith(
        'partner@example.com',
        'Project Update',
        'Everything is on track.'
      );
    });

    it('provides AI quick assist templates and undo', () => {
      render(
        <ComposeModal
          isOpen={true}
          onClose={vi.fn()}
          onSend={vi.fn()}
        />
      );

      const polishBtn = screen.getByRole('button', { name: /polish/i });
      fireEvent.click(polishBtn);

      const bodyTextarea = screen.getByPlaceholderText(/type your message here/i) as HTMLTextAreaElement;
      expect(bodyTextarea.value).toContain('Dear team,');

      const undoBtn = screen.getByRole('button', { name: /undo/i });
      fireEvent.click(undoBtn);
      expect(bodyTextarea.value).toBe('');
    });
  });

  describe('CommandPalette Component', () => {
    it('filters commands when typing in query input', () => {
      const handleSelectFolder = vi.fn();
      render(
        <CommandPalette
          isOpen={true}
          onClose={vi.fn()}
          onSelectFolder={handleSelectFolder}
          onOpenCompose={vi.fn()}
          onOpenSettings={vi.fn()}
          onToggleTheme={vi.fn()}
          emails={[mockEmail]}
          onSelectEmail={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText(/type a command or search emails/i);
      fireEvent.change(searchInput, { target: { value: 'reply' } });

      expect(screen.getByText('Go to Needs Reply')).toBeInTheDocument();
    });
  });
});

