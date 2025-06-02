
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

export const serviceTypes = ["website", "api", "game", "ia", "other"] as const;

export const ServiceSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  local_url: z.string().url("Invalid local URL"),
  public_url: z.string().url("A valid public/tunnel URL is required"), // Made mandatory
  domain: z.string().min(1, "Domain is required").refine(
    (domain) => /\.(panda|pinou|pika)$/.test(domain),
    "Domain must end with .panda, .pinou, or .pika"
  ),
  type: z.enum(serviceTypes, {
    // removed required_error from here
    errorMap: (issue, ctx) => {
      if (issue.code === 'invalid_enum_value') {
        return { message: 'Invalid service type. Please select from the list.' };
      }
      // For other issues, including if the type is not provided (which might be an 'invalid_type' error),
      // Zod's default message will be used.
      return { message: ctx.defaultError };
    },
  }),
});

export type UserRegistrationInput = z.infer<typeof UserRegistrationSchema>;
export type UserLoginInput = z.infer<typeof UserLoginSchema>;
export type ServiceInput = z.infer<typeof ServiceSchema>;
