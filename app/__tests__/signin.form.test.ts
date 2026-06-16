import { describe, expect, it } from "vitest";

describe("auth validation", () => {
	describe("email validation", () => {
		const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

		it("should accept valid email formats", () => {
			expect(isValidEmail("test@example.com")).toBe(true);
			expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
			expect(isValidEmail("user+tag@domain.com")).toBe(true);
		});

		it("should reject invalid email formats", () => {
			expect(isValidEmail("invalid")).toBe(false);
			expect(isValidEmail("missing@domain")).toBe(false);
			expect(isValidEmail("@nodomain.com")).toBe(false);
			expect(isValidEmail("spaces in@email.com")).toBe(false);
		});
	});

	describe("password validation", () => {
		const minLength = 6;

		it("should accept passwords with minimum length", () => {
			expect("123456".length >= minLength).toBe(true);
			expect("password".length >= minLength).toBe(true);
		});

		it("should reject passwords below minimum length", () => {
			expect("12345".length >= minLength).toBe(false);
			expect("123".length >= minLength).toBe(false);
			expect("".length >= minLength).toBe(false);
		});
	});

	describe("password match validation", () => {
		it("should return true when passwords match", () => {
			const password = "password123";
			const confirmPassword = "password123";
			expect(password === confirmPassword).toBe(true);
		});

		it("should return false when passwords do not match", () => {
			const password = "password123";
			const confirmPassword = "different";
			expect(password).not.toBe(confirmPassword);
		});
	});
});
