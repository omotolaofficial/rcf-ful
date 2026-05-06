export type AdminRole = 'super_admin' | 'admin';

export interface ManagedAdmin {
  id: string;
  email: string;
  role: AdminRole;
  displayName?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AdminCollectionConfig {
  key: string;
  label: string;
  description: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'date' | 'image' | 'select';
    required?: boolean;
    options?: Array<{ value: string; label: string }>;
  }>;
}
