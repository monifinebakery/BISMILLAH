export interface AppUpdate {
  id: string;
  version: string;
  title: string;
  description: string;
  release_date: string;
  is_active: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSeenUpdate {
  id: string;
  user_id: string;
  update_id: string;
  seen_at: string;
}

export interface UpdateContextType {
  latestUpdate: AppUpdate | null;
  unseenUpdates: AppUpdate[];
  hasUnseenUpdates: boolean;
  markAsSeen: (updateId: string) => Promise<void>;
  markAllAsSeen: () => Promise<void>;
  refreshUpdates: () => Promise<void>;
  loading: boolean;
}

export type UpdatePriority = 'low' | 'normal' | 'high' | 'critical';

export interface UpdateFormData {
  version: string;
  title: string;
  description: string;
  priority: UpdatePriority;
  is_active: boolean;
}