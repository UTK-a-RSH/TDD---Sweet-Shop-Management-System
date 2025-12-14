// User types for API requests/responses (without Mongoose-specific fields)

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: 'user' | 'admin';
}

export interface UserResponse {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginDto {
  email: string;
  password: string;
}
