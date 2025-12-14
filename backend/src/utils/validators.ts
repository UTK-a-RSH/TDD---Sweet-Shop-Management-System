import { ValidationError } from "./errors";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD_LENGTH = 6;

/**
 * Validates an email address format.
 * @throws ValidationError if email is invalid
 */
export function validateEmail(email: string | undefined): void {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new ValidationError("Invalid email format", "INVALID_EMAIL");
  }
}

/**
 * Validates password strength.
 * @throws ValidationError if password is too weak
 */
export function validatePassword(password: string | undefined): void {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      "WEAK_PASSWORD"
    );
  }
}

/**
 * Validates user registration input.
 * @throws ValidationError if any field is invalid
 */
export function validateRegisterInput(input: {
  name?: string;
  email?: string;
  password?: string;
}): void {
  if (!input.name || input.name.trim().length === 0) {
    throw new ValidationError("Name is required", "MISSING_NAME");
  }
  validateEmail(input.email);
  validatePassword(input.password);
}
