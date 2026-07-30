export interface Patient {
  id: number;
  uuid: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: 'male' | 'female';
  phone: string;
  email: string;
  national_id: string;
  allergies: string | null;
  is_active: number;
  created_at: string;
}