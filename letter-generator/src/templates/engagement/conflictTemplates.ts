import type { ConflictOfInterest } from '../../types';

export interface ConflictTemplate {
  id: string;
  category: string;
  title: string;
  description: string;
  defaultText: string;
}

export const STANDARD_CONFLICTS: ConflictTemplate[] = [
  {
    id: 'aum_conflict',
    category: 'Fee-Based',
    title: 'Assets Under Management',
    description: 'Conflict from being paid based on assets managed',
    defaultText:
      'My firm and I are paid a percentage of the assets you place with us in an advisory account. This creates an incentive for me to recommend that you increase the assets in your advisory account, and to recommend that you do not take actions that would decrease those assets.',
  },
  {
    id: 'commission_conflict',
    category: 'Commission-Based',
    title: 'Commission Compensation',
    description: 'Conflict from earning commissions on product sales',
    defaultText:
      'I receive commissions when you purchase certain investment and insurance products. This creates an incentive for me to recommend products that pay higher commissions, even if other products might be more suitable for your needs.',
  },
  {
    id: 'dual_registration',
    category: 'Dual Registration',
    title: 'Dual Registration (IA/BD)',
    description: 'Conflict from being registered as both IA and BD representative',
    defaultText:
      'I am registered as both an investment adviser representative and a broker-dealer representative. When acting as a broker, I may receive commissions that create different incentives than when I am acting in my advisory capacity. I will clearly inform you when I am acting in each capacity.',
  },
  {
    id: 'insurance_license',
    category: 'Insurance',
    title: 'Insurance Agent License',
    description: 'Conflict from selling insurance products',
    defaultText:
      'I am licensed to sell insurance products and receive commissions on insurance sales. This creates an incentive for me to recommend insurance products, including products that pay higher commissions.',
  },
  {
    id: 'third_party_payments',
    category: 'Third-Party',
    title: 'Third-Party Payments',
    description: 'Conflict from payments received from third parties',
    defaultText:
      'My firm receives payments from certain mutual fund companies, insurance companies, or other product sponsors. These payments may influence which products I recommend, as products from sponsors who make payments may be favored.',
  },
  {
    id: 'revenue_sharing',
    category: 'Third-Party',
    title: 'Revenue Sharing',
    description: 'Conflict from revenue sharing arrangements',
    defaultText:
      'My firm participates in revenue sharing arrangements with certain product sponsors. We receive a portion of the fees charged by these products, which creates an incentive to recommend products that participate in our revenue sharing program.',
  },
  {
    id: 'proprietary_products',
    category: 'Proprietary',
    title: 'Proprietary Products',
    description: 'Conflict from recommending firm proprietary products',
    defaultText:
      'My firm offers proprietary investment products. I have an incentive to recommend these products because my firm receives additional revenue when you invest in them.',
  },
  {
    id: 'referral_arrangements',
    category: 'Referral',
    title: 'Referral Arrangements',
    description: 'Conflict from paid referral relationships',
    defaultText:
      'I have referral arrangements with other professionals and may receive or pay fees for client referrals. This creates an incentive to make referrals to parties who pay referral fees, rather than solely based on the quality of services.',
  },
  {
    id: 'custody_arrangement',
    category: 'Custodial',
    title: 'Custodian Selection',
    description: 'Conflict from custodian arrangements',
    defaultText:
      'My firm has arrangements with certain custodians who provide services that benefit our firm. This creates an incentive to recommend these custodians, even if other custodians might offer lower costs or better services for your needs.',
  },
  {
    id: 'soft_dollars',
    category: 'Trading',
    title: 'Soft Dollar Arrangements',
    description: 'Conflict from soft dollar benefits',
    defaultText:
      'My firm receives research and other services from broker-dealers in exchange for directing client trades to those brokers. This creates an incentive to direct your trades to brokers who provide these benefits, even if other brokers might offer better execution.',
  },
  {
    id: 'outside_business',
    category: 'Outside Activities',
    title: 'Outside Business Activities',
    description: 'Conflict from outside business interests',
    defaultText:
      'I engage in outside business activities that may compete for my time and attention. I will always prioritize your interests during our engagement, but these activities may create potential conflicts.',
  },
  {
    id: 'future_conflicts',
    category: 'General',
    title: 'Future Conflicts',
    description: 'Acknowledgment of potential future conflicts',
    defaultText:
      'Additional conflicts may arise in the future as our relationship develops and as products and services change. I commit to disclosing any material conflicts to you promptly as they arise.',
  },
];

export const CONFLICT_CATEGORIES = [
  'Fee-Based',
  'Commission-Based',
  'Dual Registration',
  'Insurance',
  'Third-Party',
  'Proprietary',
  'Referral',
  'Custodial',
  'Trading',
  'Outside Activities',
  'General',
  'Custom',
];

export function createConflictFromTemplate(template: ConflictTemplate): ConflictOfInterest {
  return {
    id: `${template.id}_${Date.now()}`,
    description: template.defaultText,
    isStandard: true,
  };
}

export function createCustomConflict(description: string): ConflictOfInterest {
  return {
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    description,
    isStandard: false,
  };
}
