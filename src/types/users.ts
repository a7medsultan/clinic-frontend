export interface User {
  id: number;              // Maps to bigint UNSIGNED
  username: string;        // Maps to username varchar(50)
  email: string;           // Maps to email varchar(150)
  role_id: RoleID;          // Maps to role_id int UNSIGNED
  is_active: boolean;       // Maps to is_active tinyint(1)
  createdBy: number | null;// Maps to created_by bigint UNSIGNED
  createdAt: string;       // Maps to created_at timestamp
  updatedAt: string;       // Maps to updated_at timestamp
}

// Payload for creating a new user (Post requests won't supply an ID since it auto-increments here)
export interface CreateUserPayload {
  username: string;
  email: string;
  password?: string;       // Placed in req.body to be converted to password_hash by backend
  role_id: RoleID;
  is_ctive?: boolean;
}