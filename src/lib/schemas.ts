
import { z } from 'zod';

const strongPassword = z.string().min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

export const UserRegistrationSchema = z.object({
  email: z.string().email(),
  password: strongPassword,
});

export const UserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const ServiceSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  local_url: z.string().url("Invalid local URL"),
  public_url: z.string().url("Invalid public URL").optional().or(z.literal('')), // Optional and can be empty
  domain: z.string().min(1, "Domain is required").refine(
    (domain) => /\.(panda|pinou|pika)$/.test(domain),
    "Domain must end with .panda, .pinou, or .pika"
  ),
  type: z.string().min(1, "Type is required (e.g., website, api)"),
  // token: z.string().uuid("Invalid service token format").optional(), // CLI might send this
});

export type UserRegistrationInput = z.infer<typeof UserRegistrationSchema>;
export type UserLoginInput = z.infer<typeof UserLoginSchema>;
export type ServiceInput = z.infer<typeof ServiceSchema>;
