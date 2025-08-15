export interface UserProfileInfo {
  role: 'admin' | 'client'
  phone?: string | null
  avatar?: string | null
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  client_ids: number[]
  // Provided by backend under user.profile.role
  profile?: UserProfileInfo
  // Convenience field set on the client from profile.role
  role?: 'admin' | 'client'
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  user: User
  message?: string
}
