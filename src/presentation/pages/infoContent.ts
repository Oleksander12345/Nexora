export interface InfoPageContent {
  slug: string;
  label: string;
  eyebrow: string;
  heading: string;
  body: readonly string[];
  cta: { label: string; to: string };
}
export const infoPages: readonly InfoPageContent[] = [
  {
    slug: 'support',
    label: 'Support',
    eyebrow: 'WE’RE HERE FOR YOU',
    heading: 'Help with your order.',
    body: [
      'Find your fit, explore product details, and manage your bag at any time. Standard delivery is complimentary; express delivery arrives in one to two business days.',
      'Every order includes 30-day returns. In this storefront, orders are recorded but no payment is collected.',
    ],
    cta: { label: 'Review your bag', to: '/cart' },
  },
  {
    slug: 'about',
    label: 'About',
    eyebrow: 'A BRIGHTER EVERYDAY',
    heading: 'Thoughtfully made. Everyday enjoyed.',
    body: [
      'NEXORA brings together premium technology and thoughtful daily essentials. Timeless design, useful details, and a little more joy in the everyday.',
    ],
    cta: { label: 'Explore NEXORA', to: '/shop' },
  },
  {
    slug: 'sustainability',
    label: 'Sustainability',
    eyebrow: 'FOR A BRIGHTER TOMORROW',
    heading: 'Designed to be kept.',
    body: [
      'Our collection favors durable materials, refillable essentials, and thoughtful construction. Discover the Drift bottle and recycled-fabric Daily backpack.',
    ],
    cta: { label: 'Shop Lifestyle', to: '/shop?category=lifestyle' },
  },
  {
    slug: 'journal',
    label: 'Journal',
    eyebrow: 'LITTLE THINGS. BETTER DAYS.',
    heading: 'Considered essentials for your daily rituals.',
    body: [
      'A desk that gives you room to think. A soundtrack for the long way home. A bag that carries only what matters.',
    ],
    cta: { label: 'Shop New Arrivals', to: '/shop/new' },
  },
];
