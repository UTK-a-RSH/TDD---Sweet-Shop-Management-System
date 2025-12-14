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

// Sweet validation constants
const MIN_SWEET_NAME_LENGTH = 2;
const MAX_SWEET_NAME_LENGTH = 100;

/**
 * Validates sweet name.
 * @throws ValidationError if name is invalid
 */
export function validateSweetName(name: string | undefined): void {
  const trimmed = name?.trim() || "";
  if (!trimmed) {
    throw new ValidationError("Name is required", "MISSING_NAME");
  }
  if (trimmed.length < MIN_SWEET_NAME_LENGTH) {
    throw new ValidationError(
      `Name must be at least ${MIN_SWEET_NAME_LENGTH} characters`,
      "NAME_TOO_SHORT"
    );
  }
  if (trimmed.length > MAX_SWEET_NAME_LENGTH) {
    throw new ValidationError(
      `Name must be at most ${MAX_SWEET_NAME_LENGTH} characters`,
      "NAME_TOO_LONG"
    );
  }
}

/**
 * Validates sweet category.
 * @throws ValidationError if category is invalid
 */
export function validateSweetCategory(category: string | undefined): void {
  const trimmed = category?.trim() || "";
  if (!trimmed) {
    throw new ValidationError("Category is required", "MISSING_CATEGORY");
  }
}

/**
 * Validates sweet price.
 * @throws ValidationError if price is invalid
 */
export function validateSweetPrice(price: number | undefined): void {
  if (typeof price !== "number" || isNaN(price)) {
    throw new ValidationError("Price must be a valid number", "INVALID_PRICE");
  }
  if (price < 0) {
    throw new ValidationError("Price cannot be negative", "NEGATIVE_PRICE");
  }
}

/**
 * Validates sweet quantity.
 * @throws ValidationError if quantity is invalid
 */
export function validateSweetQuantity(quantity: number | undefined): void {
  if (typeof quantity !== "number" || quantity < 0) {
    throw new ValidationError("Quantity cannot be negative", "NEGATIVE_QUANTITY");
  }
  if (!Number.isInteger(quantity)) {
    throw new ValidationError("Quantity must be an integer", "INVALID_QUANTITY");
  }
}

/**
 * Validates sweet input for creation.
 * @returns Sanitized input with trimmed strings
 * @throws ValidationError if any field is invalid
 */
export function validateSweetInput(input: {
  name?: string;
  category?: string;
  price?: number;
  quantity?: number;
}): { name: string; category: string; price: number; quantity: number } {
  validateSweetName(input.name);
  validateSweetCategory(input.category);
  validateSweetPrice(input.price);
  validateSweetQuantity(input.quantity);

  return {
    name: input.name!.trim(),
    category: input.category!.trim(),
    price: input.price!,
    quantity: input.quantity!,
  };
}

/**
 * Validates sweet input for update (partial).
 * Only validates fields that are provided.
 * @returns Sanitized input with trimmed strings
 * @throws ValidationError if any provided field is invalid
 */
export function validateSweetUpdateInput(input: {
  name?: string;
  category?: string;
  price?: number;
  quantity?: number;
}): { name?: string; category?: string; price?: number; quantity?: number } {
  const result: { name?: string; category?: string; price?: number; quantity?: number } = {};

  if (input.name !== undefined) {
    // Empty string is invalid for name
    if (input.name === "" || input.name.trim() === "") {
      throw new ValidationError("Name cannot be empty", "EMPTY_NAME");
    }
    validateSweetName(input.name);
    result.name = input.name.trim();
  }

  if (input.category !== undefined) {
    // Empty string is invalid for category
    if (input.category === "" || input.category.trim() === "") {
      throw new ValidationError("Category cannot be empty", "EMPTY_CATEGORY");
    }
    validateSweetCategory(input.category);
    result.category = input.category.trim();
  }

  if (input.price !== undefined) {
    validateSweetPrice(input.price);
    result.price = input.price;
  }

  if (input.quantity !== undefined) {
    validateSweetQuantity(input.quantity);
    result.quantity = input.quantity;
  }

  return result;
}

/**
 * Validates and sanitizes search query for sweets.
 * @returns Sanitized query with trimmed strings and only non-empty values
 * @throws ValidationError if price range is invalid
 */
export function validateSearchQuery(query: {
  name?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}): { name?: string; category?: string; minPrice?: number; maxPrice?: number } {
  const { minPrice, maxPrice } = query;

  // Validate price range
  if (minPrice !== undefined && minPrice < 0) {
    throw new ValidationError("Minimum price cannot be negative", "INVALID_MIN_PRICE");
  }
  if (maxPrice !== undefined && maxPrice < 0) {
    throw new ValidationError("Maximum price cannot be negative", "INVALID_MAX_PRICE");
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new ValidationError(
      "Minimum price cannot be greater than maximum price",
      "INVALID_PRICE_RANGE"
    );
  }

  // Build sanitized query (trim strings, ignore empty)
  const sanitized: { name?: string; category?: string; minPrice?: number; maxPrice?: number } = {};

  if (query.name && query.name.trim()) {
    sanitized.name = query.name.trim();
  }
  if (query.category && query.category.trim()) {
    sanitized.category = query.category.trim();
  }
  if (minPrice !== undefined) {
    sanitized.minPrice = minPrice;
  }
  if (maxPrice !== undefined) {
    sanitized.maxPrice = maxPrice;
  }

  return sanitized;
}

/**
 * Validates inventory quantity for purchase/restock operations.
 * @throws ValidationError if quantity is invalid
 */
export function validateInventoryQuantity(quantity: number | undefined): void {
  if (typeof quantity !== "number" || isNaN(quantity)) {
    throw new ValidationError("Quantity must be a valid number", "INVALID_QUANTITY");
  }
  if (quantity <= 0) {
    throw new ValidationError("Quantity must be greater than zero", "INVALID_QUANTITY");
  }
  if (!Number.isInteger(quantity)) {
    throw new ValidationError("Quantity must be a whole number", "INVALID_QUANTITY");
  }
}
