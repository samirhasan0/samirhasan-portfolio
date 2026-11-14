export type Project = {
  id: string;
  name: string;
  /** Leading part of the name rendered in the accent colour, e.g. 'Auto' in AutoWorx */
  accent?: string;
  /** One-line claim shown on the card under the name */
  tagline?: string;
  year: string;
  role: string;
  category: string;
  summary: string;
  highlights: string[];
  status: string;
  image: string;
  /** Brand tone used for the hover glow behind each card */
  tone: string;
  /** 'browser' frames a desktop screenshot; 'phone' frames a mobile one */
  frame: 'browser' | 'phone';
  url?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
};

export const projects: Project[] = [
  {
    id: 'luminar-technology',
    name: 'Luminar Technology',
    year: '2025',
    role: 'CEO & Founder',
    category: 'Technology',
    summary:
      'A technology holding company building compute infrastructure, autonomous systems, and applied AI — unified by a shared design language and operating thesis.',
    highlights: ['CEO & Founder', 'Full time · Mar 2025 – Present', 'Software, consulting & AI services'],
    status: 'Running',
    image: '/work/luminar.jpg',
    tone: '#2DD4A8',
    frame: 'browser',
    url: 'https://luminartechnology.com',
  },
  {
    id: 'autoworx',
    name: 'AutoWorx',
    accent: 'Auto',
    tagline: 'The world’s first agentic AI-based platform',
    year: '2023',
    role: 'COO',
    category: 'Agentic AI · ERP / CRM',
    summary:
      'The world’s first agentic AI-based platform for the automobile industry — AI agents that run leads, estimates, scheduling, inventory, invoicing, and workshop operations in one place.',
    highlights: ['COO', 'Agentic AI platform', 'Web, iOS & Android'],
    status: 'Live',
    image: '/work/autoworx.jpg',
    tone: '#2BB8C9',
    frame: 'browser',
    url: 'https://autoworx.tech/',
  },
  {
    id: 'grs-certification',
    name: 'GRS Certification',
    year: '2026',
    role: 'Product Lead',
    category: 'Certification',
    summary:
      'The website for Global Registrar of Systems — a JASANZ and IAS accredited body providing ISO certification, independent inspection and professional training to enterprises across Australia, New Zealand, the USA and the Asia Pacific, with online certificate verification.',
    highlights: ['Product Lead', 'Design & development', 'ISO certification · Inspection · Training'],
    status: 'Live',
    image: '/work/grs.jpg',
    tone: '#C9A24B',
    frame: 'browser',
    url: 'https://grscertification.com/',
  },
  {
    id: 'banglareels-app',
    name: 'BanglaReels App',
    year: '2026',
    role: 'Product Lead',
    category: 'Mobile app',
    summary:
      'The native mobile app for BanglaReels — a short-video and drama platform for Bangla-speaking audiences, available on iOS and Android.',
    highlights: ['Product Lead', 'Native iOS & Android', 'App Store · Google Play'],
    status: 'Live',
    image: '/work/banglareels-app.jpg',
    tone: '#FB7185',
    frame: 'phone',
    appStoreUrl: 'https://apps.apple.com/pl/app/banglareels-short-drama-fun/id6755810957',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.luminar.banglareelsnative&hl=en',
  },
  {
    id: 'banglareels',
    name: 'BanglaReels Web',
    year: '2026',
    role: 'Product Lead',
    category: 'App & Web',
    summary:
      'A short-video and drama platform for Bangla-speaking audiences — built to celebrate local creators and culture, on web and mobile.',
    highlights: ['Product Lead', 'App & web platform', 'Original Bangla short dramas'],
    status: 'Live',
    image: '/work/banglareels.jpg',
    tone: '#F43F5E',
    frame: 'browser',
    url: 'https://banglareels.com',
  },
  {
    id: 'tc-customs',
    name: 'TC Customs',
    year: '2024',
    role: 'Lead Developer',
    category: 'Web',
    summary:
      "A full-service custom automotive studio in Atlanta — a complete web presence covering services, gallery, financing and customer enquiries for one of Atlanta's premier customization shops.",
    highlights: ['Lead Developer', 'Design & development', 'Atlanta, GA'],
    status: 'Live',
    image: '/work/tccustoms-v2.jpg',
    tone: '#EF4444',
    frame: 'browser',
    url: 'https://tccustomsatl.com/',
  },
  {
    id: 'memorica',
    name: 'Memorica',
    year: '2024',
    role: 'Product Lead',
    category: 'Events',
    summary:
      'An event management and social media marketing studio in Kushtia, Bangladesh — end-to-end planning that turns ideas into experiences, and moments into memories.',
    highlights: ['Product Lead', 'Product & design', 'Events & brand growth'],
    status: 'Live',
    image: '/work/memorica-v2.jpg',
    tone: '#F2773A',
    frame: 'browser',
    url: 'https://www.memorica.events',
  },
  {
    id: 'prenda-solution',
    name: 'Prenda Solution',
    year: '2024',
    role: 'Product Lead',
    category: 'Software',
    summary:
      'A software solutions company delivering digital products and services to clients across industries.',
    highlights: ['Product Lead', 'Product & engineering', 'Multi-industry clients'],
    status: 'Live',
    image: '/work/prenda.jpg',
    tone: '#A78BFA',
    frame: 'browser',
    url: 'https://prendasolution.com',
  },
];

/** Footer ventures, as listed on samirhasan.com */
export const ventures = [
  { label: 'Luminar Technology', href: 'https://luminartechnology.com' },
  { label: 'AutoWorx', href: 'https://autoworx.tech/' },
  { label: 'Prenda Solution', href: 'https://prendasolution.com' },
  { label: 'BanglaReels', href: 'https://banglareels.com' },
  { label: 'Memorica', href: 'https://www.memorica.events' },
];

export const LINKEDIN = { handle: 'samir-hasan', href: 'https://www.linkedin.com/in/samir-hasan-18048524a/' };

export const socials = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/samir-hasan-18048524a/' },
  { label: 'Instagram', href: 'https://www.instagram.com/samir_hasann_/' },
];

export const EMAIL = 'hello@samirhasan.com';
