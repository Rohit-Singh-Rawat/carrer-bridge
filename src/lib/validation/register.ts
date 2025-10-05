import * as z from 'zod';

// Reusable password validation functions
export const passwordValidations = {
	minLength: (password: string) => password.length >= 8,
	hasUppercase: (password: string) => /[A-Z]/.test(password),
	hasLowercase: (password: string) => /[a-z]/.test(password),
	hasNumber: (password: string) => /\d/.test(password),
};

// Validation rules for UI display
export const passwordRules = [
	{ label: '8 characters', validator: passwordValidations.minLength },
	{ label: 'Uppercase', validator: passwordValidations.hasUppercase },
	{ label: 'Lowercase', validator: passwordValidations.hasLowercase },
	{ label: 'Number', validator: passwordValidations.hasNumber },
];

export const registerSchema = z.object({
	email: z.string().email({ message: 'Invalid email address' }),
	password: z
		.string()
		.refine(passwordValidations.minLength, {
			message: 'Password must be at least 8 characters',
		})
		.refine(passwordValidations.hasUppercase, {
			message: 'Password must contain at least one uppercase letter',
		})
		.refine(passwordValidations.hasLowercase, {
			message: 'Password must contain at least one lowercase letter',
		})
		.refine(passwordValidations.hasNumber, {
			message: 'Password must contain at least one number',
		}),
	name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
