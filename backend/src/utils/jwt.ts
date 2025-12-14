import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
}

const JWT_EXPIRES_IN = "7d";

/**
 * Generates a JWT token for authenticated users.
 * @param payload - User data to encode in token
 * @returns Signed JWT token string
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verifies and decodes a JWT token.
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
  } catch {
    return null;
  }
}
