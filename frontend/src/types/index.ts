export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ThreatStatus = 'NEW' | 'INVESTIGATING' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'RESOLVED';
export type OrgRole = 'ADMIN' | 'ANALYST' | 'VIEWER';

export interface User {
  id: number;
  email: string;
  full_name: string;
  mobile?: string;
  is_email_verified: boolean;
  is_face_enrolled: boolean;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  role: OrgRole;
}

export interface AuthResponse {
  tokens: {
    access: string;
    refresh: string;
  };
  user: User;
  organization: Organization;
}

export interface OfficialAsset {
  id: string;
  brand: string;
  asset_type: 'SOCIAL_ACCOUNT' | 'MOBILE_APP';
  platform: string;
  identifier: string;
  official_url: string;
  publisher_or_developer_name?: string;
  is_verified: boolean;
  verified_at?: string;
  notes?: string;
}

export interface Brand {
  id: string;
  name: string;
  website_url: string;
  industry: string;
  logo?: string;
  logo_url?: string;
  keywords: string[];
  legitimate_domains: string[];
  description: string;
  is_active: boolean;
  official_assets?: OfficialAsset[];
  asset_count?: number;
  created_at: string;
}

export interface DetectionEvidence {
  id: string;
  category: string;
  title: string;
  details: string;
  score_contribution?: number;
  method: string;
  created_at: string;
}

export interface InvestigationNote {
  id: string;
  author_name: string;
  author_email: string;
  note_text: string;
  is_internal: boolean;
  created_at: string;
}

export interface AIThreatExplanation {
  summary_headline: string;
  what_detected: string;
  why_flagged: string;
  supporting_evidence_points: string[];
  false_positive_considerations: string[];
  possible_impact: string;
  recommended_next_steps: string;
  generator: string;
}

export interface Detection {
  id: string;
  brand: string;
  brand_name: string;
  detection_type: 'SOCIAL_PROFILE' | 'MOBILE_APP';
  target_name: string;
  target_identifier: string;
  platform_or_store: string;
  target_url: string;
  target_image_url?: string;
  risk_score: number;
  severity: SeverityLevel;
  confidence: string;
  name_score: number;
  logo_score?: number;
  desc_score?: number;
  publisher_score?: number;
  domain_score?: number;
  status: ThreatStatus;
  assigned_analyst?: number;
  assigned_analyst_name?: string;
  ai_explanation?: AIThreatExplanation;
  score_breakdown?: {
    scores: Record<string, number>;
    weights_applied: Record<string, number>;
  };
  official_reporting_url?: string;
  resolution_notes?: string;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  evidences?: DetectionEvidence[];
  notes?: InvestigationNote[];
}

export interface DataSource {
  id: number;
  source_id: string;
  name: string;
  platform_type: 'SOCIAL' | 'APP_STORE';
  status: 'LIVE_API' | 'DEMO_DATA' | 'UNAVAILABLE';
  is_enabled: boolean;
  rate_limit_info: string;
  last_sync_at?: string;
}

export interface ScanJob {
  id: string;
  brand: string;
  brand_name: string;
  scan_type: 'SOCIAL' | 'APP_STORE' | 'FULL';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  trigger_type: 'MANUAL' | 'SCHEDULED';
  total_candidates: number;
  potential_threats_found: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  threat_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardSummary {
  total_brands: number;
  social_profiles_scanned: number;
  apps_scanned: number;
  total_threats: number;
  severity_counts: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  status_counts: Record<string, number>;
  platform_distribution: Array<{ platform_or_store: string; count: number }>;
  type_comparison: Array<{ name: string; value: number; color: string }>;
  recent_detections: Detection[];
  last_scan?: {
    scan_type: string;
    status: string;
    completed_at: string;
    threats_found: number;
    total_candidates: number;
  };
  source_summary: {
    live_api: number;
    demo_data: number;
    unavailable: number;
    total: number;
  };
  threat_trends: Array<{ date: string; count: number }>;
}
