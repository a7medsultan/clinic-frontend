export type Language = 'en' | 'ar';

export interface Translations {
  loginTitle: string;
  loginSubtitle: string;
  usernameLabel: string;
  passwordLabel: string;
  authButton: string;
  authenticating: string;
  [key: string]: any;
}