// Synthetic but realistic seed dataset for fraud detection training.
// Each row: { description, claim_amount, policy_age_months, claim_type, label (1=fraud, 0=genuine) }

export type ClaimRow = {
  description: string;
  claim_amount: number;
  policy_age_months: number;
  claim_type: string;
  label: 0 | 1;
};

const fraudTemplates: ClaimRow[] = [
  { description: "My car was completely destroyed in a single vehicle accident at night with no witnesses. The whole engine and interior need full replacement immediately.", claim_amount: 48000, policy_age_months: 1, claim_type: "auto", label: 1 },
  { description: "Total loss after a fire in the garage destroyed everything. I just renewed coverage last week and need maximum payout urgently.", claim_amount: 75000, policy_age_months: 1, claim_type: "property", label: 1 },
  { description: "Stolen vehicle, never recovered. No witnesses. Filed report. Need full replacement value as soon as possible.", claim_amount: 35000, policy_age_months: 2, claim_type: "auto", label: 1 },
  { description: "Severe back injury that prevents me from working. No medical records yet but pain is constant. Need immediate cash settlement.", claim_amount: 92000, policy_age_months: 1, claim_type: "health", label: 1 },
  { description: "House completely flooded, all furniture electronics jewelry destroyed. No receipts available but everything was very expensive.", claim_amount: 120000, policy_age_months: 2, claim_type: "property", label: 1 },
  { description: "Burglary stole all my valuables including cash watches laptops. Door was unlocked but nothing forced. Need quick payout.", claim_amount: 28000, policy_age_months: 3, claim_type: "property", label: 1 },
  { description: "Whiplash and chronic pain after minor parking lot bump. Cannot work for months. Demanding maximum settlement.", claim_amount: 45000, policy_age_months: 2, claim_type: "auto", label: 1 },
  { description: "Lost expensive jewelry on vacation. No police report possible in foreign country. Need full reimbursement urgently.", claim_amount: 22000, policy_age_months: 1, claim_type: "property", label: 1 },
  { description: "Vehicle caught fire spontaneously while parked overnight. Total loss. Recently increased coverage. Want quick settlement.", claim_amount: 52000, policy_age_months: 2, claim_type: "auto", label: 1 },
  { description: "Severe injury in slip and fall. No witnesses. Pain prevents working. Need lump sum payment without medical evaluation.", claim_amount: 67000, policy_age_months: 1, claim_type: "health", label: 1 },
  { description: "Roof collapsed during light rain destroying all upstairs contents. No prior inspection records. Maximum payout needed.", claim_amount: 88000, policy_age_months: 2, claim_type: "property", label: 1 },
  { description: "Car stolen from driveway, no security camera footage, keys still in my possession but somehow taken. Need immediate replacement.", claim_amount: 41000, policy_age_months: 3, claim_type: "auto", label: 1 },
  { description: "All electronics destroyed by power surge but no surge protector evidence remains. Need full replacement of premium items.", claim_amount: 18000, policy_age_months: 1, claim_type: "property", label: 1 },
  { description: "Disability following unwitnessed home accident. Cannot return to work indefinitely. Demanding lifetime settlement now.", claim_amount: 110000, policy_age_months: 2, claim_type: "health", label: 1 },
  { description: "Complete vehicle loss in remote area, towed and scrapped before adjuster could inspect. Want maximum payout fast.", claim_amount: 39000, policy_age_months: 2, claim_type: "auto", label: 1 },
  { description: "House fire destroyed everything including all documentation receipts and photos. Need maximum coverage immediately.", claim_amount: 145000, policy_age_months: 3, claim_type: "property", label: 1 },
  { description: "Severe injury but refusing independent medical exam. Demanding cash settlement based on my own statement only.", claim_amount: 58000, policy_age_months: 2, claim_type: "health", label: 1 },
  { description: "Multiple expensive items stolen but no signs of break in. List provided from memory. Urgent full reimbursement requested.", claim_amount: 31000, policy_age_months: 1, claim_type: "property", label: 1 },
  { description: "Engine completely destroyed by sudden unknown mechanical failure. Want full vehicle replacement instead of repair.", claim_amount: 27000, policy_age_months: 2, claim_type: "auto", label: 1 },
  { description: "Permanent disability from unverified workplace incident. No medical history. Need immediate lifetime payout.", claim_amount: 130000, policy_age_months: 1, claim_type: "health", label: 1 },
];

const genuineTemplates: ClaimRow[] = [
  { description: "Rear ended at a red light by another driver. Police report filed and other driver admitted fault. Bumper and tail light damaged.", claim_amount: 3200, policy_age_months: 36, claim_type: "auto", label: 0 },
  { description: "Storm damaged shingles on the north side of the roof. Contractor estimate attached along with photos before and after.", claim_amount: 4800, policy_age_months: 48, claim_type: "property", label: 0 },
  { description: "Broken arm from cycling accident. Hospital records and X-rays attached. Need coverage for surgery and physical therapy.", claim_amount: 6500, policy_age_months: 60, claim_type: "health", label: 0 },
  { description: "Tree branch fell on parked car during storm. Witnesses and weather report available. Windshield and hood need repair.", claim_amount: 2100, policy_age_months: 24, claim_type: "auto", label: 0 },
  { description: "Kitchen pipe burst causing water damage to floor and lower cabinets. Plumber report and photos included with estimate.", claim_amount: 5400, policy_age_months: 72, claim_type: "property", label: 0 },
  { description: "Routine appendectomy after emergency room visit. Hospital itemized bill and discharge summary attached.", claim_amount: 9200, policy_age_months: 84, claim_type: "health", label: 0 },
  { description: "Side mirror replacement after parking incident in lot. Filed minor report with property management. Photos attached.", claim_amount: 380, policy_age_months: 18, claim_type: "auto", label: 0 },
  { description: "Hail damage to roof confirmed by adjuster. Multiple neighbors filed similar claims. Repair estimate from licensed contractor.", claim_amount: 7200, policy_age_months: 96, claim_type: "property", label: 0 },
  { description: "Annual physical revealed condition requiring scheduled outpatient procedure. Doctor referral and pre authorization on file.", claim_amount: 4100, policy_age_months: 48, claim_type: "health", label: 0 },
  { description: "Minor fender bender in slow traffic. Both drivers exchanged information. Other party at fault. Body shop estimate attached.", claim_amount: 1800, policy_age_months: 30, claim_type: "auto", label: 0 },
  { description: "Garage door motor failed after eight years of normal use. Replacement quote from authorized dealer attached.", claim_amount: 850, policy_age_months: 60, claim_type: "property", label: 0 },
  { description: "Knee replacement surgery scheduled by orthopedic surgeon after years of documented arthritis. All records on file.", claim_amount: 24000, policy_age_months: 120, claim_type: "health", label: 0 },
  { description: "Windshield cracked by road debris on highway. Replacement done at certified glass shop with itemized invoice.", claim_amount: 420, policy_age_months: 24, claim_type: "auto", label: 0 },
  { description: "Sliding glass door damaged during normal use, hinge wore out. Quote from authorized installer attached for review.", claim_amount: 1200, policy_age_months: 84, claim_type: "property", label: 0 },
  { description: "Child fractured wrist at school playground. Pediatrician visit and cast follow up appointments documented.", claim_amount: 1900, policy_age_months: 36, claim_type: "health", label: 0 },
  { description: "Battery and alternator replaced after vehicle would not start. Service records from dealership attached for warranty.", claim_amount: 680, policy_age_months: 24, claim_type: "auto", label: 0 },
  { description: "Refrigerator failed under extended warranty period. Repair technician confirmed compressor failure with diagnostic report.", claim_amount: 720, policy_age_months: 48, claim_type: "property", label: 0 },
  { description: "Dental crown replacement after root canal completed by family dentist. Pre and post procedure documentation on file.", claim_amount: 1400, policy_age_months: 60, claim_type: "health", label: 0 },
  { description: "Driver door handle broken during normal use. Authorized service center provided estimate and parts availability.", claim_amount: 290, policy_age_months: 36, claim_type: "auto", label: 0 },
  { description: "Carpet damage from leaking dishwasher. Plumber and restoration company quotes attached with detailed scope of work.", claim_amount: 2600, policy_age_months: 48, claim_type: "property", label: 0 },
];

export const SEED_DATASET: ClaimRow[] = [...fraudTemplates, ...genuineTemplates];
