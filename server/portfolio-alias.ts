import { storage } from "./storage";
import type { Customer, TwinProfile } from "@shared/schema";

/**
 * Vinos Samuel's public portfolio slug is `vinos`.
 * Production still stores his customers.username as `admin` until a one-time SQL rename.
 * `/portfolio/admin` 301s to `/portfolio/vinos`; public API lookups accept both.
 * Do not treat `/admin` (staff dashboard) as a portfolio URL.
 * Do not alias any other user's slug.
 */
export const CANONICAL_VINOS_SLUG = "vinos";
export const LEGACY_VINOS_SLUG = "admin";

export function canonicalPublicUsername(username: string): string {
  return username.toLowerCase() === LEGACY_VINOS_SLUG
    ? CANONICAL_VINOS_SLUG
    : username;
}

export function publicUsernameCandidates(username: string): string[] {
  const lower = username.toLowerCase();
  if (lower === CANONICAL_VINOS_SLUG || lower === LEGACY_VINOS_SLUG) {
    // Canonical first so post-rename lookups hit `vinos`; `admin` is fallback pre-rename.
    return [CANONICAL_VINOS_SLUG, LEGACY_VINOS_SLUG];
  }
  return [username];
}

export async function getCustomerForPublicPortfolio(
  username: string,
): Promise<Customer | undefined> {
  for (const candidate of publicUsernameCandidates(username)) {
    const customer = await storage.getCustomerByUsername(candidate);
    if (customer) return customer;
  }
  return undefined;
}

export async function getProfileForPublicPortfolio(
  username: string,
): Promise<TwinProfile | undefined> {
  const customer = await getCustomerForPublicPortfolio(username);
  if (!customer) return undefined;
  return storage.getProfileByCustomerId(customer.id);
}
