
import { z } from 'zod';

const strongPassword = z.string().min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

export const UserRegistrationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long.").max(30, "Username must be 30 characters or less.").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
  email: z.string().email(),
  password: strongPassword,
});

export const UserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const UserProfileUpdateSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters long.").max(30, "Username must be 30 characters or less.").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores.").optional(),
    firstName: z.string().max(50, "First name must be 50 characters or less.").optional().nullable(),
    lastName: z.string().max(50, "Last name must be 50 characters or less.").optional().nullable(),
});


const envFrpServerAddr = process.env.NEXT_PUBLIC_FRP_SERVER_ADDR;
export const FRP_SERVER_ADDR = (envFrpServerAddr && envFrpServerAddr.trim() !== "") ? envFrpServerAddr.trim() : "panda.nationquest.fr";

const envFrpServerPort = process.env.NEXT_PUBLIC_FRP_SERVER_PORT;
export const FRP_SERVER_PORT = parseInt((envFrpServerPort && envFrpServerPort.trim() !== "") ? envFrpServerPort.trim() : "7000", 10);

const envFrpAuthToken = process.env.FRP_AUTH_TOKEN;
export const FRP_AUTH_TOKEN = (envFrpAuthToken && envFrpAuthToken.trim() !== "") ? envFrpAuthToken.trim() : "supersecret";

const envFrpBaseDomain = process.env.NEXT_PUBLIC_FRP_SERVER_BASE_DOMAIN;
export const FRP_SERVER_BASE_DOMAIN = (envFrpBaseDomain && envFrpBaseDomain.trim() !== "") ? envFrpBaseDomain.trim() : "panda.nationquest.fr";

const envPandaTunnelMainHost = process.env.PANDA_TUNNEL_MAIN_HOST;
export const PANDA_TUNNEL_MAIN_HOST = (envPandaTunnelMainHost && envPandaTunnelMainHost.trim() !== "") ? envPandaTunnelMainHost.trim() : undefined;

const envPandaAdminEmail = process.env.PANDA_ADMIN_EMAIL;
export const PANDA_ADMIN_EMAIL = (envPandaAdminEmail && envPandaAdminEmail.trim() !== "") ? envPandaAdminEmail.trim() : undefined;


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
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, "Invalid subdomain format. Use lowercase letters, numbers, and hyphens. Example: 'mycoolservice' (not 'mycoolservice." + (PANDA_TUNNEL_MAIN_HOST || FRP_SERVER_BASE_DOMAIN || "example.com") + "')"),
  frpType: z.enum(frpServiceTypes, {
    errorMap: (issue, ctx) => {
      if (issue.code === 'invalid_enum_value') {
        return { message: 'Invalid tunnel type. Please select from the list.' };
      }
      return { message: ctx.defaultError };
    },
  }),
  remotePort: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : (typeof val === 'string' ? parseInt(val, 10) : Number(val)),
    z.number({invalid_type_error: "Remote port must be a number."}).int().min(1, "Port must be at least 1").max(65535, "Port must be at most 65535").optional()
  ),
  useEncryption: z.boolean().optional().default(true),
  useCompression: z.boolean().optional().default(false),
}).superRefine((data, ctx) => {
  if ((data.frpType === 'tcp' || data.frpType === 'udp') && (data.remotePort === undefined || data.remotePort === null || data.remotePort === 0 || isNaN(data.remotePort))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Remote port is required and must be a valid port number (1-65535) for TCP and UDP tunnel types.",
      path: ["remotePort"],
    });
  }
});

export const ServiceSchema = FrpServiceSchema;

export type UserRegistrationInput = z.infer<typeof UserRegistrationSchema>;
export type UserLoginInput = z.infer<typeof UserLoginSchema>;
export type UserProfileUpdateInput = z.infer<typeof UserProfileUpdateSchema>;
export type FrpServiceInput = z.infer<typeof FrpServiceSchema>;
export type ServiceInput = FrpServiceInput;


export const UserRoleSchema = z.enum(['FREE', 'PREMIUM', 'PREMIUM_PLUS', 'ENDIUM', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const API_TOKEN_SCOPES = ["service:read", "service:write", "profile:read"] as const; // Example scopes
export type ApiTokenScope = typeof API_TOKEN_SCOPES[number];

export const ApiTokenCreateSchema = z.object({
    name: z.string().min(3, "Token name must be at least 3 characters").max(50, "Token name too long"),
    // scopes: z.array(z.enum(API_TOKEN_SCOPES)).min(1, "At least one scope is required"), // For simplicity, start without scopes
    expiresAt: z.date().optional().nullable(),
});
export type ApiTokenCreateInput = z.infer<typeof ApiTokenCreateSchema>;

export const ApiTokenDisplaySchema = z.object({
    id: z.string(),
    name: z.string(),
    tokenPrefix: z.string(),
    // scopes: z.array(z.string()),
    lastUsedAt: z.string().nullable(), // Store as ISO string from Date
    expiresAt: z.string().nullable(), // Store as ISO string from Date
    createdAt: z.string(), // Store as ISO string from Date
});
export type ApiTokenDisplay = z.infer<typeof ApiTokenDisplaySchema>;


export const RolesConfig = {
  FREE: {
    maxTunnels: 3,
    canCreateApiTokens: false,
  },
  PREMIUM: {
    maxTunnels: 10,
    canCreateApiTokens: true,
  },
  PREMIUM_PLUS: {
    maxTunnels: 25,
    canCreateApiTokens: true,
  },
  ENDIUM: {
    maxTunnels: 100,
    canCreateApiTokens: true,
  },
  ADMIN: {
    maxTunnels: Infinity,
    canCreateApiTokens: true,
  }
} as const;
