import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "smartcalorie-secret-key-2024";

export interface AuthRequest extends Request {
    userId?: number;
}

export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
        // PROTOTYPE MODE: Default to User ID 1 if no token
        // This allows testing the app without full auth
        req.userId = 1;
        next();
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        req.userId = decoded.userId;
        next();
    } catch (error) {
        // Fallback for invalid token in prototype mode too? 
        // Let's be strict if a token IS provided but invalid.
        res.status(403).json({ error: "Geçersiz token" });
        return;
    }
};

export const generateToken = (userId: number): string => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

export { JWT_SECRET };
