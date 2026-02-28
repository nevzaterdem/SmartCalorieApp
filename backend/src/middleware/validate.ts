import { Request, Response, NextFunction } from "express";

// ============ VALIDATION HELPERS ============

export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password: string): string | null => {
    if (!password || password.length < 6) {
        return "Şifre en az 6 karakter olmalıdır";
    }
    if (password.length > 128) {
        return "Şifre en fazla 128 karakter olabilir";
    }
    return null;
};

export const validateNumber = (value: any, fieldName: string, min?: number, max?: number): string | null => {
    if (value === undefined || value === null) return null; // Optional field
    const num = Number(value);
    if (isNaN(num)) {
        return `${fieldName} geçerli bir sayı olmalıdır`;
    }
    if (min !== undefined && num < min) {
        return `${fieldName} en az ${min} olmalıdır`;
    }
    if (max !== undefined && num > max) {
        return `${fieldName} en fazla ${max} olabilir`;
    }
    return null;
};

export const validateRequiredNumber = (value: any, fieldName: string, min?: number, max?: number): string | null => {
    if (value === undefined || value === null) {
        return `${fieldName} gereklidir`;
    }
    return validateNumber(value, fieldName, min, max);
};

export const validateString = (value: any, fieldName: string, minLen: number = 1, maxLen: number = 500): string | null => {
    if (!value || typeof value !== "string") {
        return `${fieldName} gereklidir`;
    }
    const trimmed = value.trim();
    if (trimmed.length < minLen) {
        return `${fieldName} en az ${minLen} karakter olmalıdır`;
    }
    if (trimmed.length > maxLen) {
        return `${fieldName} en fazla ${maxLen} karakter olabilir`;
    }
    return null;
};

// Sanitize string - strip HTML tags to prevent basic XSS
export const sanitizeString = (value: string): string => {
    if (typeof value !== "string") return value;
    return value.replace(/<[^>]*>/g, "").trim();
};

// ============ VALIDATION MIDDLEWARE ============

// Register validation
export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
    const { email, password, name } = req.body;

    if (!email || !validateEmail(email)) {
        res.status(400).json({ error: "Geçerli bir email adresi girin" });
        return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        res.status(400).json({ error: passwordError });
        return;
    }

    if (name) {
        const nameError = validateString(name, "İsim", 1, 100);
        if (nameError) {
            res.status(400).json({ error: nameError });
            return;
        }
        req.body.name = sanitizeString(name);
    }

    req.body.email = email.toLowerCase().trim();
    next();
};

// Login validation
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
    const { email, password } = req.body;

    if (!email || !validateEmail(email)) {
        res.status(400).json({ error: "Geçerli bir email adresi girin" });
        return;
    }

    if (!password) {
        res.status(400).json({ error: "Şifre gereklidir" });
        return;
    }

    req.body.email = email.toLowerCase().trim();
    next();
};

// Profile update validation
export const validateProfileUpdate = (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    const { name, age, weight, height, dailyCalorieGoal, dailyWaterGoal } = req.body;

    if (name !== undefined) {
        const nameError = validateString(name, "İsim", 1, 100);
        if (nameError) errors.push(nameError);
        else req.body.name = sanitizeString(name);
    }

    const ageError = validateNumber(age, "Yaş", 10, 120);
    if (ageError) errors.push(ageError);

    const weightError = validateNumber(weight, "Kilo", 20, 500);
    if (weightError) errors.push(weightError);

    const heightError = validateNumber(height, "Boy", 50, 300);
    if (heightError) errors.push(heightError);

    const calorieError = validateNumber(dailyCalorieGoal, "Kalori hedefi", 500, 10000);
    if (calorieError) errors.push(calorieError);

    const waterError = validateNumber(dailyWaterGoal, "Su hedefi", 500, 10000);
    if (waterError) errors.push(waterError);

    if (errors.length > 0) {
        res.status(400).json({ error: errors[0], errors });
        return;
    }

    next();
};

// Meal validation
export const validateMeal = (req: Request, res: Response, next: NextFunction): void => {
    const { foodName, calories, protein, carbs, fat } = req.body;

    const nameError = validateString(foodName, "Yemek adı", 1, 200);
    if (nameError) {
        res.status(400).json({ error: nameError });
        return;
    }

    const calorieError = validateRequiredNumber(calories, "Kalori", 0, 50000);
    if (calorieError) {
        res.status(400).json({ error: calorieError });
        return;
    }

    const proteinError = validateNumber(protein, "Protein", 0, 5000);
    if (proteinError) { res.status(400).json({ error: proteinError }); return; }

    const carbsError = validateNumber(carbs, "Karbonhidrat", 0, 5000);
    if (carbsError) { res.status(400).json({ error: carbsError }); return; }

    const fatError = validateNumber(fat, "Yağ", 0, 5000);
    if (fatError) { res.status(400).json({ error: fatError }); return; }

    req.body.foodName = sanitizeString(foodName);
    next();
};

// Water validation
export const validateWater = (req: Request, res: Response, next: NextFunction): void => {
    const { amount } = req.body;

    const amountError = validateRequiredNumber(amount, "Su miktarı", 1, 5000);
    if (amountError) {
        res.status(400).json({ error: amountError });
        return;
    }

    next();
};

// Exercise validation
export const validateExercise = (req: Request, res: Response, next: NextFunction): void => {
    const { name, duration } = req.body;

    const nameError = validateString(name, "Egzersiz adı", 1, 100);
    if (nameError) {
        res.status(400).json({ error: nameError });
        return;
    }

    const durationError = validateRequiredNumber(duration, "Süre (dakika)", 1, 600);
    if (durationError) {
        res.status(400).json({ error: durationError });
        return;
    }

    const calorieError = validateNumber(req.body.caloriesBurned, "Yakılan kalori", 0, 50000);
    if (calorieError) {
        res.status(400).json({ error: calorieError });
        return;
    }

    req.body.name = sanitizeString(name);
    next();
};
