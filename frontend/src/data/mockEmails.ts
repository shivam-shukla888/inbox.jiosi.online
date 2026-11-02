import { EmailThread } from '../types/email';

/**
 * Realistic demonstration dataset for JIOSI Inbox.
 * Note: These are sample demonstration data and do not represent real mailbox contents.
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
    isStarred: true,
    isNeedsReply: true,
    isSnoozed: false,
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
    aiSummary: 'Kinto Ventures confirmed leading the $18M cap seed extension. Sarah updated pro-rata allocations and requests your team review the clean term sheet and schedule a closing call for Thursday 2:00 PM PT.',
    actionItems: [
      'Review clean term sheet (v4) with company counsel',
      'Confirm closing call availability for Thursday 2:00 PM PT',
      'Send updated board resolution sign-off'
    ]
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

I had an hour to play with the latest prototype. The visual calm is definitely there—the indigo/purple accent (#6366F1) with subtle slate borders (#E2E8F0) feels very grounded and non-fatiguing.

A few quick observations:
- Command palette latency feels great. Keep it under 30ms.
- The KBD shortcuts (C, E, H, R) should have slight focus elevation for keyboard power users.
- The 3-panel responsive collapse looks sharp on 14-inch screens.
- Red action indicators for "Needs Reply" should be preserved exclusively for actionable urgency.

Left detailed notes in the Figma frame. Ping me when you push the next iteration!

Cheers,
David`,
    timestamp: '09:15 AM',
    date: 'Today',
    isUnread: true,
    isStarred: false,
    isNeedsReply: true,
    isSnoozed: false,
    tags: ['Design', 'Feedback'],
    aiSummary: 'David reviewed the JIOSI prototype and praised the purple accent and keyboard flow. He recommended keeping palette latency under 30ms and reserving red indicators strictly for urgent reply states.',
    actionItems: [
      'Inspect Figma frame comments for focus elevation tokens',
      'Benchmark command palette keyboard shortcut response'
    ]
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
    isStarred: false,
    isNeedsReply: false,
    isSnoozed: false,
    tags: ['Finance', 'Receipts'],
    attachments: [
      {
        id: 'att-3',
        filename: 'Invoice_INV-2024-8924.pdf',
        size: '112 KB',
        type: 'pdf',
      }
    ],
    aiSummary: 'Automatic payment confirmation of $1,420.00 for annual infrastructure tier processed via Mastercard ending in 4242. No action required.',
    actionItems: []
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
    isStarred: true,
    isNeedsReply: true,
    isSnoozed: false,
    tags: ['Partnership', 'API'],
    aiSummary: 'Elena confirmed Lattice approved the webhook security posture and requests the updated OpenAPI spec by Friday to start mock tests next sprint.',
    actionItems: [
      'Export updated OpenAPI 3.1 specification for webhooks',
      'Reply to Elena with endpoint documentation before Friday'
    ]
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
    isStarred: false,
    isNeedsReply: false,
    isSnoozed: false,
    tags: ['Hiring'],
    aiSummary: 'Marcus provided candidate scorecards for the Principal Systems Engineer position and asks whether to prepare an offer proposal for Candidate A.',
    actionItems: []
  },
  {
    id: 'thread-6',
    sender: {
      name: 'Cloudflare Security',
      email: 'alerts@cloudflare.com',
      role: 'Security Alerts',
      avatar: 'CS',
    },
    recipient: {
      name: 'Alex Rivera',
      email: 'security@jiosi.online',
    },
    subject: 'SSL Certificate Renewal for *.jiosi.online',
    snippet: 'Edge certificate rotation scheduled in 14 days. No action required unless custom CAA records are configured...',
    body: `Automated Notice:

Your managed edge wildcard SSL certificate for *.jiosi.online will be renewed automatically in 14 days.

- Common Name: *.jiosi.online
- Issuer: Google Trust Services
- Status: Auto-renewal verified
- DNS Validation: Success

You snoozed this notification until tomorrow morning.`,
    timestamp: 'Oct 27',
    date: 'Oct 27',
    isUnread: false,
    isStarred: false,
    isNeedsReply: false,
    isSnoozed: true,
    snoozedUntil: 'Tomorrow, 9:00 AM',
    tags: ['DevOps', 'Security'],
    aiSummary: 'Automated notice confirming edge SSL certificates will automatically renew without downtime.',
    actionItems: []
  },
  {
    id: 'thread-7',
    sender: {
      name: 'Priya Patel',
      email: 'priya@jiosi.online',
      role: 'Growth Lead',
      avatar: 'PP',
    },
    recipient: {
      name: 'Alex Rivera',
      email: 'alex@jiosi.online',
    },
    subject: 'Weekly Product Retention & Activation Cohorts (W44)',
    snippet: 'Week-over-week D7 retention up 14% following the streamlined 3-panel onboarding flow. Deep dive inside...',
    body: `Hey Alex,

Summary of this week's retention cohort analysis:
- D1 retention: 64% (up from 52%)
- D7 retention: 41% (up from 27%)
- Keyboard shortcuts adoption: 38% of active daily users use ⌘K at least 5 times per session.

I have snoozed this thread until our Friday sprint retrospective so we can discuss expanding the AI summarizer rollout.

Priya`,
    timestamp: 'Oct 26',
    date: 'Oct 26',
    isUnread: false,
    isStarred: true,
    isNeedsReply: false,
    isSnoozed: true,
    snoozedUntil: 'Friday, 2:00 PM',
    tags: ['Analytics', 'Growth'],
    aiSummary: 'Weekly growth metrics showed a 14% jump in D7 retention and 38% adoption of ⌘K search.',
    actionItems: []
  },
  {
    id: 'thread-8',
    sender: {
      name: 'Alex Rivera',
      email: 'alex@jiosi.online',
      role: 'Founder',
      avatar: 'AR',
    },
    recipient: {
      name: 'Sarah Jenkins',
      email: 'sarah@kinto.ventures',
    },
    subject: 'Re: Q3 Seed Extension Term Sheet & Cap Table updates',
    snippet: 'Sarah, thank you for the fast turnaround. Our legal team reviewed the pro-rata amendments and we are aligned...',
    body: `Hi Sarah,

Thank you for the quick turnaround on the term sheet adjustments.

Our legal counsel had a preliminary look this morning and everything is in order with the $18M cap and pro-rata allocations. We are booking Thursday at 2:00 PM PT on the calendar for the closing review.

Looking forward to partnering with Kinto on this next phase!

Best,
Alex`,
    timestamp: 'Yesterday',
    date: 'Nov 1',
    isUnread: false,
    isStarred: false,
    isNeedsReply: false,
    isSnoozed: false,
    isSent: true,
    tags: ['Fundraising'],
    aiSummary: 'Sent reply confirming Thursday 2:00 PM PT closing call with Kinto Ventures.',
    actionItems: []
  },
  {
    id: 'thread-9',
    sender: {
      name: 'Alex Rivera',
      email: 'alex@jiosi.online',
      role: 'Founder',
      avatar: 'AR',
    },
    recipient: {
      name: 'Dr. Alan Hayes',
      email: 'alan.hayes@deeptech-research.org',
    },
    subject: 'JIOSI AI Whitepaper v1.4 Final Copy',
    snippet: 'Alan, attached is the revised technical paper covering our hybrid vector indexing and privacy-first local caching...',
    body: `Dr. Hayes,

Attached is the updated copy of our technical architecture whitepaper (v1.4) incorporating your suggestions on verifiable zero-retention data pipelines.

Please let me know if you have any additional citations to include before we publish on arXiv next Tuesday.

Best,
Alex Rivera`,
    timestamp: 'Oct 29',
    date: 'Oct 29',
    isUnread: false,
    isStarred: false,
    isNeedsReply: false,
    isSnoozed: false,
    isSent: true,
    tags: ['Research'],
    attachments: [
      {
        id: 'att-4',
        filename: 'JIOSI_Architecture_Paper_v1.4.pdf',
        size: '3.8 MB',
        type: 'pdf',
      }
    ],
    aiSummary: 'Sent research paper draft on zero-retention email processing to Dr. Alan Hayes.',
    actionItems: []
  },
  {
    id: 'thread-10',
    sender: {
      name: 'Alex Rivera',
      email: 'alex@jiosi.online',
      role: 'Founder',
      avatar: 'AR',
    },
    recipient: {
      name: 'Google Cloud Partnerships',
      email: 'partnerships@google.com',
    },
    subject: 'Exploring Gemini 2.0 Integration for JIOSI Inbox Enterprise',
    snippet: 'Draft message regarding enterprise tier latency benchmarks and private VPC deployment options...',
    body: `Hi Google Cloud Team,

We are developing JIOSI Inbox, an intelligent productivity platform, and are exploring integration with the Gemini 2.0 API for low-latency thread summarization and context retrieval.

We would love to discuss enterprise pricing tiers and private cloud deployment models for high-compliance enterprise customers.

Best,
Alex Rivera
Founder & CEO, JIOSI AI`,
    timestamp: '15 mins ago',
    date: 'Today',
    isUnread: false,
    isStarred: false,
    isNeedsReply: false,
    isSnoozed: false,
    isDraft: true,
    lastEdited: '15 mins ago',
    tags: ['Draft', 'Partnership'],
    aiSummary: 'Draft email to Google Cloud Partnerships regarding Gemini enterprise integration.',
    actionItems: []
  }
];
