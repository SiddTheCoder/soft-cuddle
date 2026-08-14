/**
 * Placeholder CMS content.
 *
 * **Everything here is seeded as `draft` and nothing is ever published by the
 * seeder.** The point is to make the admin editors and the public pages
 * demonstrable before the founder has written real copy — not to put words on
 * the internet. A draft row is invisible to the public site.
 *
 * Two things follow from that, and both matter:
 *
 *   1. The legal documents are **not legal text**. They are shaped like
 *      policies so the editor and the versioning behave realistically. They
 *      say so in their own body. Replace every one of them, reviewed, before
 *      anything is published. Open question 8.
 *   2. The team members are obviously fictional. Replace them with real names,
 *      roles, bios and photos.
 *
 * Idempotent, like the rest of the seed: conflicts on the natural key do
 * nothing, so a founder's edits are never overwritten by a re-run.
 */
import type {
  blogPosts,
  legalDocuments,
  pages,
  productPages,
  services,
  teamMembers,
} from '../schema/cms';

type PageSeed = typeof pages.$inferInsert;
type ServiceSeed = typeof services.$inferInsert;
type TeamMemberSeed = typeof teamMembers.$inferInsert;
type ProductPageSeed = typeof productPages.$inferInsert;
type LegalDocumentSeed = typeof legalDocuments.$inferInsert;
type BlogPostSeed = typeof blogPosts.$inferInsert;

/** Prefixed onto every placeholder body so it cannot be mistaken for copy. */
const PLACEHOLDER =
  '> **Placeholder.** This text was seeded so the page and its editor could be ' +
  'built. Replace it before publishing.';

export const pageSeeds: PageSeed[] = [
  {
    slug: 'home',
    title: 'Softmato',
    body: `${PLACEHOLDER}\n\nSoftmato Technology builds and runs its own software products, and takes on project work for other companies.`,
    metaDescription:
      'Softmato Technology Pvt Ltd — software products and project work, built in Nepal.',
  },
  {
    slug: 'about',
    title: 'About',
    body: `${PLACEHOLDER}\n\nWho the company is, how it started, and what it is trying to build.`,
  },
  {
    slug: 'services',
    title: 'Services',
    body: `${PLACEHOLDER}\n\nWhat we take on, and how an engagement usually runs.`,
  },
  {
    slug: 'products',
    title: 'Products',
    body: `${PLACEHOLDER}\n\nThe software we build and run ourselves.`,
  },
  {
    slug: 'team',
    title: 'Team',
    body: `${PLACEHOLDER}\n\nThe people who do the work.`,
  },
  {
    slug: 'careers',
    title: 'Careers',
    body: `${PLACEHOLDER}\n\nOpen roles, and what it is like to work here.`,
  },
  {
    slug: 'contact',
    title: 'Contact',
    body: `${PLACEHOLDER}\n\nHow to reach us, and what happens after you send the form.`,
  },
];

export const serviceSeeds: ServiceSeed[] = [
  {
    slug: 'product-engineering',
    title: 'Product engineering',
    summary: 'Building and shipping a product end to end.',
    body: `${PLACEHOLDER}\n\nScope, team shape, and how the work is delivered.`,
    sortOrder: 1,
  },
  {
    slug: 'web-applications',
    title: 'Web applications',
    summary: 'Custom applications for a specific business problem.',
    body: `${PLACEHOLDER}`,
    sortOrder: 2,
  },
  {
    slug: 'payment-integration',
    title: 'Payment integration',
    summary: 'Connecting a product to Nepali payment providers.',
    body: `${PLACEHOLDER}`,
    sortOrder: 3,
  },
];

export const teamMemberSeeds: TeamMemberSeed[] = [
  {
    name: 'Placeholder Person',
    role: 'Founder',
    bio: 'Fictional. Replace with a real team member — open question 8.',
    sortOrder: 1,
  },
  {
    name: 'Second Placeholder',
    role: 'Founder',
    bio: 'Fictional. Replace with a real team member — open question 8.',
    sortOrder: 2,
  },
];

/**
 * `productId` must match a row seeded by ./products — the marketing page
 * references the ledger dimension and the foreign key will reject anything
 * else.
 */
export const productPageSeeds: ProductPageSeed[] = [
  {
    productId: 'hostelhub',
    slug: 'hostelhub',
    title: 'HostelHub',
    tagline: 'Placeholder tagline.',
    body: `${PLACEHOLDER}`,
    sortOrder: 1,
  },
  {
    productId: 'questioncall',
    slug: 'questioncall',
    title: 'QuestionCall',
    tagline: 'Placeholder tagline.',
    body: `${PLACEHOLDER}`,
    sortOrder: 2,
  },
];

/**
 * Not legal text. See the note at the top of this file.
 *
 * Version 1 of each, draft, no effective date — the database refuses to
 * publish a policy without one, which is the behaviour we want.
 */
const legalPlaceholder = (name: string) =>
  `${PLACEHOLDER}\n\nThis is **not** a ${name}. It is placeholder text of roughly the right shape so the editor, the versioning and the public route could be built and tested. Have the real policy written and reviewed before publishing this document.`;

export const legalDocumentSeeds: LegalDocumentSeed[] = [
  {
    slug: 'terms',
    title: 'Terms of Service',
    body: legalPlaceholder('terms of service'),
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    body: legalPlaceholder('privacy policy'),
  },
  {
    slug: 'refunds',
    title: 'Refund & Cancellation Policy',
    body: legalPlaceholder('refund and cancellation policy'),
  },
  {
    slug: 'sla',
    title: 'Service Level Agreement',
    body: legalPlaceholder('service level agreement'),
  },
  {
    slug: 'aup',
    title: 'Acceptable Use Policy',
    body: legalPlaceholder('acceptable use policy'),
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    body: legalPlaceholder('cookie policy'),
  },
];

export const blogPostSeeds: BlogPostSeed[] = [
  {
    slug: 'hello-world',
    title: 'A sample post',
    excerpt:
      'Seeded so the draft, preview and publish path can be exercised end to end.',
    body: `${PLACEHOLDER}\n\nWrite the first real post and delete this one.`,
    tags: ['placeholder'],
  },
];
