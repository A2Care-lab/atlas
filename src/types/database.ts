export type UserRole = 'admin' | 'corporate_manager' | 'approver_manager' | 'user';
export type ReportStatus = 'received' | 'under_analysis' | 'under_investigation' | 'waiting_info' | 'corporate_approval' | 'approved' | 'rejected';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type SituationType = 'conflict' | 'misconduct' | 'moral_harassment' | 'discrimination' | 'sexual_harassment' | 'threat_violence' | 'fraud' | 'other';
export type AffectedScope = 'individual' | 'team' | 'department' | 'company';
export type RecurrenceType = 'first_time' | 'occurred_before' | 'frequent';

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  email_domain?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
  sla_days?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  company_id: string;
  role: UserRole;
  phone?: string;
  department?: string;
  avatar_url?: string;
  is_active: boolean;
  accepted_terms: boolean;
  terms_accepted_at?: string;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface Invitation {
  id: string;
  email: string;
  company_id: string;
  role: UserRole;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  full_name?: string;
  created_at: string;
}

export interface Report {
  id: string;
  protocol: string;
  company_id: string;
  user_id?: string;
  title: string;
  description: string;
  is_anonymous: boolean;
  department?: string;
  main_reason: string;
  sub_reason?: string;
  situation_type: SituationType;
  has_immediate_risk: boolean;
  involves_leadership: boolean;
  affected_scope: AffectedScope;
  recurrence: RecurrenceType;
  has_retaliation: boolean;
  risk_score: number;
  risk_level: RiskLevel;
  risk_justification?: string;
  status: ReportStatus;
  token: string;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
  attachments?: Attachment[];
  comments?: Comment[];
  status_history?: StatusHistory[];
  company?: Company;
}

export interface Attachment {
  id: string;
  report_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface Comment {
  id: string;
  report_id: string;
  user_id?: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  author_role?: UserRole;
  user?: UserProfile;
}

export interface StatusHistory {
  id: string;
  report_id: string;
  previous_status?: ReportStatus;
  new_status: ReportStatus;
  changed_by?: string;
  comment?: string;
  created_at: string;
  user?: UserProfile;
}

export interface ReportReason {
  id: string;
  company_id: string;
  main_reason: string;
  sub_reason: string;
  is_active: boolean;
  created_at: string;
}
