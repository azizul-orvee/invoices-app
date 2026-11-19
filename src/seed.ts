import type { Profile } from './types';

/** First-run profile, taken from the existing Creations Mobile Tyres invoice. */
export const SEED_PROFILES: Profile[] = [
  {
    id: 'creations-mobile-tyres',
    label: 'Creations',
    companyName: 'Creations Mobile Tyres',
    tagline: 'Mobile Tyre Fitting',
    logo: '/logos/creations-mobile-tyres.png',
    brandColor: '#0C1066',
    address: 'Unit 9 Plumstead Business Centre\nLondon\nSE18 1SL',
    phone: '03300 432801',
    mobile: '+44 7935 390891',
    email: 'accounts@creationsgroup.co.uk',
    website: 'www.creationsmobiletyres.co.uk',
    vatNumber: '479167345',
    companyNumber: '',
    invoicePrefix: 'INV',
    paymentTermsDays: 0,
    bankAccountName: '',
    bankSortCode: '',
    bankAccountNumber: '',
    defaultNote: 'Thank you for your business.',
    terms: '',
    quickItems: [{ description: 'Mobile tyre fitting', price: 0 }],
    updatedAt: 0,
  },
];

export function blankProfile(id: string): Profile {
  return {
    id,
    label: '',
    companyName: '',
    tagline: '',
    logo: '',
    brandColor: '#B4232A',
    address: '',
    phone: '',
    mobile: '',
    email: '',
    website: '',
    vatNumber: '',
    companyNumber: '',
    invoicePrefix: 'INV',
    paymentTermsDays: 0,
    bankAccountName: '',
    bankSortCode: '',
    bankAccountNumber: '',
    defaultNote: 'Thank you for your business.',
    terms: '',
    quickItems: [],
    updatedAt: Date.now(),
  };
}
