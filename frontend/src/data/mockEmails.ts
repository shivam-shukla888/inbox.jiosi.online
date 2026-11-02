import { EmailThread } from '../types/email';

/**
 * Realistic demonstration dataset for JIOSI Inbox Day 1.
 * Note: These emails are sample demonstration data and are not real mailbox contents.
 */
export const DEMO_EMAILS: EmailThread[] = [
  {
    id: 'thread-1',
    sender: {
      name: 'Sarah Jenkins',
      email: 'sarah@kinto.ventures',
      role: 'General Partner, Kinto',
      avatar: 'SJ',
    },
    recipient: {
      name: 'Alex Rivera',
      email: 'alex@jiosi.online',
    },
    cc: ['legal@kinto.ventures', 'cfo@jiosi.online'],
    subject: 'Q3 Seed Extension Term Sheet & Cap Table updates',
    snippet: 'Alex, attached is the revised terms and the pro-forma model with the adjusted dilution numbers from our partner meeting yesterday...',
    body: `Hi Alex,

Following our partner review yesterday, we are excited to move forward with the lead participation in JIOSI's seed extension round.

Key updates to the term sheet:
1. Pre-money valuation aligned with our agreed term ($18M cap).
2. Pro-rata allocation expanded for strategic syndicate members.
3. Counsel sign-off on the standard NVCA documentation set.

Please review the attached term sheet clean copy and the dilution sensitivity tab in the spreadsheet. If everything aligns with your board's expectations, let's schedule the closing call for Thursday at 2:00 PM PT.

Best regards,
Sarah Jenkins
General Partner | Kinto Ventures`,
    timestamp: '10:42 AM',
    date: 'Today',
    isUnread: true,
    isImportant: true,
    isNeedsReply: true,
    isFollowUp: false,
    tags: ['Fundraising', 'VIP'],
    attachments: [
      {
        id: 'att-1',
        filename: 'Term_Sheet_v4_Clean.pdf',
        size: '2.4 MB',
        type: 'pdf',
      },
      {
        id: 'att-2',
        filename: 'CapTable_Model_Q3.xlsx',
        size: '840 KB',
        type: 'xlsx',
      },
    ],
  },
  {
    id: 'thread-2',
    sender: {
      name: 'David Vance',
      email: 'david@linearlabs.design',
      role: 'Head of Design, Linear Labs',
      avatar: 'DV',
    },
    recipient: {
      name: 'Alex Rivera',
      email: 'alex@jiosi.online',
    },
    subject: 'Design critique notes: keyboard-first UX guidelines',
    snippet: 'Really loved the command palette rhythm. Left 4 comments in Figma regarding token contrast, focus rings, and list density...',
    body: `Alex,

I had an hour to play with the latest prototype. The visual calm is definitely there—the warm ivory canvas (#FAF9F5) with micro-dividers (#E6E3DC) feels very grounded and non-fatiguing.

A few quick observations:
- Command palette latency feels great. Keep it under 30ms.
- The KBD shortcuts (C, E, H, R) should have slight focus elevation for keyboard power users.
- The 3-panel responsive collapse looks sharp on 14-inch screens.

Left detailed notes in the Figma frame. Ping me when you push the next iteration!

Cheers,
David`,
    timestamp: '09:15 AM',
    date: 'Today',
    isUnread: true,
    isImportant: false,
    isNeedsReply: true,
    isFollowUp: true,
    tags: ['Design', 'Feedback'],
  },
  {
    id: 'thread-3',
    sender: {
      name: 'Stripe Billing',
      email: 'notifications@stripe.com',
      role: 'Automated Billing',
      avatar: 'SB',
    },
    recipient: {
      name: 'Alex Rivera',
      email: 'billing@jiosi.online',
    },
    subject: 'Invoice #INV-2024-8924 paid ($1,420.00)',
    snippet: 'Your subscription for JIOSI Team Tier renewed successfully. Next billing cycle begins December 1, 2026...',
    body: `Hello JIOSI Team,

This is a receipt for your recent payment of $1,420.00 for the JIOSI Infrastructure & Compute tier.

Summary:
- Plan: Team Enterprise Scale (Annual)
- Transaction ID: ch_3P7eK2LmNO987
- Date: Nov 2, 2026
- Payment method: Mastercard ending in 4242

You can download your PDF tax invoice directly from your customer portal.

Thank you for your business!
The Stripe Team`,
    timestamp: 'Yesterday',
    date: 'Nov 1',
    isUnread: false,
    isImportant: false,
    isNeedsReply: false,
    isFollowUp: false,
    tags: ['Finance', 'Receipts'],
  },
  {
    id: 'thread-4',
    sender: {
      name: 'Elena Rostova',
      email: 'elena.rostova@lattice-sync.io',
      role: 'VP Product, Lattice',
      avatar: 'ER',
    },
    recipient: {
      name: 'Alex Rivera',
      email: 'alex@jiosi.online',
    },
    subject: 'Sync on Q4 API partnerships & integration scope',
    snippet: 'Following up on our call regarding the webhook latency SLAs and the enterprise OAuth handshake protocol...',
    body: `Hi Alex,

Thanks for walking through the technical architecture on Monday. Our engineering leads reviewed the webhook payloads and everything looks compliant with our security posture.

Can your team provide the updated OpenAPI specification by Friday? We want to begin mock integration tests next sprint.

Best,
Elena`,
    timestamp: 'Oct 30',
    date: 'Oct 30',
    isUnread: false,
    isImportant: true,
    isNeedsReply: true,
    isFollowUp: true,
    tags: ['Partnership', 'API'],
  },
  {
    id: 'thread-5',
    sender: {
      name: 'Marcus Sterling',
      email: 'marcus@sterlingtalent.co',
      role: 'Executive Recruiter',
      avatar: 'MS',
    },
    recipient: {
      name: 'Alex Rivera',
      email: 'alex@jiosi.online',
    },
    subject: 'Candidate briefing: Principal Systems Engineer',
    snippet: 'Reviewing candidate scorecards from round 3 interviews. Both candidates demonstrated strong concurrency and distributed systems depth...',
    body: `Alex,

Attached are the debrief notes for the two final candidates for the Principal Systems Engineer opening. Both scored high on system design and low-level JVM profiling.

Let me know if you would like to proceed with the offer proposal for Candidate A this week.

Marcus`,
    timestamp: 'Oct 28',
    date: 'Oct 28',
    isUnread: false,
    isImportant: false,
    isNeedsReply: false,
    isFollowUp: false,
    tags: ['Hiring'],
  },
];
