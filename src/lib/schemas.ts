
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

// FRPServerConfig - these will be ENV variables on the PANDA backend
export const FRP_SERVER_ADDR = process.env.FRP_SERVER_ADDR || "panda.nationquest.fr";
export const FRP_SERVER_PORT = parseInt(process.env.FRP_SERVER_PORT || "7000", 10);
export const FRP_AUTH_TOKEN = process.env.FRP_AUTH_TOKEN || "supersecret";
export const FRP_SERVER_BASE_DOMAIN = process.env.FRP_SERVER_BASE_DOMAIN || "panda.nationquest.fr";

export const frpServiceTypes = ["http", "https", "tcp", "udp"] as const; // Removed stcp, sudp for now for simplicity as per frp basic proxy types for subdomains.

export const FrpServiceSchema = z.object({
  name: z.string().min(3, "Service name must be at least 3 characters long")
    .regex(/^[a-zA-Z0-9-_]+$/, "Name can only contain letters, numbers, hyphens, and underscores."),
  description: z.string().min(10, "Description must be at least 10 characters long").max(200, "Description must be 200 characters or less."),
  localPort: z.number().int().min(1, "Port must be at least 1").max(65535, "Port must be at most 65535"),
  subdomain: z.string().min(3, "Subdomain must be at least 3 characters long")
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, "Invalid subdomain format. Use lowercase letters, numbers, and hyphens."),
  frpType: z.enum(frpServiceTypes, {
    errorMap: (issue, ctx) => {
      if (issue.code === 'invalid_enum_value') {
        return { message: 'Invalid tunnel type. Please select from the list.' };
      }
      return { message: ctx.defaultError };
    },
  }),
  // Advanced options (optional, for future)
  // locations: z.string().optional(),
  // hostHeaderRewrite: z.string().optional(),
  // useEncryption: z.boolean().optional(),
  // useCompression: z.boolean().optional(),
});

// This is the old schema, we will deprecate or merge. For now, keeping it separate for clarity of what's new.
// If we want to support both, we'd need a way to differentiate service types in the UI and DB.
// For this iteration, we are focusing on the FRP integration.
// I'll rename the old one to LegacyServiceSchema and the new one will be the primary ServiceSchema.

export const LegacyServiceSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  local_url: z.string().url("Invalid local URL"),
  public_url: z.string().url("A valid public/tunnel URL is required"),
  domain: z.string().min(1, "Domain is required").refine(
    (domain) => /\.(panda|pinou|pika)$/.test(domain),
    "Domain must end with .panda, .pinou, or .pika"
  ),
  type: z.enum(["website", "api", "game", "ia", "other"], { // Old types
    errorMap: (issue, ctx) => {
      if (issue.code === 'invalid_enum_value') {
        return { message: 'Invalid service type. Please select from the list.' };
      }
      return { message: ctx.defaultError };
    },
  }),
});


// Combining: The PANDA system now primarily registers FrpServices.
// The 'domain' field in the database will store the 'subdomain' from FrpServiceSchema.
// The 'public_url' in the database will store the generated frp public url.
// The 'type' in the database will store the frpType.
// A new 'local_port' column is needed.
// 'local_url' from legacy schema is no longer primary.
export const ServiceSchema = FrpServiceSchema; // ServiceSchema now refers to FrpServiceSchema

export type UserRegistrationInput = z.infer<typeof UserRegistrationSchema>;
export type UserLoginInput = z.infer<typeof UserLoginSchema>;
export type ServiceInput = z.infer<typeof ServiceSchema>; // This is now FrpServiceInput
export type FrpServiceInput = z.infer<typeof FrpServiceSchema>;
export type LegacyServiceInput = z.infer<typeof LegacyServiceSchema>;
