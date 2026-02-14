import Stripe from 'stripe';

let connectionSettings: any;
let stripeAvailable: boolean | null = null;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const connectorName = 'stripe';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  const data = await response.json();
  connectionSettings = data.items?.[0];

  if (!connectionSettings || (!connectionSettings.settings.publishable || !connectionSettings.settings.secret)) {
    throw new Error(`Stripe ${targetEnvironment} connection not found`);
  }

  return {
    publishableKey: connectionSettings.settings.publishable,
    secretKey: connectionSettings.settings.secret,
  };
}

export async function isStripeConfigured(): Promise<boolean> {
  if (stripeAvailable !== null) return stripeAvailable;
  try {
    await getCredentials();
    stripeAvailable = true;
  } catch {
    stripeAvailable = false;
    console.warn('[Stripe] Not configured - payment features disabled');
  }
  return stripeAvailable;
}

export async function getUncachableStripeClient(): Promise<Stripe | null> {
  try {
    const { secretKey } = await getCredentials();
    return new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil' as any,
    });
  } catch {
    return null;
  }
}

export async function getStripePublishableKey(): Promise<string | null> {
  try {
    const { publishableKey } = await getCredentials();
    return publishableKey;
  } catch {
    return null;
  }
}

export async function getStripeSecretKey(): Promise<string | null> {
  try {
    const { secretKey } = await getCredentials();
    return secretKey;
  } catch {
    return null;
  }
}

let stripeSync: any = null;

export async function getStripeSync(): Promise<any | null> {
  if (!stripeSync) {
    const secretKey = await getStripeSecretKey();
    if (!secretKey) return null;

    const { StripeSync } = await import('stripe-replit-sync');
    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
