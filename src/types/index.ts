// Core Types for Multi-Tenant System

export type OrgType = 'individual' | 'business' | 'agency';
export type PlanTier = 'starter' | 'x' | 'team';
export type Locale = 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'pt-BR' | 'ja-JP' | 'zh-CN';
export type Persona = 'Professional' | 'Friendly' | 'Bold' | 'Casual' | 'Authoritative';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  orgType: OrgType;
  planTier: PlanTier;
  ownerId: string;
  createdAt: string;
  // Parent workspace for agency clients
  parentWorkspaceId?: string;
  // Agency-specific
  isAgencyClient?: boolean;
  agencyId?: string;
}

export interface Profile {
  id: string;
  workspaceId: string;
  name: string;
  // Brand details
  website?: string;
  industry?: string;
  locales: Locale[];
  persona: Persona;
  brandTone?: string;
  keyGoals?: string[];
  // Timestamps
  createdAt: string;
  updatedAt: string;
  // Auto-created flag
  isDefault?: boolean;
}

export interface UsageData {
  workspaceId: string;
  plan: PlanTier;
  creditsUsed: number;
  creditsTotal: number;
  callsToday: number;
  spendTodayUSD: number;
  // Optional detailed metrics
  runsByHelper?: Record<string, number>;
  ttfbAvgMs?: number;
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  category: 'data' | 'communication' | 'automation' | 'analytics';
  icon: string;
  status: 'active' | 'available' | 'coming-soon';
  // Parameters schema for runner
  paramsSchema?: {
    [key: string]: {
      type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea';
      label: string;
      required?: boolean;
      options?: string[];
      placeholder?: string;
      uiHint?: string;
    };
  };
  // Integration details
  provider?: string;
  logoUrl?: string;
}

export interface Document {
  id: string;
  workspaceId: string;
  profileId?: string;
  name: string;
  type: 'file' | 'url' | 'text';
  status: 'processing' | 'indexed' | 'failed';
  size?: number;
  uploadedAt: string;
  indexedAt?: string;
  tags?: string[];
}

export interface ActivityLog {
  id: string;
  workspaceId: string;
  profileId?: string;
  helperId: string;
  helperName: string;
  action: string;
  timestamp: string;
  // Run details
  model?: string;
  costUSD?: number;
  durationMs?: number;
  ttfbMs?: number;
  tokensUsed?: number;
  // Trace data
  trace?: {
    input: string;
    output: string;
    steps: Array<{
      step: string;
      duration: number;
      status: 'success' | 'error';
    }>;
  };
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'connected' | 'available' | 'error';
  logoUrl?: string;
  connectedAt?: string;
  // Connection details
  config?: Record<string, any>;
}

export interface Override {
  id: string;
  workspaceId?: string;
  profileId?: string;
  scope: 'global' | 'org' | 'profile';
  key: string;
  value: any;
  parentValue?: any;
  createdAt: string;
  updatedAt: string;
}

export interface BillingInfo {
  workspaceId: string;
  planTier: PlanTier;
  billingCycle: 'monthly' | 'annual';
  priceUSD: number;
  nextBillingDate: string;
  paymentMethod?: {
    type: 'card' | 'bank';
    last4: string;
    brand?: string;
  };
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    downloadUrl?: string;
  }>;
}

export interface AgencyClient {
  id: string;
  workspaceId: string;
  agencyWorkspaceId: string;
  name: string;
  industry?: string;
  planTier: PlanTier;
  usage: UsageData;
  createdAt: string;
  status: 'active' | 'paused' | 'churned';
}
