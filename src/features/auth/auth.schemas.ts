import { z } from "zod";

export const credentialsSchema = z.object({
	email: z.string().trim().email("Enter a valid email address.").max(254),
	password: z
		.string()
		.min(1, "Enter your password.")
		.max(128, "Password must contain at most 128 characters."),
});

export const registrationSchema = credentialsSchema.extend({
	password: z
		.string()
		.min(8, "Use a password with at least 8 characters.")
		.max(128, "Password must contain at most 128 characters."),
	redirect: z.string().max(2048).optional(),
});

export const recoveryEmailSchema = credentialsSchema.pick({ email: true });

export const passwordResetSchema = z
	.object({
		password: registrationSchema.shape.password,
		confirmPassword: z.string().max(128),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match.",
		path: ["confirmPassword"],
	});
