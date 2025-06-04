
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

// FRPServerConfig - these will be ENV variables on the PANDA backend / Next.js app
export const FRP_SERVER_ADDR = process.env.NEXT_PUBLIC_FRP_SERVER_ADDR || "panda.nationquest.fr";
export const FRP_SERVER_PORT = parseInt(process.env.NEXT_PUBLIC_FRP_SERVER_PORT || "7000", 10);
// IMPORTANT: FRP_AUTH_TOKEN should be a server-side env var, not prefixed with NEXT_PUBLIC_
// It's used by PANDA backend to generate the toml, not directly by client-side JS.
// However, for the purpose of displaying it in a generated toml that the user copies,
// if the PANDA app itself (Next.js server part) generates the toml string, it can access process.env.FRP_AUTH_TOKEN.
export const FRP_AUTH_TOKEN = process.env.FRP_AUTH_TOKEN || "supersecret"; // This should match your frps server token
export const FRP_SERVER_BASE_DOMAIN = process.env.NEXT_PUBLIC_FRP_SERVER_BASE_DOMAIN || "panda.nationquest.fr";


// Updated frpServiceTypes to include stcp and xtcp as per user request and frp docs
export const frpServiceTypes = ["http", "https", "tcp", "udp", "stcp", "xtcp"] as const;

export const FrpServiceSchema = z.object({
  name: z.string().min(3, "Service name must be at least 3 characters long")
    .regex(/^[a-zA-Z0-9-_]+$/, "Name can only contain letters, numbers, hyphens, and underscores."),
  description: z.string().min(10, "Description must be at least 10 characters long").max(200, "Description must be 200 characters or less."),
  localPort: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? 0 : (typeof val === 'string' ? parseInt(val, 10) : Number(val)),
    z.number({invalid_type_error: "Local port must be a number."}).int().min(1, "Port must be at least 1").max(65535, "Port must be at most 65535")
  ).describe("The port your local service runs on."),
  subdomain: z.string().min(3, "Subdomain must be at least 3 characters long")
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, "Invalid subdomain format. Use lowercase letters, numbers, and hyphens. Example: 'mycoolservice' not 'mycoolservice.panda.nationquest.fr'"),
  frpType: z.enum(frpServiceTypes, {
    required_error: "Tunnel type is required.",
    errorMap: (issue, ctx) => {
      if (issue.code === 'invalid_enum_value') {
        return { message: 'Invalid tunnel type. Please select from the list.' };
      }
      return { message: ctx.defaultError };
    },
  }),
  // Optional advanced frp settings (can be added later)
  // locations: z.string().optional(), // For http type, URL routing
  // hostHeaderRewrite: z.string().optional(), // For http type
  // transport.useEncryption: z.boolean().optional(),
  // transport.useCompression: z.boolean().optional(),
  // remotePort: z.number().int().min(1).max(65535).optional(), // Could be used for TCP/UDP if not using subdomains for them
});


export const ServiceSchema = FrpServiceSchema;

export type UserRegistrationInput = z.infer<typeof UserRegistrationSchema>;
export type UserLoginInput = z.infer<typeof UserLoginSchema>;
export type FrpServiceInput = z.infer<typeof FrpServiceSchema>;
export type ServiceInput = FrpServiceInput; // Alias for consistency if used elsewhere


// Legacy schema, kept for reference if needed for migration or distinct service types.
export const LegacyServiceSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  local_url: z.string().url("Invalid local URL"), // Kept for legacy, but FrpServiceSchema is primary
  public_url: z.string().url("A valid public/tunnel URL is required"), // This will be auto-generated if PANDA_TUNNEL_MAIN_HOST is set
  domain: z.string().min(1, "Domain is required for legacy services").refine( // For legacy, this was the full custom domain
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
export type LegacyServiceInput = z.infer<typeof LegacyServiceSchema>;
