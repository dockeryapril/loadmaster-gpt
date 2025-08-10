export interface BusinessSetup {
  id: string;
  user_id: string;
  
  // Revenue and Pay Structure
  revenue_split_percentage?: number; // percentage kept by driver (e.g., 75.00 for 75%)
  pay_structure_type?: 'gross_revenue' | 'linehaul_only' | 'percentage_split' | 'flat_rate';
  carrier_company_name?: string;
  
  // Fuel Management
  fuel_responsibility?: 'driver_pays' | 'carrier_pays' | 'split_cost' | 'reimbursed';
  fuel_reimbursement_rate?: number; // rate per gallon or percentage
  fuel_card_provided?: boolean;
  
  // Maintenance and Repairs
  maintenance_coverage?: 'driver_full' | 'carrier_full' | 'split_cost' | 'up_to_amount';
  maintenance_deductible?: number;
  maintenance_max_coverage?: number;
  
  // Insurance and Fixed Costs
  insurance_responsibility?: 'driver_pays' | 'carrier_pays' | 'deducted_from_pay';
  weekly_truck_payment?: number;
  weekly_insurance_payment?: number;
  weekly_escrow_payment?: number;
  
  // Trip-Related Compensation
  toll_responsibility?: 'driver_pays' | 'carrier_pays' | 'reimbursed';
  deadhead_compensation_type?: 'per_mile' | 'percentage' | 'flat_rate' | 'none';
  deadhead_compensation_rate?: number;
  deadhead_minimum_miles?: number;
  
  // FSC and Additional Pay
  fsc_handling?: 'included_in_rpm' | 'separate_payment' | 'split_with_carrier';
  fsc_split_percentage?: number;
  
  // Detention and Waiting
  detention_pay_rate?: number; // per hour
  detention_minimum_hours?: number;
  layover_pay_rate?: number; // per day
  
  // Extra Services
  extra_stop_rate?: number;
  loading_unloading_pay?: number;
  tarping_pay?: number;
  
  // Deductions and Fees
  admin_fee_percentage?: number;
  admin_fee_flat?: number;
  factoring_fee_percentage?: number;
  other_weekly_deductions?: number;
  
  // Bonus Structure
  safety_bonus_amount?: number;
  performance_bonus_criteria?: string;
  performance_bonus_amount?: number;
  
  // Special Arrangements
  special_arrangements?: string;
  notes?: string;
  
  // Metadata
  setup_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionSection {
  id: string;
  title: string;
  description: string;
  questions: BusinessQuestion[];
}

export interface BusinessQuestion {
  id: keyof BusinessSetup;
  type: 'select' | 'number' | 'text' | 'boolean';
  label: string;
  description?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  dependsOn?: {
    field: keyof BusinessSetup;
    value: any;
  };
  validation?: {
    min?: number;
    max?: number;
    step?: number;
  };
}

// Question sections for the onboarding flow
export const businessSetupSections: QuestionSection[] = [
  {
    id: 'revenue-structure',
    title: 'Revenue & Pay Structure',
    description: 'How you get paid and your arrangement with carriers',
    questions: [
      {
        id: 'pay_structure_type',
        type: 'select',
        label: 'How are you paid?',
        description: 'This affects how we calculate your actual earnings',
        options: [
          { value: 'gross_revenue', label: 'Percentage of gross revenue (including FSC)' },
          { value: 'linehaul_only', label: 'Percentage of linehaul only (FSC separate)' },
          { value: 'percentage_split', label: 'Percentage split with carrier' },
          { value: 'flat_rate', label: 'Flat rate per mile or load' }
        ],
        required: true
      },
      {
        id: 'revenue_split_percentage',
        type: 'number',
        label: 'What percentage do you keep?',
        description: 'Enter the percentage you keep (e.g., 75 for 75%)',
        placeholder: '75',
        required: true,
        validation: { min: 1, max: 100, step: 0.1 }
      },
      {
        id: 'carrier_company_name',
        type: 'text',
        label: 'Carrier/Company Name',
        description: 'Optional: For your records',
        placeholder: 'ABC Trucking LLC'
      }
    ]
  },
  {
    id: 'fuel-costs',
    title: 'Fuel Management',
    description: 'How fuel costs and reimbursements work',
    questions: [
      {
        id: 'fuel_responsibility',
        type: 'select',
        label: 'Who pays for fuel?',
        options: [
          { value: 'driver_pays', label: 'I pay for all fuel' },
          { value: 'carrier_pays', label: 'Carrier pays for fuel' },
          { value: 'reimbursed', label: 'I pay, but get reimbursed' },
          { value: 'split_cost', label: 'We split the cost' }
        ],
        required: true
      },
      {
        id: 'fuel_reimbursement_rate',
        type: 'number',
        label: 'Reimbursement rate',
        description: 'Per gallon amount or percentage',
        placeholder: '0.50',
        dependsOn: { field: 'fuel_responsibility', value: 'reimbursed' },
        validation: { min: 0, step: 0.01 }
      },
      {
        id: 'fuel_card_provided',
        type: 'boolean',
        label: 'Carrier provides fuel card?'
      }
    ]
  },
  {
    id: 'maintenance-insurance',
    title: 'Maintenance & Insurance',
    description: 'Truck maintenance and insurance arrangements',
    questions: [
      {
        id: 'maintenance_coverage',
        type: 'select',
        label: 'Who covers maintenance costs?',
        options: [
          { value: 'driver_full', label: 'I pay for all maintenance' },
          { value: 'carrier_full', label: 'Carrier covers all maintenance' },
          { value: 'split_cost', label: 'We split maintenance costs' },
          { value: 'up_to_amount', label: 'Carrier covers up to a certain amount' }
        ],
        required: true
      },
      {
        id: 'maintenance_deductible',
        type: 'number',
        label: 'Maintenance deductible',
        description: 'Amount you pay before coverage kicks in',
        placeholder: '500',
        dependsOn: { field: 'maintenance_coverage', value: 'up_to_amount' },
        validation: { min: 0, step: 1 }
      },
      {
        id: 'insurance_responsibility',
        type: 'select',
        label: 'Who pays for insurance?',
        options: [
          { value: 'driver_pays', label: 'I pay for insurance' },
          { value: 'carrier_pays', label: 'Carrier pays for insurance' },
          { value: 'deducted_from_pay', label: 'Deducted from my settlements' }
        ],
        required: true
      }
    ]
  },
  {
    id: 'fixed-costs',
    title: 'Fixed Weekly Costs',
    description: 'Regular payments and deductions',
    questions: [
      {
        id: 'weekly_truck_payment',
        type: 'number',
        label: 'Weekly truck payment',
        description: 'Lease or loan payment per week',
        placeholder: '800',
        validation: { min: 0, step: 1 }
      },
      {
        id: 'weekly_insurance_payment',
        type: 'number',
        label: 'Weekly insurance payment',
        placeholder: '200',
        dependsOn: { field: 'insurance_responsibility', value: 'driver_pays' },
        validation: { min: 0, step: 1 }
      },
      {
        id: 'weekly_escrow_payment',
        type: 'number',
        label: 'Weekly escrow/deductions',
        description: 'Other regular deductions from settlements',
        placeholder: '100',
        validation: { min: 0, step: 1 }
      }
    ]
  },
  {
    id: 'trip-compensation',
    title: 'Trip-Related Pay',
    description: 'Deadhead, tolls, and trip-specific compensation',
    questions: [
      {
        id: 'deadhead_compensation_type',
        type: 'select',
        label: 'Deadhead compensation',
        description: 'How you get paid for empty miles',
        options: [
          { value: 'per_mile', label: 'Per mile rate' },
          { value: 'percentage', label: 'Percentage of loaded rate' },
          { value: 'flat_rate', label: 'Flat rate per deadhead trip' },
          { value: 'none', label: 'No deadhead compensation' }
        ],
        required: true
      },
      {
        id: 'deadhead_compensation_rate',
        type: 'number',
        label: 'Deadhead rate',
        description: 'Rate per mile, percentage, or flat amount',
        placeholder: '0.50',
        dependsOn: { field: 'deadhead_compensation_type', value: 'per_mile' },
        validation: { min: 0, step: 0.01 }
      },
      {
        id: 'toll_responsibility',
        type: 'select',
        label: 'Who pays for tolls?',
        options: [
          { value: 'driver_pays', label: 'I pay for tolls' },
          { value: 'carrier_pays', label: 'Carrier pays for tolls' },
          { value: 'reimbursed', label: 'I pay, but get reimbursed' }
        ],
        required: true
      }
    ]
  },
  {
    id: 'additional-pay',
    title: 'Additional Pay & Deductions',
    description: 'FSC, detention, and other compensation',
    questions: [
      {
        id: 'fsc_handling',
        type: 'select',
        label: 'How is fuel surcharge (FSC) handled?',
        options: [
          { value: 'included_in_rpm', label: 'Included in my rate per mile' },
          { value: 'separate_payment', label: 'Paid separately from linehaul' },
          { value: 'split_with_carrier', label: 'Split with carrier' }
        ],
        required: true
      },
      {
        id: 'detention_pay_rate',
        type: 'number',
        label: 'Detention pay rate (per hour)',
        placeholder: '25',
        validation: { min: 0, step: 1 }
      },
      {
        id: 'detention_minimum_hours',
        type: 'number',
        label: 'Minimum hours before detention pay',
        placeholder: '2',
        validation: { min: 0, step: 0.25 }
      },
      {
        id: 'admin_fee_percentage',
        type: 'number',
        label: 'Admin fee percentage',
        description: 'Percentage deducted for administration',
        placeholder: '3',
        validation: { min: 0, max: 20, step: 0.1 }
      }
    ]
  }
];

export const calculateCompletionPercentage = (setup: Partial<BusinessSetup>): number => {
  const allQuestions = businessSetupSections.flatMap(section => section.questions);
  const requiredQuestions = allQuestions.filter(q => q.required && shouldShowQuestion(q, setup));
  const completedQuestions = requiredQuestions.filter(q => {
    const value = setup[q.id];
    return value !== undefined && value !== null && value !== '';
  });
  
  // Debug logging
  console.log('Setup completion calculation:', {
    totalQuestions: allQuestions.length,
    requiredQuestions: requiredQuestions.length,
    completedQuestions: completedQuestions.length,
    requiredQuestionIds: requiredQuestions.map(q => q.id),
    completedQuestionIds: completedQuestions.map(q => q.id),
    missingQuestions: requiredQuestions.filter(q => {
      const value = setup[q.id];
      return value === undefined || value === null || value === '';
    }).map(q => q.id),
    currentSetup: setup
  });
  
  return requiredQuestions.length > 0 ? Math.round((completedQuestions.length / requiredQuestions.length) * 100) : 0;
};

export const shouldShowQuestion = (
  question: BusinessQuestion, 
  setup: Partial<BusinessSetup>
): boolean => {
  if (!question.dependsOn) return true;
  
  const dependentValue = setup[question.dependsOn.field];
  
  // For deadhead compensation rate, show when type is NOT 'none'
  if (question.id === 'deadhead_compensation_rate') {
    return dependentValue !== 'none';
  }
  
  // For fuel reimbursement rate, show when responsibility IS 'reimbursed'
  if (question.id === 'fuel_reimbursement_rate') {
    return dependentValue === 'reimbursed';
  }
  
  // For maintenance deductible, show when coverage IS 'up_to_amount'
  if (question.id === 'maintenance_deductible') {
    return dependentValue === 'up_to_amount';
  }
  
  // For weekly insurance payment, show when responsibility IS 'driver_pays'
  if (question.id === 'weekly_insurance_payment') {
    return dependentValue === 'driver_pays';
  }
  
  // Default: show when the dependent value equals the expected value
  return dependentValue === question.dependsOn.value;
};