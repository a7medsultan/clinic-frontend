export interface Branch {
  id: number;
  tenant_id: number;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean | number;
  created_at: string;
}