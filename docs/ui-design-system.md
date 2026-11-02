# JIOSI Inbox — UI Design System Specification

## 1. Overview & Brand Identity

- **Product Name**: JIOSI Inbox
- **Organization**: JIOSI AI ([https://jiosi.online](https://jiosi.online))
- **Application Target**: [https://inbox.jiosi.online](https://inbox.jiosi.online)
- **Tagline**: *"Read less. Understand faster. Respond smarter."*
- **Design Philosophy**: Calm, minimal, speed-oriented, intelligent. JIOSI Inbox avoids noisy dashboard widgets and artificial gamification. The interface prioritizes clear reading typography, instantaneous keyboard flows, and purposeful action indicators.

---

## 2. Design Tokens & Color System

JIOSI Inbox features a dual-theme architecture supporting both high-contrast Light and rich Dark themes, managed via Tailwind's `class` dark mode and persisted in `localStorage`.

### 2.1 Primary Brand Palette (Purple / Indigo Accent)

The signature brand accent provides an intelligent, calm visual anchor without causing eye fatigue:

| Token | Hex | Role / Application |
|---|---|---|
| `brand-50` | `#EEF2FF` | Active background tint, soft badge background (Light) |
| `brand-100` | `#E0E7FF` | Selection highlight background |
| `brand-200` | `#C7D2FE` | Focus rings and subtle active borders |
| `brand-500` | `#6366F1` | **Primary Brand Color** (Primary buttons, FAB, active icons) |
| `brand-600` | `#4F46E5` | Hover state for primary buttons |
| `brand-700` | `#4338CA` | Active press state |
| `brand-900` | `#312E81` | Deep brand text tint |
| `brand-950` | `#1E1B4B` | Dark mode surface background tint |

### 2.2 Semantic Action Status System

Colors in JIOSI Inbox are strictly functional and communicate clear, distinct states:

| Color Role | Hex | State / Meaning | Usage Rules |
|---|---|---|---|
| **Red** | `#EF4444` | **Needs Reply / Urgent Attention** | Reserved strictly for actionable urgency: red pending reply dot and sidebar count badge. Never used for general unread messages. |
| **Blue / Neutral** | `#3B82F6` | **Unread State** | Dot indicator for unread emails that do not require an immediate reply. |
| **Amber / Yellow** | `#F59E0B` | **Starred State** | Restrained star toggle icon and VIP highlights. |
| **Purple / Indigo** | `#8B5CF6` | **AI Contextual Features** | AI Summarize, Draft Reply with tone chips, and Action Item extraction. |
| **Emerald Green** | `#10B981` | **Sync & Connection Status** | Connected accounts, healthy API status, and successful message delivery. |

### 2.3 Surface & Canvas Tokens

#### Light Theme
- **App Canvas**: `#F8FAFC` (Slate-50)
- **Primary Surface**: `#FFFFFF` (Crisp White for Reading Pane & Modals)
- **Secondary Surface**: `#F1F5F9` (Sidebar & Toolbar)
- **Subtle Borders**: `#E2E8F0` (Slate-200)
- **Primary Typography**: `#0F172A` (Slate-900 deep charcoal)
- **Secondary Typography**: `#475569` (Slate-600)
- **Muted Metadata**: `#64748B` (Slate-500)

#### Dark Theme
- **App Canvas**: `#0B0F17` (Deep slate charcoal)
- **Primary Surface**: `#111827` / `#161F30` (Clean dark surface)
- **Secondary Surface**: `#1E293B` (Elevated cards & dropdowns)
- **Subtle Borders**: `#1E293B` / `#334155` (Slate-800)
- **Primary Typography**: `#F8FAFC` (Slate-50 high contrast white)
- **Secondary Typography**: `#CBD5E1` (Slate-300)
- **Muted Metadata**: `#94A3B8` (Slate-400)

---

## 3. Typography & Hierarchy

- **Primary Font**: `Inter` (Variable weights 400, 500, 600, 700)
- **Monospace Font**: `JetBrains Mono` (Used for timestamps, keyboard shortcuts, latency badges, and email addresses)

| Element | Size | Weight | Line Height |
|---|---|---|---|
| Application Header / Brand | 14px (`text-sm`) | Semi-Bold (600) | `1.25` |
| Email Subject (List) | 12px (`text-xs`) | Medium (500) / Semi-Bold (600) | `1.3` |
| Email Sender Name | 12px (`text-xs`) | Semi-Bold (600) | `1.3` |
| Reading Pane Subject | 14px (`text-sm`) | Semi-Bold (600) | `1.4` |
| Message Body | 13px / 14px | Regular (400) | `1.6` (Generous reading line-height) |
| Metadata & Timestamps | 10px / 11px | Medium (500) | Monospace tabular numbers |
| Keyboard Badges (`<Kbd>`) | 10px | Medium (500) | Monospace uppercase |

---

## 4. Component Library Architecture

### 4.1 Base Atoms
- `Button`: Supports `brand`, `primary`, `secondary`, `ghost`, `urgent`, `ai`, and `danger` variants with loading spinners and shortcut badges.
- `Badge`: Semantic pill component supporting `urgent`, `brand`, `success`, `warning`, `info`, and `neutral` with optional status dot.
- `Input`: Border-contained field with prefix icon and suffix clear action.
- `Kbd`: Compact monospace keyboard keycap representation (`⌘K`, `C`, `E`, `H`, `R`).
- `ThemeToggle`: 1-click toggle between light mode and dark mode with persistent state.
- `Toast`: Non-blocking floating status notification for actions (send, snooze, archive, error).
- `EmptyState`: Clean illustrated placeholder with action triggers for zero states.
- `HealthBadge`: Live backend health pill showing response latency, environment, and PostgreSQL connection.

### 4.2 Composite Modules
- `Sidebar`: Workspace navigation with JIOSI branding, purple New Message button, folder counts, red action indicator for "Needs Reply", and settings navigation.
- `Header`: Global search bar (`⌘K`), sync status badge, theme toggle, help trigger, and avatar menu.
- `ProfileMenu`: Popover menu with user identity, workspace tier, theme toggle, settings link, shortcuts, and sign-out.
- `EmailList` & `EmailListItem`: Compact, calm thread feed with unread dot, urgent red pending-reply dot, star toggle, attachment indicators, and multi-selection checkbox.
- `EmailDetail`: Comfortable reading pane with sender avatar, timestamp, attachment download tiles, inline reply composer, and contextual AI tool belt.
- `ComposeModal`: Lightweight modal composer with To, Cc/Bcc toggle, subject, tone-assisted body editor, attachments, draft auto-save indicator, and send keyboard shortcut (`⌘↵`).
- `CommandPalette`: Instant spotlight search (`⌘K` / `Ctrl+K`) supporting command actions, recent searches, and real-time thread search across subjects, senders, and content.
- `SettingsView`: Secondary settings layout featuring 7 dedicated sections: General, Connected Accounts, Notifications, Appearance, Keyboard Shortcuts, Privacy & Security, and Billing.
- `ConnectedAccountsView`: Integration manager for Gmail and Microsoft Outlook with OAuth status, last sync time, manual sync, and disconnect controls (strictly zero client token exposure).
- `MobileNavigation`: Native-feeling bottom navigation bar with red badge counter on "Needs Reply" and floating action button (FAB) for new messages.

---

## 5. Responsive Workspace Breakpoints

1. **Desktop (`≥ 1024px`)**:
   - 3-panel workspace: Left Sidebar (`256px`) + Middle Email List (`420px`) + Right Reading Pane (`flex-1`).
2. **Tablet (`768px - 1023px`)**:
   - 2-panel collapsible: Left Sidebar collapses into a slide-over drawer; Email List (`380px`) + Reading Pane (`flex-1`).
3. **Mobile (`< 768px`)**:
   - Single-pane drilldown: Shows full-width Email List with Bottom Navigation bar; clicking any thread slides into a full-screen Reading Pane with a prominent "Back to List" navigation button. Floating Compose FAB (`bottom-20 right-4`).

