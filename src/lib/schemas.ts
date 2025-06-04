
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
export const FRP_AUTH_TOKEN = process.env.FRP_AUTH_TOKEN || "supersecret"; 
export const FRP_SERVER_BASE_DOMAIN = process.env.NEXT_PUBLIC_FRP_SERVER_BASE_DOMAIN || "panda.nationquest.fr";


export const frpServiceTypes = ["http", "https", "tcp", "udp", "stcp", "xtcp"] as const;
export type FrpServiceType = (typeof frpServiceTypes)[number];

export const FrpServiceSchema = z.object({
  name: z.string().min(3, "Service name must be at least 3 characters long")
    .regex(/^[a-zA-Z0-9-_]+$/, "Name can only contain letters, numbers, hyphens, and underscores."),
  description: z.string().min(10, "Description must be at least 10 characters long").max(200, "Description must be 200 characters or less."),
  localPort: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : (typeof val === 'string' ? parseInt(val, 10) : Number(val)),
    z.number({invalid_type_error: "Local port must be a number."}).int().min(1, "Port must be at least 1").max(65535, "Port must be at most 65535")
  ).describe("The port your local service runs on."),
  subdomain: z.string().min(3, "Subdomain must be at least 3 characters long")
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, "Invalid subdomain format. Use lowercase letters, numbers, and hyphens. Example: 'mycoolservice' not 'mycoolservice.panda.nationquest.fr'"),
  frpType: z.enum(frpServiceTypes, {
    // REMOVED: required_error: "Tunnel type is required.",
    errorMap: (issue, ctx) => {
      if (issue.code === 'invalid_type' && issue.expected === 'union') { // More general for missing enum
        return { message: 'Tunnel type is required and must be selected from the list.' };
      }
      if (issue.code === 'invalid_enum_value') {
        return { message: 'Invalid tunnel type. Please select from the list.' };
      }
      return { message: ctx.defaultError };
    },
  }),
  // Future advanced frp settings can be added here. Example:
  // useEncryption: z.boolean().optional().default(false),
  // useCompression: z.boolean().optional().default(false),
  // customHttpHostHeaderRewrite: z.string().optional(),
  // customHttpLocations: z.string().optional(),
});


// This is the schema for the PANDA Pod service registration (from the old system).
// It is being replaced by FrpServiceSchema logic.
export const LegacyServiceSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  local_url: z.string().url("Invalid local URL (e.g. http://localhost:3000)"),
  public_url: z.string().url("A valid public/tunnel URL is required (e.g. from ngrok or playit.gg)"),
  domain: z.string().min(1, "Domain is required for legacy services").refine(
    (domain) => /\.(panda|pinou|pika)$/.test(domain),
    "Domain must end with .panda, .pinou, or .pika"
  ),
  type: z.enum(["website", "api", "game", "ia", "other"], {
    errorMap: (issue, ctx) => {
      if (issue.code === 'invalid_enum_value') {
        return { message: 'Invalid service type. Please select from the list.' };
      }
      return { message: ctx.defaultError };
    },
  }),
});

// Use FrpServiceSchema as the primary schema for new service registrations
export const ServiceSchema = FrpServiceSchema;

export type UserRegistrationInput = z.infer<typeof UserRegistrationSchema>;
export type UserLoginInput = z.infer<typeof UserLoginSchema>;
export type FrpServiceInput = z.infer<typeof FrpServiceSchema>;
export type ServiceInput = FrpServiceInput;
export type LegacyServiceInput = z.infer<typeof LegacyServiceSchema>;
