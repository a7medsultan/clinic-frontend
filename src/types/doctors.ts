export interface Doctor {
  id: number;               // Maps to bigint UNSIGNED
  first_name: string;       // Maps to first_name varchar(50)
  last_name: string;        // Maps to last_name varchar(150)
  phone: number;            // Maps to phone int UNSIGNED
  specialization: string;   // Maps to specialization varchar(50)
  is_active: boolean;       // Maps to is_active tinyint(1)
  createdAt: string;        // Maps to created_at timestamp
}

// Payload for creating a new user (Post requests won't supply an ID since it auto-increments here)
export interface CreateDoctorPayload {
  first_name: string;
  last_name: string;
  phone: number;
  specialization: string;
  is_active: boolean;
}