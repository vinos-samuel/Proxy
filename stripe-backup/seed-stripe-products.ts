import { getUncachableStripeClient } from './stripeClient';

const PRODUCTS = [
  {
    name: 'Launch - AI Twin Portfolio',
    description: 'AI portfolio + chatbot, 6-month hosting, downloadable version, username.biosai.com domain',
    amount: 19900,
    metadata: { tier: 'launch' },
  },
  {
    name: 'Evolve - AI Twin Portfolio + Editing',
    description: 'Custom domain support, portfolio editor, tune your twin dashboard, theme switcher, analytics, 12-month hosting',
    amount: 39900,
    metadata: { tier: 'evolve' },
  },
  {
    name: 'Concierge - White-Glove AI Twin',
    description: '90-min strategy interview, professional copywriting, white-glove build, advanced chatbot tuning, priority support, 60-day conversation guarantee',
    amount: 99900,
    metadata: { tier: 'concierge' },
  },
];

export async function seedStripeProducts() {
  try {
    const stripe = await getUncachableStripeClient();

    for (const prod of PRODUCTS) {
      const existing = await stripe.products.search({
        query: `name:'${prod.name}'`,
      });

      if (existing.data.length > 0) {
        console.log(`Stripe product "${prod.name}" already exists, skipping`);
        continue;
      }

      const product = await stripe.products.create({
        name: prod.name,
        description: prod.description,
        metadata: prod.metadata,
      });

      await stripe.prices.create({
        product: product.id,
        unit_amount: prod.amount,
        currency: 'usd',
      });

      console.log(`Created Stripe product: ${prod.name} ($${prod.amount / 100})`);
    }

    console.log('Stripe products seeded successfully');
  } catch (error) {
    console.error('Failed to seed Stripe products:', error);
  }
}
