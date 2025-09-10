# LoadMaster GPT - Business Setup Configuration Guide

**Version:** 2.0  
**Last Updated:** January 2024  
**Target Audience:** New Users, Business Consultants, Fleet Managers

## Table of Contents
1. [Business Setup Overview](#business-setup-overview)
2. [Equipment Profiles](#equipment-profiles)
3. [Revenue Models](#revenue-models)
4. [Cost Structure Configuration](#cost-structure-configuration)
5. [Surcharge Configuration](#surcharge-configuration)
6. [RPM Thresholds](#rpm-thresholds)
7. [Setup Templates](#setup-templates)
8. [Validation & Best Practices](#validation-best-practices)
9. [Advanced Configuration](#advanced-configuration)

---

## Business Setup Overview

### Purpose of Business Setup
The Business Setup wizard configures LoadMaster GPT to match your specific trucking operation. This ensures accurate profit calculations, realistic RPM thresholds, and meaningful performance analytics tailored to your business model.

### Required vs Optional Information
**Required for Basic Functionality:**
- Equipment Type (Cargo Van, Straight Truck, Hotshot)
- Revenue Structure (how you get paid)
- Fuel Price and Vehicle MPG
- Basic RPM thresholds

**Optional for Enhanced Features:**
- Detailed cost breakdown
- Surcharge rates and policies
- Advanced negotiation preferences
- Equipment-specific configurations

### Setup Process Flow
1. **Equipment Selection:** Choose your primary equipment type
2. **Revenue Structure:** Define how you're compensated
3. **Cost Configuration:** Set up fixed and variable costs
4. **Operational Preferences:** Configure deadhead, surcharges, etc.
5. **Performance Thresholds:** Set RPM and profitability targets
6. **Validation:** Review and confirm all settings

---

## Equipment Profiles

### Cargo Van Configuration

**Typical Specifications:**
- **Payload Capacity:** 2,000 - 2,500 lbs
- **Cargo Dimensions:** 9-10 feet length, 4-5 feet height
- **GVWR Range:** 9,500 - 10,000 lbs
- **Fuel Efficiency:** 12-18 MPG (varies by model and load)

**Common Operating Characteristics:**
- **Target RPM Range:** $1.50 - $3.00 per mile
- **Average Load Weight:** 500 - 1,500 lbs
- **Typical Haul Distance:** 100 - 800 miles
- **Delivery Types:** Expedited freight, small parcels, time-sensitive

**Recommended Settings:**
```
Fuel Efficiency: 15 MPG (conservative estimate)
Good RPM Threshold: $2.00/mile
Fair RPM Threshold: $1.50/mile
Weight Threshold: 2,000 lbs (heavy load indicator)
Deadhead Tolerance: 20% of loaded miles
```

**Common Surcharges:**
- **Residential Delivery:** $25 - $75
- **Inside Delivery:** $50 - $150  
- **Appointment Delivery:** $25 - $50
- **Weekend/Holiday:** 10-25% premium
- **After Hours:** $50 - $100

### Straight Truck Configuration

**Typical Specifications:**
- **Payload Capacity:** 10,000 - 26,000 lbs
- **Cargo Dimensions:** 16-26 feet length, 8+ feet height
- **GVWR Range:** 26,001 lbs and under (no CDL) or over 26,001 (CDL required)
- **Fuel Efficiency:** 8-12 MPG (varies significantly by load)

**Common Operating Characteristics:**
- **Target RPM Range:** $2.00 - $4.00 per mile
- **Average Load Weight:** 5,000 - 20,000 lbs
- **Typical Haul Distance:** 200 - 1,200 miles
- **Delivery Types:** LTL freight, dock-to-dock, warehousing

**Recommended Settings:**
```
Fuel Efficiency: 10 MPG (loaded average)
Good RPM Threshold: $2.50/mile
Fair RPM Threshold: $2.00/mile
Weight Threshold: 20,000 lbs (heavy load indicator)
Deadhead Tolerance: 15% of loaded miles
```

**Common Surcharges:**
- **Liftgate Service:** $75 - $150
- **Inside Delivery:** $100 - $300
- **Residential Delivery:** $50 - $150
- **Detention (after 2 hours):** $25 - $50/hour
- **Layover:** $100 - $200/day

### Hotshot Configuration

**Typical Specifications:**
- **Payload Capacity:** 15,000 - 26,000 lbs (truck + trailer)
- **Equipment:** Pickup truck + gooseneck or bumper-pull trailer
- **GVWR Range:** Varies by truck/trailer combination
- **Fuel Efficiency:** 10-15 MPG (varies greatly by load and terrain)

**Common Operating Characteristics:**
- **Target RPM Range:** $2.50 - $5.00 per mile
- **Average Load Weight:** 5,000 - 20,000 lbs
- **Typical Haul Distance:** 300 - 1,500 miles
- **Delivery Types:** Oilfield equipment, construction materials, expedited

**Recommended Settings:**
```
Fuel Efficiency: 12 MPG (mixed driving)
Good RPM Threshold: $3.00/mile
Fair RPM Threshold: $2.25/mile
Weight Threshold: 20,000 lbs (heavy load indicator)
Deadhead Tolerance: 25% of loaded miles
```

**Common Surcharges:**
- **Tarping:** $100 - $300
- **Weekend Delivery:** 15-25% premium
- **Expedited Service:** 20-50% premium
- **Hazmat:** $200 - $500 premium
- **Oversize/Overweight:** Varies by permit requirements

---

## Revenue Models

### Percentage Split Models

**70/30 Split (Driver/Company):**
- **Driver Keeps:** 70% of gross revenue
- **Company Provides:** Truck, insurance, permits, maintenance
- **Driver Responsibilities:** Fuel, personal expenses, some maintenance
- **Best For:** Experienced drivers with established relationships

**80/20 Split:**
- **Driver Keeps:** 80% of gross revenue  
- **Company Provides:** Truck, major maintenance, insurance
- **Driver Responsibilities:** Fuel, minor maintenance, personal expenses
- **Best For:** Experienced drivers seeking higher earnings

**90/10 Split:**
- **Driver Keeps:** 90% of gross revenue
- **Company Provides:** Minimal support, mainly dispatch and authority
- **Driver Responsibilities:** Most operating expenses
- **Best For:** Highly experienced drivers with strong business sense

**Configuration Example:**
```
Revenue Split: 80% (driver keeps 80%)
Fixed Weekly Costs: $800 (truck payment, insurance, etc.)
Variable Costs: Fuel (calculated per load)
Deadhead Compensation: Company pays 80% of deadhead miles
```

### Gross Revenue Models

**100% to Driver (Owner-Operator):**
- **Driver Keeps:** All revenue minus operating costs
- **Equipment:** Driver owns truck and equipment
- **Responsibilities:** All costs and maintenance
- **Best For:** Independent contractors with own equipment

**Fuel Card Programs:**
- **Driver Keeps:** Variable percentage after fuel costs
- **Company Provides:** Fuel card and discounted fuel
- **Split Calculation:** Gross revenue minus fuel costs, then split
- **Best For:** High-mileage operations with fuel cost volatility

**Configuration Example:**
```
Revenue Split: 100% (owner-operator)
Fixed Weekly Costs: $1,200 (all operating expenses)
Fuel Responsibility: Driver pays directly
Deadhead Policy: Driver absorbs all deadhead costs
```

### Fixed Fee Models

**Weekly Fixed Fee:**
- **Driver Pays:** Fixed amount per week to company
- **Driver Keeps:** All revenue above fixed fee
- **Risk Profile:** Higher potential earnings, higher risk
- **Best For:** Consistent high-volume drivers

**Monthly Equipment Lease:**
- **Driver Pays:** Monthly lease payment for equipment
- **Revenue Handling:** Driver manages all revenue and expenses
- **Support Level:** Minimal company involvement
- **Best For:** Experienced drivers seeking independence

---

## Cost Structure Configuration

### Fixed Weekly Costs

**Truck Payment/Lease:**
- **Typical Range:** $400 - $800 per week
- **Includes:** Principal, interest, gap insurance
- **Calculation:** Monthly payment ÷ 4.33 weeks/month
- **Note:** Include balloon payment reserves if applicable

**Commercial Insurance:**
- **Liability Coverage:** $100 - $200 per week
- **Cargo Insurance:** $50 - $100 per week  
- **Physical Damage:** $100 - $300 per week
- **Total Typical:** $250 - $600 per week

**Permits and Licenses:**
- **IFTA/IRP Registration:** $20 - $40 per week
- **Operating Authority:** $10 - $25 per week
- **State Permits:** $10 - $30 per week
- **Total Typical:** $40 - $95 per week

**Equipment and Communication:**
- **ELD/GPS Systems:** $20 - $40 per week
- **Mobile/Internet:** $15 - $30 per week
- **Load Board Subscriptions:** $20 - $50 per week
- **Total Typical:** $55 - $120 per week

**Maintenance Reserve:**
- **Preventive Maintenance:** $100 - $200 per week
- **Emergency Repairs:** $100 - $300 per week
- **Tire Replacement:** $50 - $100 per week
- **Total Typical:** $250 - $600 per week

### Variable Cost Configuration

**Fuel Cost Calculation:**
```
Fuel Cost = (Miles ÷ MPG) × Fuel Price per Gallon

Example:
500 miles ÷ 10 MPG × $3.50/gallon = $175 fuel cost
```

**Deadhead Compensation Options:**

**1. Varies by Load:**
- Each load negotiated separately
- Compensation ranges from $0.50 - $2.00/mile
- Best for: Experienced negotiators

**2. Negotiated Per Load:**
- Standard rate applied to all deadhead miles
- Typical range: $1.00 - $1.50/mile
- Best for: Consistent operations

**3. Tiered by Distance:**
- 0-50 miles: No compensation
- 51-100 miles: $1.00/mile
- 101+ miles: $1.50/mile
- Best for: Regional operations

**4. Customer Dependent:**
- Regular customers: Full deadhead pay
- Spot market: Partial or no deadhead pay
- Best for: Mixed customer base

**5. Minimum Plus Variable:**
- Base minimum: $100
- Plus: $1.25/mile over 50 miles
- Best for: Long-distance operations

### Cost Calculation Examples

**Example 1: Straight Truck, 80/20 Split**
```
Weekly Fixed Costs: $1,000
- Truck payment: $600
- Insurance: $250  
- Permits/licenses: $75
- Maintenance reserve: $275

Per-Mile Fixed Cost: $1,000 ÷ 2,500 miles/week = $0.40/mile

Load Analysis:
Gross Rate: $2,000
Miles: 500
Gross RPM: $4.00/mile
Driver Share (80%): $1,600
Fixed Costs: $200 (500 miles × $0.40)
Fuel Cost: $175 (500 miles ÷ 10 MPG × $3.50)
Net Profit: $1,225
Net RPM: $2.45/mile
```

---

## Surcharge Configuration

### Standard Surcharge Types

**Detention Pay:**
- **Free Time:** First 2-3 hours typically free
- **Hourly Rate:** $25 - $75/hour after free time
- **Maximum:** Daily cap of $200 - $400
- **Documentation:** BOL timestamps required

**Layover Pay:**
- **Triggers:** Delays over 24 hours, weekend holds
- **Daily Rate:** $100 - $250/day
- **Conditions:** Must be shipper/receiver caused
- **Documentation:** Written authorization required

**Accessorial Services:**

**Inside Delivery:**
- **Definition:** Delivery beyond dock door
- **Rate Range:** $50 - $300 depending on complexity
- **Factors:** Weight, distance, stairs, elevators
- **Equipment:** May require special equipment

**Liftgate Service:**
- **Standard Rate:** $75 - $150 per use
- **Factors:** Weight of freight, accessibility
- **Equipment:** Hydraulic or electric liftgate required
- **Time Factor:** Adds 30-60 minutes to delivery

**Residential Delivery:**
- **Standard Rate:** $25 - $150
- **Factors:** Neighborhood accessibility, parking
- **Restrictions:** Size limits, time windows
- **Documentation:** Signature required

### Equipment-Specific Surcharges

**Cargo Van Surcharges:**
- **White Glove Service:** $100 - $500
- **Temperature Controlled:** 15-25% premium
- **Exclusive Use:** 10-20% premium
- **Expedited Service:** 25-50% premium

**Straight Truck Surcharges:**
- **Liftgate Required:** $75 - $150
- **Dock High Required:** May command premium rates
- **Team Driver Service:** 40-60% premium
- **Hazmat Handling:** $200 - $500 premium

**Hotshot Surcharges:**
- **Tarping/Securement:** $100 - $300
- **Oversize/Overweight:** Permit costs + 20-50% premium
- **Oilfield Locations:** $200 - $500 premium
- **Expedited Critical:** 50-100% premium

### Surcharge Negotiation Guidelines

**When to Apply Surcharges:**
- Services not included in standard rate
- Additional risk or liability
- Specialized equipment required
- Time-sensitive or after-hours service

**Documentation Requirements:**
- Clear agreement before service
- Written authorization for detention/layover
- Photo documentation when applicable
- Signed delivery receipts with timestamps

**Collection Best Practices:**
- Include surcharges in rate confirmation
- Document services provided with photos/timestamps
- Submit invoices promptly with supporting documentation
- Follow up on unpaid surcharges within 30 days

---

## RPM Thresholds

### Industry Benchmarks by Equipment Type

**Cargo Van Thresholds:**
```
Excellent: $2.50+/mile (top 10% of loads)
Good: $2.00 - $2.49/mile (profitable operations)  
Fair: $1.50 - $1.99/mile (break-even to modest profit)
Poor: Below $1.50/mile (potential loss or minimal profit)
```

**Straight Truck Thresholds:**
```
Excellent: $3.00+/mile (top 10% of loads)
Good: $2.50 - $2.99/mile (profitable operations)
Fair: $2.00 - $2.49/mile (break-even to modest profit)
Poor: Below $2.00/mile (potential loss or minimal profit)
```

**Hotshot Thresholds:**
```
Excellent: $4.00+/mile (top 10% of loads)
Good: $3.00 - $3.99/mile (profitable operations)
Fair: $2.25 - $2.99/mile (break-even to modest profit)  
Poor: Below $2.25/mile (potential loss or minimal profit)
```

### Regional Variations

**High-Rate Markets:**
- California to/from anywhere
- Northeast Corridor
- Oil field regions (Texas, North Dakota)
- Seasonal agricultural areas

**Standard Rate Markets:**
- Midwest manufacturing regions  
- Southeast distribution hubs
- Major metropolitan areas
- Established freight corridors

**Lower Rate Markets:**
- Rural agricultural areas (off-season)
- Oversupplied markets
- Backhaul lanes
- Low-value commodity freight

### Seasonal Adjustments

**Peak Season (Higher Thresholds):**
- **Q4 Holiday Season:** October - December
- **Summer Construction:** May - September  
- **Agricultural Harvest:** Varies by region and crop
- **Adjustment:** Increase thresholds by 10-20%

**Slow Season (Lower Thresholds):**
- **Post-Holiday:** January - February
- **Spring Transition:** March - April
- **Agricultural Off-Season:** Varies by region
- **Adjustment:** Decrease thresholds by 10-15%

---

## Setup Templates

### Template Categories

**Owner-Operator Templates:**

**1. Independent Cargo Van:**
```
Equipment: Cargo Van
Revenue Split: 100% (owner-operator)
Weekly Fixed Costs: $600
- Insurance: $200
- Vehicle Payment: $300
- Maintenance Reserve: $100
Fuel Efficiency: 15 MPG
RPM Thresholds: Excellent $2.50+, Good $2.00, Fair $1.50
Deadhead Policy: Driver absorbs all costs
```

**2. Independent Straight Truck:**
```
Equipment: Straight Truck  
Revenue Split: 100% (owner-operator)
Weekly Fixed Costs: $1,200
- Insurance: $350
- Vehicle Payment: $600
- Maintenance Reserve: $250
Fuel Efficiency: 10 MPG
RPM Thresholds: Excellent $3.00+, Good $2.50, Fair $2.00
Deadhead Policy: Driver absorbs all costs
```

**Fleet Driver Templates:**

**3. 80/20 Split Cargo Van:**
```
Equipment: Cargo Van
Revenue Split: 80% (driver keeps)
Weekly Fixed Costs: $400
- Truck allocation: $300
- Insurance allocation: $100
Fuel Efficiency: 15 MPG
RPM Thresholds: Excellent $2.00+, Good $1.60, Fair $1.20
Deadhead Policy: Company pays 80%
```

**4. 70/30 Split Straight Truck:**
```
Equipment: Straight Truck
Revenue Split: 70% (driver keeps)  
Weekly Fixed Costs: $700
- Truck allocation: $500
- Insurance allocation: $200
Fuel Efficiency: 10 MPG
RPM Thresholds: Excellent $2.10+, Good $1.75, Fair $1.40
Deadhead Policy: Company pays 70%
```

**Specialized Operation Templates:**

**5. Hotshot Oil Field:**
```
Equipment: Hotshot
Revenue Split: 100% (owner-operator)
Weekly Fixed Costs: $1,500
- Insurance: $400
- Vehicle/Trailer Payment: $800
- Maintenance Reserve: $300
Fuel Efficiency: 12 MPG
RPM Thresholds: Excellent $4.50+, Good $3.75, Fair $3.00
Surcharges: Tarping $250, Remote location $300
```

### Custom Template Creation

**Template Configuration Process:**
1. **Base Equipment:** Select primary equipment type
2. **Revenue Model:** Choose split percentage or fixed fee
3. **Cost Structure:** Input actual weekly fixed costs
4. **Operating Parameters:** Set fuel efficiency, deadhead policy
5. **Performance Targets:** Establish RPM thresholds
6. **Surcharge Rates:** Configure common accessorial charges
7. **Save Template:** Name and save for future use

**Template Validation:**
- Verify total costs don't exceed typical industry ranges
- Ensure RPM thresholds align with market conditions
- Confirm surcharge rates match regional standards
- Test calculations with sample loads

---

## Validation & Best Practices

### Setup Validation Rules

**Revenue Split Validation:**
- Split percentages must total 100%
- Driver percentage cannot be less than 60% (industry minimum)
- Company percentage should reflect services provided
- Validate against industry standards for equipment type

**Cost Structure Validation:**
- Fixed costs should be 40-60% of typical weekly revenue
- Individual cost categories within reasonable ranges
- Total costs leave adequate profit margin
- Maintenance reserves sufficient for equipment type

**RPM Threshold Validation:**
- Thresholds appropriate for equipment type and region
- Good threshold covers fixed costs plus reasonable profit
- Fair threshold covers minimum operating costs
- Excellent threshold reflects top market opportunities

### Common Setup Mistakes

**Underestimating Fixed Costs:**
- **Problem:** Not including all weekly expenses
- **Solution:** Use comprehensive cost checklist
- **Impact:** Overestimating profitability of loads

**Unrealistic RPM Thresholds:**
- **Problem:** Setting thresholds too high for market
- **Solution:** Research regional rate averages
- **Impact:** Rejecting profitable opportunities

**Ignoring Equipment-Specific Costs:**
- **Problem:** Using generic cost assumptions
- **Solution:** Account for equipment-specific expenses
- **Impact:** Inaccurate profit calculations

**Not Accounting for Seasonal Variations:**
- **Problem:** Using same thresholds year-round
- **Solution:** Adjust thresholds for market conditions
- **Impact:** Missing opportunities or accepting poor loads

### Industry Best Practices

**Regular Setup Review:**
- **Frequency:** Monthly or quarterly
- **Triggers:** Fuel price changes, insurance renewals
- **Adjustments:** Costs, thresholds, market conditions
- **Documentation:** Track changes and reasons

**Market Research:**
- **Rate Monitoring:** Track average rates for your lanes
- **Competitor Analysis:** Understand market positioning
- **Customer Feedback:** Adjust services based on needs
- **Industry Reports:** Stay informed on market trends

**Performance Monitoring:**
- **Weekly Reviews:** Analyze actual vs projected performance
- **Trend Analysis:** Identify patterns in profitability
- **Cost Tracking:** Monitor actual costs vs budgeted
- **Threshold Effectiveness:** Adjust based on results

---

## Advanced Configuration

### Multi-Equipment Operations

**Mixed Fleet Setup:**
- Configure separate profiles for each equipment type
- Set equipment-specific thresholds and costs
- Track performance by equipment category
- Optimize load selection by equipment availability

**Equipment Rotation Strategy:**
- Seasonal equipment adjustments
- Market-driven equipment selection  
- Cost optimization through equipment mix
- Performance tracking by equipment utilization

### Dynamic Pricing Models

**Market-Responsive Thresholds:**
- Automatic adjustments based on market conditions
- Integration with load board pricing data
- Seasonal threshold modifications
- Regional rate variations

**Customer-Specific Pricing:**
- Dedicated customer rate structures
- Volume-based pricing tiers
- Relationship-based rate premiums
- Service level differentiation

### Advanced Cost Management

**Activity-Based Costing:**
- Allocate costs by specific activities
- Track cost per mile by lane
- Identify unprofitable activities
- Optimize resource allocation

**Variance Analysis:**
- Compare actual vs budgeted costs
- Identify cost trend patterns
- Implement corrective actions
- Monitor cost control effectiveness

### Integration Considerations

**Load Board Integration:**
- Automatic rate comparison with thresholds
- Filter loads based on profitability criteria
- Real-time market rate updates
- Performance tracking by load board source

**Accounting System Integration:**
- Export setup data to accounting software
- Synchronize cost categories
- Automate profitability reporting
- Streamline tax preparation

---

## Appendices

### A. Cost Category Definitions
Detailed explanations of each cost category with industry-standard ranges and calculation methods.

### B. Regional Rate Guidelines  
Market-specific RPM ranges and adjustment factors by geographic region and equipment type.

### C. Seasonal Adjustment Factors
Historical rate multipliers for seasonal market variations by equipment type and region.

### D. Validation Checklists
Step-by-step checklists to ensure accurate and complete business setup configuration.

---

*This business setup guide provides comprehensive configuration guidance for LoadMaster GPT. Regular review and updates ensure continued accuracy and effectiveness of your setup.*