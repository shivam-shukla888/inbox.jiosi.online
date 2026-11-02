import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Kbd } from '../../components/ui/Kbd';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Toast } from '../../components/ui/Toast';
import { EmptyState } from '../../components/ui/EmptyState';

describe('UI Atom Components', () => {
  describe('Button Component', () => {
    it('renders with children and handles click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const btn = screen.getByRole('button', { name: /click me/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders disabled state correctly', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const btn = screen.getByRole('button', { name: /disabled/i });
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders loading spinner when isLoading is true', () => {
      render(<Button isLoading>Loading Button</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
    });

    it('renders with keyboard shortcut indicator', () => {
      render(<Button shortcut="C">Compose</Button>);
      expect(screen.getByText('C')).toBeInTheDocument();
    });
  });

  describe('Badge Component', () => {
    it('renders urgent variant for Needs Reply status', () => {
      render(<Badge variant="urgent" dot>Needs Reply</Badge>);
      const badge = screen.getByText('Needs Reply');
      expect(badge).toBeInTheDocument();
    });

    it('renders brand and success variants with semantic styling', () => {
      const { rerender } = render(<Badge variant="brand">AI</Badge>);
      expect(screen.getByText('AI')).toBeInTheDocument();

      rerender(<Badge variant="success">Connected</Badge>);
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  describe('Input Component', () => {
    it('accepts text input and triggers onChange', () => {
      const handleChange = vi.fn();
      render(<Input placeholder="Search..." onChange={handleChange} />);
      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'investor' } });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Kbd Component', () => {
    it('renders keycap text', () => {
      render(<Kbd>⌘K</Kbd>);
      expect(screen.getByText('⌘K')).toBeInTheDocument();
    });
  });

  describe('ThemeToggle Component', () => {
    it('calls onToggle when clicked', () => {
      const handleToggle = vi.fn();
      render(<ThemeToggle isDark={false} onToggle={handleToggle} />);
      const btn = screen.getByRole('button', { name: /switch to dark theme/i });
      fireEvent.click(btn);
      expect(handleToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Toast Component', () => {
    it('renders message and calls onClose when dismiss clicked', () => {
      const handleClose = vi.fn();
      render(<Toast message="Thread archived" type="success" onClose={handleClose} duration={0} />);
      expect(screen.getByText('Thread archived')).toBeInTheDocument();
      const closeBtn = screen.getByRole('button', { name: /close notification/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('EmptyState Component', () => {
    it('renders custom title and description', () => {
      render(<EmptyState title="Inbox Zero" description="All caught up" />);
      expect(screen.getByText('Inbox Zero')).toBeInTheDocument();
      expect(screen.getByText('All caught up')).toBeInTheDocument();
    });
  });
});

