import { BusinessSetup } from './businessSetup';

export interface BusinessSetupProfile {
  id: string;
  name: string;
  description: string;
  category: 'lease_purchase' | 'percentage_lease' | 'independent_contractor' | 'owner_operator';
  popularityRank: number; // 1-5, where 1 is most common
  setup: Partial<BusinessSetup>;
  pros: string[];
  cons: string[];
  typicalScenarios: string[];
}

export const industryBusinessProfiles: BusinessSetupProfile[] = [
  {
    id: 'standard_percentage_lease',
    name: '75/25 Percentage Lease',
    description: 'Most common arrangement - you keep 75% of gross revenue, carrier handles most expenses',
    category: 'percentage_lease',
    popularityRank: 1,
    setup: {
      pay_structure_type: 'gross_revenue',
      revenue_split_percentage: 75,
      fuel_responsibility: 'driver_pays',
      fuel_card_provided: true,
      maintenance_coverage: 'carrier_full',
      insurance_responsibility: 'carrier_pays',
      deadhead_compensation_type: 'per_mile',
      deadhead_compensation_rate: 0.75,
      deadhead_minimum_miles: 50,
      fsc_handling: 'driver_receives_fsc',
      detention_pay_rate: 30,
      detention_minimum_hours: 2,
      layover_pay_rate: 75,
      extra_stop_rate: 25,
      loading_unloading_pay: 25,
      tarping_pay: 50,
      toll_responsibility: 'carrier_pays',
      admin_fee_percentage: 2.5,
      weekly_escrow_payment: 50
    },
    pros: [
      'Carrier handles maintenance and insurance',
      'Predictable fuel card access',
      'Good percentage for most loads',
      'Toll reimbursement included'
    ],
    cons: [
      'You pay for fuel costs',
      'Admin fees reduce take-home',
      'Less control over maintenance'
    ],
    typicalScenarios: [
      'New owner-operators',
      'Drivers transitioning from company driving',
      'Regional and OTR freight'
    ]
  },
  {
    id: 'premium_percentage_lease',
    name: '80/20 Premium Lease',
    description: 'Higher percentage split for experienced drivers with good safety records',
    category: 'percentage_lease',
    popularityRank: 2,
    setup: {
      pay_structure_type: 'gross_revenue',
      revenue_split_percentage: 80,
      fuel_responsibility: 'driver_pays',
      fuel_card_provided: true,
      maintenance_coverage: 'split_cost',
      maintenance_deductible: 500,
      maintenance_max_coverage: 20000,
      insurance_responsibility: 'carrier_pays',
      deadhead_compensation_type: 'per_mile',
      deadhead_compensation_rate: 0.85,
      deadhead_minimum_miles: 25,
      fsc_handling: 'driver_receives_fsc',
      detention_pay_rate: 35,
      detention_minimum_hours: 2,
      layover_pay_rate: 100,
      extra_stop_rate: 30,
      loading_unloading_pay: 30,
      tarping_pay: 75,
      toll_responsibility: 'reimbursed',
      admin_fee_percentage: 1.5,
      weekly_escrow_payment: 75,
      safety_bonus_amount: 500,
      performance_bonus_amount: 1000
    },
    pros: [
      'Higher revenue percentage',
      'Better deadhead compensation',
      'Performance and safety bonuses',
      'Lower admin fees'
    ],
    cons: [
      'Shared maintenance responsibilities',
      'Higher escrow requirements',
      'Must maintain excellent safety record'
    ],
    typicalScenarios: [
      'Experienced owner-operators',
      'Excellent safety records',
      'High-value freight specialists'
    ]
  },
  {
    id: 'lease_purchase_program',
    name: 'Lease-to-Own Program',
    description: 'Path to truck ownership with weekly payments and eventual ownership',
    category: 'lease_purchase',
    popularityRank: 3,
    setup: {
      pay_structure_type: 'percentage_split',
      revenue_split_percentage: 72,
      fuel_responsibility: 'driver_pays',
      fuel_card_provided: true,
      maintenance_coverage: 'up_to_amount',
      maintenance_deductible: 300,
      maintenance_max_coverage: 15000,
      insurance_responsibility: 'deducted_from_pay',
      weekly_truck_payment: 450,
      weekly_insurance_payment: 125,
      weekly_escrow_payment: 100,
      deadhead_compensation_type: 'percentage',
      deadhead_compensation_rate: 60,
      deadhead_minimum_miles: 50,
      fsc_handling: 'driver_receives_fsc',
      detention_pay_rate: 25,
      detention_minimum_hours: 2.5,
      layover_pay_rate: 50,
      toll_responsibility: 'driver_pays',
      admin_fee_percentage: 3,
      factoring_fee_percentage: 2.5
    },
    pros: [
      'Path to truck ownership',
      'Building equity with payments',
      'Full maintenance coverage up to limits'
    ],
    cons: [
      'High weekly fixed costs',
      'Lower initial percentage',
      'Responsible for tolls and some maintenance'
    ],
    typicalScenarios: [
      'Drivers wanting to own their truck',
      'Long-term career commitment',
      'Stable income requirements'
    ]
  },
  {
    id: 'independent_owner_operator',
    name: 'Independent O/O (Own Authority)',
    description: 'Maximum freedom and earnings potential with your own authority and customers',
    category: 'independent_contractor',
    popularityRank: 4,
    setup: {
      pay_structure_type: 'flat_rate',
      revenue_split_percentage: 92, // After factoring and fees
      fuel_responsibility: 'driver_pays',
      fuel_card_provided: false,
      maintenance_coverage: 'driver_full',
      insurance_responsibility: 'driver_pays',
      weekly_truck_payment: 0, // Assuming owned
      weekly_insurance_payment: 200,
      deadhead_compensation_type: 'none', // Negotiate with each load
      fsc_handling: 'fsc_in_margin',
      detention_pay_rate: 50, // Negotiate higher rates
      detention_minimum_hours: 1,
      layover_pay_rate: 150,
      toll_responsibility: 'driver_pays',
      factoring_fee_percentage: 3,
      other_weekly_deductions: 150 // Various business expenses
    },
    pros: [
      'Highest earning potential',
      'Complete control over business',
      'Direct customer relationships',
      'Choose your own loads and rates'
    ],
    cons: [
      'All expenses are yours',
      'Need business management skills',
      'Irregular income',
      'Full liability responsibility'
    ],
    typicalScenarios: [
      'Experienced truckers',
      'Specialized freight niches',
      'Regional dedicated runs',
      'Entrepreneurial drivers'
    ]
  },
  {
    id: 'company_driver_percentage',
    name: 'Company Driver (Percentage Pay)',
    description: 'Company equipment with percentage-based pay instead of CPM',
    category: 'percentage_lease',
    popularityRank: 5,
    setup: {
      pay_structure_type: 'linehaul_only',
      revenue_split_percentage: 25, // Driver gets 25% of linehaul
      fuel_responsibility: 'carrier_pays',
      fuel_card_provided: true,
      maintenance_coverage: 'carrier_full',
      insurance_responsibility: 'carrier_pays',
      deadhead_compensation_type: 'flat_rate',
      deadhead_compensation_rate: 50, // Per occurrence
      fsc_handling: 'carrier_keeps_fsc',
      fsc_split_percentage: 50,
      detention_pay_rate: 20,
      detention_minimum_hours: 2,
      layover_pay_rate: 60,
      extra_stop_rate: 15,
      loading_unloading_pay: 15,
      toll_responsibility: 'carrier_pays',
      admin_fee_percentage: 0
    },
    pros: [
      'No equipment costs or maintenance',
      'Predictable expenses',
      'Company handles all compliance',
      'Regular home time options'
    ],
    cons: [
      'Lower percentage of revenue',
      'Less control over equipment',
      'Limited to company freight',
      'Capped earning potential'
    ],
    typicalScenarios: [
      'New CDL holders',
      'Drivers preferring stability',
      'Part-time or local driving',
      'Transition to ownership later'
    ]
  }
];

export const getProfilesByCategory = (category: BusinessSetupProfile['category']) => {
  return industryBusinessProfiles
    .filter(profile => profile.category === category)
    .sort((a, b) => a.popularityRank - b.popularityRank);
};

export const getMostPopularProfiles = (limit = 3) => {
  return industryBusinessProfiles
    .sort((a, b) => a.popularityRank - b.popularityRank)
    .slice(0, limit);
};

export const getProfileById = (id: string) => {
  return industryBusinessProfiles.find(profile => profile.id === id);
};

// Industry benchmarks for validation
export const industryBenchmarks = {
  revenueSpilts: {
    percentage_lease: { min: 65, max: 85, typical: 75 },
    lease_purchase: { min: 60, max: 80, typical: 70 },
    company_percentage: { min: 20, max: 35, typical: 25 },
    independent: { min: 85, max: 98, typical: 92 }
  },
  detentionPay: {
    min: 15,
    max: 75,
    typical: 30,
    minimumHours: { min: 1, max: 4, typical: 2 }
  },
  deadheadCompensation: {
    perMile: { min: 0.40, max: 1.50, typical: 0.75 },
    percentage: { min: 40, max: 80, typical: 60 }
  },
  weeklyPayments: {
    truckPayment: { min: 150, max: 800, typical: 400 },
    insurance: { min: 40, max: 300, typical: 125 },
    escrow: { min: 25, max: 150, typical: 75 }
  },
  adminFees: {
    percentage: { min: 0, max: 8, typical: 2.5 },
    factoringFee: { min: 1.5, max: 5, typical: 3 }
  }
} as const;