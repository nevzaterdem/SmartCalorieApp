import { validateEmail, validatePassword, validateNumber, validateRequiredNumber, validateString, sanitizeString } from "../middleware/validate";

describe("Validation Helpers", () => {
    // ============ EMAIL VALIDATION ============
    describe("validateEmail", () => {
        it("geçerli email adreslerini kabul eder", () => {
            expect(validateEmail("test@example.com")).toBe(true);
            expect(validateEmail("user.name@domain.co")).toBe(true);
            expect(validateEmail("user+tag@example.com")).toBe(true);
        });

        it("geçersiz email adreslerini reddeder", () => {
            expect(validateEmail("")).toBe(false);
            expect(validateEmail("not-an-email")).toBe(false);
            expect(validateEmail("@nouser.com")).toBe(false);
            expect(validateEmail("user@")).toBe(false);
            expect(validateEmail("user@.com")).toBe(false);
        });
    });

    // ============ PASSWORD VALIDATION ============
    describe("validatePassword", () => {
        it("geçerli şifreler için null döner", () => {
            expect(validatePassword("123456")).toBeNull();
            expect(validatePassword("strongPassword!")).toBeNull();
        });

        it("kısa şifreler için hata döner", () => {
            expect(validatePassword("12345")).not.toBeNull();
            expect(validatePassword("abc")).not.toBeNull();
            expect(validatePassword("")).not.toBeNull();
        });

        it("çok uzun şifreler için hata döner", () => {
            const longPassword = "a".repeat(129);
            expect(validatePassword(longPassword)).not.toBeNull();
        });

        it("null/undefined şifreler için hata döner", () => {
            expect(validatePassword(null as any)).not.toBeNull();
            expect(validatePassword(undefined as any)).not.toBeNull();
        });
    });

    // ============ NUMBER VALIDATION ============
    describe("validateNumber", () => {
        it("geçerli sayılar için null döner", () => {
            expect(validateNumber(100, "Kalori")).toBeNull();
            expect(validateNumber(50, "Kilo", 20, 500)).toBeNull();
            expect(validateNumber("75", "Boy")).toBeNull();
        });

        it("geçersiz sayılar için hata döner", () => {
            expect(validateNumber("abc", "Kalori")).not.toBeNull();
            expect(validateNumber("not-a-number", "Kilo")).not.toBeNull();
        });

        it("sınır dışı sayılar için hata döner", () => {
            expect(validateNumber(10, "Kilo", 20, 500)).not.toBeNull();
            expect(validateNumber(600, "Kilo", 20, 500)).not.toBeNull();
        });

        it("undefined/null değerler için null döner (opsiyonel alan)", () => {
            expect(validateNumber(undefined, "Kalori")).toBeNull();
            expect(validateNumber(null, "Kalori")).toBeNull();
        });
    });

    // ============ REQUIRED NUMBER VALIDATION ============
    describe("validateRequiredNumber", () => {
        it("zorunlu alanlar için boş değer hata döner", () => {
            expect(validateRequiredNumber(undefined, "Kalori")).not.toBeNull();
            expect(validateRequiredNumber(null, "Kalori")).not.toBeNull();
        });

        it("geçerli zorunlu sayı için null döner", () => {
            expect(validateRequiredNumber(100, "Kalori", 0, 50000)).toBeNull();
        });
    });

    // ============ STRING VALIDATION ============
    describe("validateString", () => {
        it("geçerli stringler için null döner", () => {
            expect(validateString("Tavuk", "Yemek adı")).toBeNull();
            expect(validateString("Pilav", "Yemek adı", 1, 200)).toBeNull();
        });

        it("boş/kısa stringler için hata döner", () => {
            expect(validateString("", "Yemek adı")).not.toBeNull();
            expect(validateString(null as any, "Yemek adı")).not.toBeNull();
            expect(validateString(undefined as any, "Yemek adı")).not.toBeNull();
        });

        it("çok uzun stringler için hata döner", () => {
            const longStr = "a".repeat(501);
            expect(validateString(longStr, "Yemek adı")).not.toBeNull();
        });
    });

    // ============ SANITIZATION ============
    describe("sanitizeString", () => {
        it("HTML etiketlerini temizler", () => {
            expect(sanitizeString("<script>alert('xss')</script>")).toBe("alert('xss')");
            expect(sanitizeString("<b>Bold</b>")).toBe("Bold");
            expect(sanitizeString("Normal metin")).toBe("Normal metin");
        });

        it("boşlukları trimler", () => {
            expect(sanitizeString("  hello  ")).toBe("hello");
        });
    });
});
