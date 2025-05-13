interface User {
  user_id: string;
  name?: string;
  email?: string;
  premium: boolean;
  created_at: Date;
  last_login: Date;
  daily_calories?: number;
}

export default User;
