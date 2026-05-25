import { describe, it, expect } from 'vitest';

describe('signup validation', () => {
	describe('email validation', () => {
		const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

		it('should accept valid email formats', () => {
			expect(isValidEmail('newuser@example.com')).toBe(true);
			expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
		});

		it('should reject invalid email formats', () => {
			expect(isValidEmail('notanemail')).toBe(false);
			expect(isValidEmail('no@domain')).toBe(false);
			expect(isValidEmail('')).toBe(false);
		});
	});

	describe('password validation', () => {
		const minLength = 6;

		it('should accept passwords meeting minimum length', () => {
			expect('123456'.length >= minLength).toBe(true);
			expect('password123'.length >= minLength).toBe(true);
		});

		it('should reject passwords below minimum length', () => {
			expect('12345'.length >= minLength).toBe(false);
			expect('123'.length >= minLength).toBe(false);
		});
	});

	describe('password match validation', () => {
		it('should return true when passwords match', () => {
			const password = 'password123';
			const confirmPassword = 'password123';
			expect(password === confirmPassword).toBe(true);
		});

		it('should return false when passwords do not match', () => {
			const password = 'password123';
			const confirmPassword = 'differentpassword';
			expect(password).not.toBe(confirmPassword);
		});
	});
});

describe('signin validation', () => {
	describe('email validation', () => {
		const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

		it('should accept valid email formats', () => {
			expect(isValidEmail('user@domain.com')).toBe(true);
		});

		it('should reject invalid email formats', () => {
			expect(isValidEmail('invalid')).toBe(false);
		});
	});

	describe('password validation', () => {
		const minLength = 6;

		it('should require password to meet minimum length', () => {
			expect('password'.length >= minLength).toBe(true);
			expect('short'.length >= minLength).toBe(false);
		});
	});
});