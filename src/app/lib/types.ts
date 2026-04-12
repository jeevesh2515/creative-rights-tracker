export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'creator' | 'contributor';
  walletAddress: string;
  totalEarnings: number;
  activeProjects: number;
  joinDate: string;
  isOnline: boolean;
}

export interface Project {
  id: string;
  name: string;
  type: string;
  status: 'Active' | 'Completed' | 'In Progress' | 'Paused';
  description: string;
  totalRevenue: number;
  pendingPayments: number;
  contributors: Contributor[];
  createdDate: string;
  lastUpdated: string;
  contractAddress?: string;
  coverImage: string;
  progress: number;
}

export interface Contributor {
  id: string;
  name: string;
  email: string;
  avatar: string;
  revenueShare: number;
  totalEarned: number;
  role: string;
}

export interface CreativeRight {
  id: string;
  projectId: string;
  projectName: string;
  rightsType: string;
  owner: string;
  ownerId: string;
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Transferred';
  expirationDate: string;
  revenueShare: number;
  createdDate: string;
}

export interface Revenue {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  date: string;
  source: string;
  contributor: string;
  contributorId: string;
  status: 'Paid' | 'Pending' | 'Processing';
  transactionHash?: string;
  emailTracked: boolean;
  splits?: PaymentSplit[];
}

export interface PaymentSplit {
  contributorId: string;
  contributorName: string;
  amount: number;
  percentage: number;
  status: 'Paid' | 'Pending';
}

export interface SmartContract {
  id: string;
  name: string;
  address: string;
  network: string;
  deployedDate: string;
  type: string;
  isActive: boolean;
  totalTransactions: number;
  totalValue: number;
  functions: ContractFunction[];
}

export interface ContractFunction {
  name: string;
  type: 'read' | 'write';
  inputs: { name: string; type: string }[];
  outputs?: { name: string; type: string }[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId?: string;
}

export interface EmailTracking {
  id: string;
  email: string;
  revenue: number;
  source: string;
  date: string;
  isVerified: boolean;
}

// Update Types for Database Operations
export interface ProjectUpdate {
  name?: string;
  description?: string;
  type?: string;
  cover_image?: string;
  status?: 'Active' | 'Completed' | 'In Progress' | 'Paused';
  total_revenue?: number;
}

export interface ContributorUpdate {
  role?: string;
  revenue_share?: number;
  total_earned?: number;
}

export interface CreativeRightUpdate {
  rights_type?: string;
  owner_id?: string;
  revenue_share?: number;
  expiration_date?: string;
  status?: 'Active' | 'Expiring Soon' | 'Expired' | 'Transferred';
}

export interface MilestoneUpdate {
  title?: string;
  target_amount?: number;
  deadline?: string;
  status?: 'Upcoming' | 'In Progress' | 'Completed' | 'Overdue';
}

// Report Types
export interface RevenueReport {
  id: string;
  generatedAt: string;
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  averagePaymentAmount: number;
  paymentCount: number;
  sources: RevenueBySource[];
  projects: RevenueByProject[];
  topContributors: TopContributor[];
  trends: RevenueTrend[];
}

export interface RevenueBySource {
  source: string;
  amount: number;
  percentage: number;
  paymentCount: number;
}

export interface RevenueByProject {
  projectId: string;
  projectName: string;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  contributorCount: number;
}

export interface TopContributor {
  contributorId: string;
  contributorName: string;
  totalEarned: number;
  percentage: number;
  activeProjects: number;
}

export interface RevenueTrend {
  date: string;
  amount: number;
  source: string;
  projectName: string;
}

// Admin Operations
export type AdminAction =
  | 'create_user'
  | 'update_allocation'
  | 'delete_user'
  | 'distribute_revenue'
  | 'approve_distribution'
  | 'reject_distribution';

export type DistributionStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: AdminAction;
  target_user_id?: string;
  target_project_id?: string;
  details: Record<string, any>;
  status: DistributionStatus | string;
  created_at: string;
  updated_at: string;
}

export interface DistributionPayload {
  project_id: string;
  recipients: Array<{
    user_id: string;
    percentage: number;
    amount?: number;
  }>;
  total_amount: number;
  initiated_by: string;
  timestamp: string;
}

export interface UserAllocation {
  user_id: string;
  project_id: string;
  percentage: number;
  created_at: string;
  updated_at: string;
}
