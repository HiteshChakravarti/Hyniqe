import { 
  Workspace, 
  Profile, 
  PowerUp, 
  Document, 
  ActivityLog, 
  Integration, 
  UsageData,
  AgencyClient,
  BillingInfo
} from '../types';

// ============================================================================
// WORKSPACES
// ============================================================================

export const mockWorkspaces: Workspace[] = [
  {
    id: 'ws-001',
    name: 'Acme Corp',
    orgType: 'business',
    planTier: 'x',
    ownerId: 'user-001',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'ws-agency-001',
    name: 'Digital Marketing Pro Agency',
    orgType: 'agency',
    planTier: 'team',
    ownerId: 'user-agency-001',
    createdAt: '2024-01-10T10:00:00Z'
  },
  {
    id: 'ws-client-001',
    name: 'TechStart Inc',
    orgType: 'business',
    planTier: 'x',
    ownerId: 'user-agency-001',
    parentWorkspaceId: 'ws-agency-001',
    isAgencyClient: true,
    agencyId: 'ws-agency-001',
    createdAt: '2024-02-01T10:00:00Z'
  },
  {
    id: 'ws-client-002',
    name: 'Fashion Brand Co',
    orgType: 'business',
    planTier: 'starter',
    ownerId: 'user-agency-001',
    parentWorkspaceId: 'ws-agency-001',
    isAgencyClient: true,
    agencyId: 'ws-agency-001',
    createdAt: '2024-02-10T10:00:00Z'
  }
];

// ============================================================================
// PROFILES
// ============================================================================

export const mockProfiles: Profile[] = [
  {
    id: 'profile-001',
    workspaceId: 'ws-001',
    name: 'Acme Corp',
    website: 'https://acme-corp.com',
    industry: 'Technology',
    locales: ['en-US', 'es-ES'],
    persona: 'Professional',
    brandTone: 'Innovative, customer-focused, and data-driven. We emphasize reliability and cutting-edge solutions.',
    keyGoals: ['Increase brand awareness', 'Generate qualified leads', 'Improve customer retention'],
    createdAt: '2024-01-15T10:05:00Z',
    updatedAt: '2024-01-15T10:05:00Z',
    isDefault: true
  },
  {
    id: 'profile-002',
    workspaceId: 'ws-001',
    name: 'Acme Labs (R&D Division)',
    website: 'https://labs.acme-corp.com',
    industry: 'Research & Development',
    locales: ['en-US'],
    persona: 'Authoritative',
    brandTone: 'Technical, precise, and thought-leadership focused.',
    keyGoals: ['Publish whitepapers', 'Attract top talent'],
    createdAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-01-20T14:00:00Z'
  },
  {
    id: 'profile-agency-001',
    workspaceId: 'ws-agency-001',
    name: 'Digital Marketing Pro',
    website: 'https://digitalmarketingpro.com',
    industry: 'Marketing Agency',
    locales: ['en-US'],
    persona: 'Friendly',
    brandTone: 'Energetic, results-driven, and approachable.',
    keyGoals: ['Grow client base', 'Showcase case studies'],
    createdAt: '2024-01-10T10:05:00Z',
    updatedAt: '2024-01-10T10:05:00Z',
    isDefault: true
  },
  {
    id: 'profile-client-001',
    workspaceId: 'ws-client-001',
    name: 'TechStart Inc',
    website: 'https://techstart.io',
    industry: 'SaaS',
    locales: ['en-US'],
    persona: 'Bold',
    brandTone: 'Disruptive, fast-paced, and ambitious.',
    keyGoals: ['Launch product', 'Achieve product-market fit'],
    createdAt: '2024-02-01T10:05:00Z',
    updatedAt: '2024-02-01T10:05:00Z',
    isDefault: true
  }
];

// ============================================================================
// POWER-UPS
// ============================================================================

export const mockPowerUps: PowerUp[] = [
  {
    id: 'pu-001',
    name: 'LinkedIn Prospecting',
    description: 'Find and qualify leads directly from LinkedIn Sales Navigator',
    category: 'automation',
    icon: '💼',
    status: 'active',
    provider: 'LinkedIn',
    logoUrl: 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=100',
    paramsSchema: {
      searchQuery: {
        type: 'text',
        label: 'Search Query',
        required: true,
        placeholder: 'e.g. CEO at SaaS companies in San Francisco',
        uiHint: 'Use LinkedIn Sales Navigator syntax'
      },
      maxResults: {
        type: 'number',
        label: 'Max Results',
        required: false,
        placeholder: '50'
      },
      includeEmail: {
        type: 'select',
        label: 'Find Email Addresses',
        options: ['Yes', 'No'],
        required: true
      }
    }
  },
  {
    id: 'pu-002',
    name: 'Content Calendar Generator',
    description: 'Generate a week or month of social media content with Nivi',
    category: 'automation',
    icon: '📅',
    status: 'active',
    paramsSchema: {
      platform: {
        type: 'multiselect',
        label: 'Platforms',
        options: ['LinkedIn', 'Twitter', 'Instagram', 'Facebook'],
        required: true
      },
      duration: {
        type: 'select',
        label: 'Duration',
        options: ['1 week', '2 weeks', '1 month'],
        required: true
      },
      topics: {
        type: 'textarea',
        label: 'Topics to Cover',
        placeholder: 'e.g. Product launches, industry news, company culture',
        required: false
      }
    }
  },
  {
    id: 'pu-003',
    name: 'Sales Forecast Builder',
    description: 'Analyze pipeline data and create revenue forecasts with Orin',
    category: 'analytics',
    icon: '📊',
    status: 'active',
    paramsSchema: {
      timeframe: {
        type: 'select',
        label: 'Forecast Period',
        options: ['Next Quarter', 'Next 6 Months', 'Next Year'],
        required: true
      },
      confidenceLevel: {
        type: 'select',
        label: 'Confidence Level',
        options: ['Conservative', 'Moderate', 'Aggressive'],
        required: true
      }
    }
  },
  {
    id: 'pu-004',
    name: 'Candidate Screening',
    description: 'Screen resumes and schedule interviews with Esha',
    category: 'automation',
    icon: '🎯',
    status: 'active',
    paramsSchema: {
      jobTitle: {
        type: 'text',
        label: 'Job Title',
        required: true,
        placeholder: 'e.g. Senior Software Engineer'
      },
      minExperience: {
        type: 'number',
        label: 'Min Years Experience',
        required: true
      },
      requiredSkills: {
        type: 'textarea',
        label: 'Required Skills',
        placeholder: 'e.g. React, TypeScript, Node.js',
        required: true
      }
    }
  },
  {
    id: 'pu-005',
    name: 'Email Campaign Builder',
    description: 'Create multi-touch email sequences with Turbo',
    category: 'communication',
    icon: '📧',
    status: 'active',
    paramsSchema: {
      campaignType: {
        type: 'select',
        label: 'Campaign Type',
        options: ['Cold Outreach', 'Nurture Sequence', 'Re-engagement'],
        required: true
      },
      touchpoints: {
        type: 'number',
        label: 'Number of Emails',
        required: true,
        placeholder: '5'
      },
      tone: {
        type: 'select',
        label: 'Tone',
        options: ['Professional', 'Casual', 'Bold'],
        required: true
      }
    }
  },
  {
    id: 'pu-006',
    name: 'Customer Health Score',
    description: 'Analyze customer engagement and predict churn with Karo',
    category: 'analytics',
    icon: '❤️',
    status: 'active'
  },
  {
    id: 'pu-007',
    name: 'Competitor Analysis',
    description: 'Track competitor content and positioning',
    category: 'analytics',
    icon: '🔍',
    status: 'available'
  },
  {
    id: 'pu-008',
    name: 'Data Warehouse Sync',
    description: 'Connect to Snowflake, BigQuery, or Redshift',
    category: 'data',
    icon: '🗄️',
    status: 'coming-soon'
  }
];

// ============================================================================
// DOCUMENTS (KNOWLEDGE BASE)
// ============================================================================

export const mockDocuments: Document[] = [
  {
    id: 'doc-001',
    workspaceId: 'ws-001',
    profileId: 'profile-001',
    name: 'Brand Guidelines 2024.pdf',
    type: 'file',
    status: 'indexed',
    size: 2457600,
    uploadedAt: '2024-01-15T10:10:00Z',
    indexedAt: '2024-01-15T10:12:00Z',
    tags: ['brand', 'guidelines']
  },
  {
    id: 'doc-002',
    workspaceId: 'ws-001',
    profileId: 'profile-001',
    name: 'Product Roadmap Q1-Q2',
    type: 'url',
    status: 'indexed',
    uploadedAt: '2024-01-16T14:30:00Z',
    indexedAt: '2024-01-16T14:32:00Z',
    tags: ['product', 'roadmap']
  },
  {
    id: 'doc-003',
    workspaceId: 'ws-001',
    profileId: 'profile-001',
    name: 'Sales Playbook - Enterprise',
    type: 'file',
    status: 'processing',
    size: 5242880,
    uploadedAt: '2024-12-21T09:00:00Z',
    tags: ['sales', 'enterprise']
  },
  {
    id: 'doc-004',
    workspaceId: 'ws-001',
    name: 'Company Wiki (Global)',
    type: 'url',
    status: 'indexed',
    uploadedAt: '2024-01-15T11:00:00Z',
    indexedAt: '2024-01-15T11:05:00Z',
    tags: ['wiki', 'company']
  }
];

// ============================================================================
// ACTIVITY LOGS
// ============================================================================

export const mockActivityLogs: ActivityLog[] = [
  {
    id: 'act-001',
    workspaceId: 'ws-001',
    profileId: 'profile-001',
    helperId: 'nivi',
    helperName: 'Nivi',
    action: 'Generated Instagram content plan for Q1',
    timestamp: '2024-12-21T08:00:00Z',
    model: 'gpt-4o',
    costUSD: 0.15,
    durationMs: 3200,
    ttfbMs: 450,
    tokensUsed: 2840,
    trace: {
      input: 'Create a week of Instagram posts for Acme Corp focusing on product launches',
      output: '7 Instagram posts created with captions, hashtags, and image suggestions',
      steps: [
        { step: 'Analyze brand voice from Brain', duration: 800, status: 'success' },
        { step: 'Research trending hashtags', duration: 600, status: 'success' },
        { step: 'Generate post captions', duration: 1200, status: 'success' },
        { step: 'Suggest image styles', duration: 600, status: 'success' }
      ]
    }
  },
  {
    id: 'act-002',
    workspaceId: 'ws-001',
    profileId: 'profile-001',
    helperId: 'esha',
    helperName: 'Esha',
    action: 'Screened 15 candidates for Senior Dev role',
    timestamp: '2024-12-21T06:30:00Z',
    model: 'gpt-4o-mini',
    costUSD: 0.08,
    durationMs: 2100,
    ttfbMs: 320,
    tokensUsed: 1850,
    trace: {
      input: 'Screen 15 resumes for Senior Software Engineer position',
      output: '5 qualified candidates identified and ranked',
      steps: [
        { step: 'Parse resume files', duration: 500, status: 'success' },
        { step: 'Match skills to job requirements', duration: 800, status: 'success' },
        { step: 'Score candidates', duration: 600, status: 'success' },
        { step: 'Generate summary reports', duration: 200, status: 'success' }
      ]
    }
  },
  {
    id: 'act-003',
    workspaceId: 'ws-001',
    profileId: 'profile-001',
    helperId: 'turbo',
    helperName: 'Turbo',
    action: 'Sent follow-ups to 28 prospects',
    timestamp: '2024-12-21T05:15:00Z',
    model: 'gpt-4o',
    costUSD: 0.22,
    durationMs: 4500,
    ttfbMs: 520,
    tokensUsed: 3960
  },
  {
    id: 'act-004',
    workspaceId: 'ws-001',
    profileId: 'profile-001',
    helperId: 'orin',
    helperName: 'Orin',
    action: 'Built Q4 revenue dashboard',
    timestamp: '2024-12-21T03:00:00Z',
    model: 'gpt-4o',
    costUSD: 0.18,
    durationMs: 5200,
    ttfbMs: 680,
    tokensUsed: 3200
  },
  {
    id: 'act-005',
    workspaceId: 'ws-001',
    profileId: 'profile-001',
    helperId: 'karo',
    helperName: 'Karo',
    action: 'Resolved 12 support tickets',
    timestamp: '2024-12-20T22:00:00Z',
    model: 'gpt-4o-mini',
    costUSD: 0.05,
    durationMs: 1800,
    ttfbMs: 280,
    tokensUsed: 1200
  }
];

// ============================================================================
// INTEGRATIONS
// ============================================================================

export const mockIntegrations: Integration[] = [
  {
    id: 'int-001',
    name: 'Slack',
    description: 'Send notifications and run workflows from Slack',
    category: 'Communication',
    status: 'connected',
    logoUrl: 'https://images.unsplash.com/photo-1611606063065-ee7946f0787a?w=100',
    connectedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'int-002',
    name: 'HubSpot',
    description: 'Sync contacts, deals, and activities',
    category: 'CRM',
    status: 'connected',
    logoUrl: 'https://images.unsplash.com/photo-1599507593499-a3f7d7d97667?w=100',
    connectedAt: '2024-01-15T11:00:00Z'
  },
  {
    id: 'int-003',
    name: 'Google Drive',
    description: 'Access documents for Brain knowledge',
    category: 'Storage',
    status: 'connected',
    logoUrl: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100',
    connectedAt: '2024-01-15T11:15:00Z'
  },
  {
    id: 'int-004',
    name: 'LinkedIn',
    description: 'Prospect and engage on LinkedIn',
    category: 'Social',
    status: 'available'
  },
  {
    id: 'int-005',
    name: 'Salesforce',
    description: 'Enterprise CRM integration',
    category: 'CRM',
    status: 'available'
  },
  {
    id: 'int-006',
    name: 'Notion',
    description: 'Sync documentation and wikis',
    category: 'Productivity',
    status: 'available'
  }
];

// ============================================================================
// USAGE DATA
// ============================================================================

export const mockUsageData: Record<string, UsageData> = {
  'ws-001': {
    workspaceId: 'ws-001',
    plan: 'x',
    creditsUsed: 450,
    creditsTotal: 750,
    callsToday: 47,
    spendTodayUSD: 2.35,
    runsByHelper: {
      'nivi': 15,
      'esha': 12,
      'turbo': 10,
      'orin': 6,
      'karo': 4
    },
    ttfbAvgMs: 420
  },
  'ws-agency-001': {
    workspaceId: 'ws-agency-001',
    plan: 'team',
    creditsUsed: 320,
    creditsTotal: 750,
    callsToday: 32,
    spendTodayUSD: 1.85
  },
  'ws-client-001': {
    workspaceId: 'ws-client-001',
    plan: 'x',
    creditsUsed: 180,
    creditsTotal: 750,
    callsToday: 18,
    spendTodayUSD: 0.95
  },
  'ws-client-002': {
    workspaceId: 'ws-client-002',
    plan: 'starter',
    creditsUsed: 85,
    creditsTotal: 250,
    callsToday: 12,
    spendTodayUSD: 0.48
  }
};

// ============================================================================
// AGENCY CLIENTS
// ============================================================================

export const mockAgencyClients: AgencyClient[] = [
  {
    id: 'client-001',
    workspaceId: 'ws-client-001',
    agencyWorkspaceId: 'ws-agency-001',
    name: 'TechStart Inc',
    industry: 'SaaS',
    planTier: 'x',
    usage: mockUsageData['ws-client-001'],
    createdAt: '2024-02-01T10:00:00Z',
    status: 'active'
  },
  {
    id: 'client-002',
    workspaceId: 'ws-client-002',
    agencyWorkspaceId: 'ws-agency-001',
    name: 'Fashion Brand Co',
    industry: 'Retail',
    planTier: 'starter',
    usage: mockUsageData['ws-client-002'],
    createdAt: '2024-02-10T10:00:00Z',
    status: 'active'
  }
];

// ============================================================================
// BILLING INFO
// ============================================================================

export const mockBillingInfo: Record<string, BillingInfo> = {
  'ws-001': {
    workspaceId: 'ws-001',
    planTier: 'x',
    billingCycle: 'monthly',
    priceUSD: 97,
    nextBillingDate: '2025-01-15',
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'Visa'
    },
    invoices: [
      {
        id: 'inv-001',
        date: '2024-12-15',
        amount: 97,
        status: 'paid',
        downloadUrl: '#'
      },
      {
        id: 'inv-002',
        date: '2024-11-15',
        amount: 97,
        status: 'paid',
        downloadUrl: '#'
      }
    ]
  }
};
