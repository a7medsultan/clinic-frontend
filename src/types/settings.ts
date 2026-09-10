export interface Settings {
  id: number;
  tenant_id: number;
  branch_id: number | null;
  clinic_name: string;
  clinic_address: string | null;
  clinic_phone: string | null;
  clinic_email: string | null;
  date_format: string;
  time_format: string;
  default_view: string;
  email_notifications: number | boolean;
  sms_notifications: number | boolean;
  appointment_reminders: number | boolean;
  updated_by: number | null;
  updated_at: string;
}
