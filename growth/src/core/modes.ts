// The two ways a company can use Hyniqe Growth.

import type { Mode, TrustLevel } from './types.ts';

export const MODES: Record<Mode, { label: string; forWho: string; howItWorks: string }> = {
  autopilot: {
    label: 'Autopilot',
    forWho: 'Companies with no marketing team',
    howItWorks:
      'The agents run the whole week. The owner only approves what is risky: publishing, sending, spending or anything flagged. Everything else runs on its own.',
  },
  copilot: {
    label: 'Copilot',
    forWho: 'Companies that already have a marketing team',
    howItWorks:
      'Every agent works like an extra team member. Its work goes to the person who owns that area, who can approve, edit, request changes or reassign it.',
  },
};

export const TRUST: Record<TrustLevel, { label: string; description: string }> = {
  cautious: {
    label: 'Cautious',
    description: 'Anything that leaves the company needs the owner\'s yes.',
  },
  balanced: {
    label: 'Balanced',
    description: 'Social posts and blog posts go out on their own if nothing is flagged. Emails, ads, outreach and public replies need a yes.',
  },
  'hands-off': {
    label: 'Hands-off',
    description: 'Only spending, one-to-one outreach and flagged items need a yes.',
  },
};
