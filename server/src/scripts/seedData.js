/** Sample data for local development and demos. All names and numbers are fictitious. */

// Initial admin, created only if no user exists. Change the password after signing in.
export const DEFAULT_ADMIN = { username: 'admin', password: 'Admin@12345' };

export const CLIENTS = [
  { name: 'Shree Ganesh Diamonds', contactNumber: '9820011223', weight: 5 },
  { name: 'Kiran Gems Workshop', contactNumber: '9867012345', weight: 4 },
  { name: 'Mahalaxmi Diamond Tools', contactNumber: '9321456780', weight: 3 },
  { name: 'Patel Brothers Polishing', contactNumber: '9898123450', weight: 4 },
  { name: 'Sai Krupa Diamonds', contactNumber: '9724501234', weight: 2 },
  { name: 'Jay Ambe Gems', contactNumber: '9909876543', weight: 3 },
  { name: 'Radhe Krishna Exports', contactNumber: '9819988776', weight: 2 },
  { name: 'Navkar Diamond Unit', contactNumber: '9427065432', weight: 3 },
  { name: 'Umiya Polishing Works', contactNumber: '', weight: 1 },
  { name: 'Bhavani Gems & Jewels', contactNumber: '9833445566', weight: 2 },
  { name: 'Om Sai Diamond Factory', contactNumber: '9974112233', weight: 2 },
  { name: 'Vardhman Star Diamonds', contactNumber: '', weight: 1 },
];

// maxQty keeps quantities realistic; typicalRate null = priced manually.
export const DESCRIPTIONS = [
  { name: 'Diamond Polishing Bench (Single Seater)', typicalRate: 18500, maxQty: 2 },
  { name: 'Diamond Polishing Bench (Double Seater)', typicalRate: 32000, maxQty: 2 },
  { name: 'Cast Iron Scaife 12"', typicalRate: 6500, maxQty: 4 },
  { name: 'Cast Iron Scaife 14"', typicalRate: 8200, maxQty: 4 },
  { name: 'Spindle Shaft Assembly', typicalRate: 3400, maxQty: 4 },
  { name: 'Bench Motor 1 HP', typicalRate: 7800, maxQty: 3 },
  { name: 'Tang Holder', typicalRate: 950, maxQty: 10 },
  { name: 'Dop Stick (Set of 10)', typicalRate: 450, maxQty: 10 },
  { name: 'V-Belt A-42', typicalRate: 180, maxQty: 20 },
  { name: 'Bearing Housing', typicalRate: 1250, maxQty: 6 },
  { name: 'Motor Pulley', typicalRate: 600, maxQty: 6 },
  { name: 'Scaife Balancing Service', typicalRate: 1500, maxQty: 4 },
  { name: 'Scaife Re-grooving', typicalRate: 800, maxQty: 6 },
  { name: 'Bench Repairing Charges', typicalRate: null, maxQty: 3 },
  { name: 'Labour Charges', typicalRate: null, maxQty: 1 },
  { name: 'Transport Charges', typicalRate: 500, maxQty: 1 },
];

/** Price range used when a description has no typical rate. */
export const MANUAL_RATE_RANGE = [400, 4500];
