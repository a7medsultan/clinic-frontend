export interface Doctor {
  id: number;               // Maps to bigint UNSIGNED
  first_name: string;       // Maps to first_name varchar(50)
  last_name: string;        // Maps to last_name varchar(150)
  phone: number;            // Maps to phone int UNSIGNED
  specialization: string;   // Maps to specialization varchar(50)
  is_active: boolean;       // Maps to is_active tinyint(1)
  branch_ids?: number[];    // Branch assignments (doctor_branches junction)
  branch_names?: string;    // Human-readable branch labels (comma separated)
  has_schedule?: boolean;   // Doctor has at least one weekly availability row (list response)
  schedule?: DoctorAvailabilityRow[]; // Full weekly schedule (getDoctorById response only)
  createdAt: string;        // Maps to created_at timestamp
}

// One working-day rule in a doctor's weekly schedule for a single branch.
// day_of_week uses MySQL DAYOFWEEK(): 1=Sunday .. 7=Saturday.
export interface DoctorAvailabilityRow {
  branch_id: number;
  branch_name?: string; // joined branch label (getDoctorById response only)
  day_of_week: number;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  slot_duration: number; // minutes: 15 | 30 | 45 | 60
}

// Payload for creating a new user (Post requests won't supply an ID since it auto-increments here)
export interface CreateDoctorPayload {
  first_name: string;
  last_name: string;
  phone: number;
  specialization: string;
  is_active: boolean;
}