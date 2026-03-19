type AuthErrorLike = {
  code?: string;
  message?: string;
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Invalid email or password.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_PASSWORD: "Password is incorrect.",
  USER_ALREADY_EXISTS: "An account with this email already exists.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with this email already exists.",
  MISSING_FIELD: "Please complete all required fields.",
  EMAIL_NOT_VERIFIED: "Please verify your email before signing in.",
};

export function toAuthErrorMessage(error: unknown, fallback: string) {
  const authError = error as AuthErrorLike | null;

  if (authError?.code && AUTH_ERROR_MESSAGES[authError.code]) {
    return AUTH_ERROR_MESSAGES[authError.code];
  }

  if (authError?.message && authError.message.trim()) {
    return authError.message;
  }

  return fallback;
}
