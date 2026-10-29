export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  description: string;
  category: "all" | "police" | "medical" | "fire" | "specialized";
  badge: string;
  isPrimary?: boolean;
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: "112",
    name: "National Emergency Unified Helpline",
    number: "112",
    description: "All-in-one emergency response service (Police, Fire, Ambulance, Disaster across India).",
    category: "all",
    badge: "Unified National Emergency",
    isPrimary: true,
  },
  {
    id: "108",
    name: "Emergency Medical & Ambulance Service",
    number: "108",
    description: "Free 24x7 emergency medical transport and trauma stabilization ambulance.",
    category: "medical",
    badge: "Ambulance / Medical",
  },
  {
    id: "100",
    name: "Police Emergency Control",
    number: "100",
    description: "Immediate police dispatch, crime reporting, and public safety assistance.",
    category: "police",
    badge: "Police",
  },
  {
    id: "101",
    name: "Fire Brigade & Rescue Service",
    number: "101",
    description: "Emergency fire fighting, structural collapse rescue, and hazardous material response.",
    category: "fire",
    badge: "Fire & Rescue",
  },
  {
    id: "1091",
    name: "Women's Helpline (Safety & Distress)",
    number: "1091",
    description: "24x7 dedicated emergency assistance and legal protection for women in distress.",
    category: "specialized",
    badge: "Women Safety",
  },
  {
    id: "1077",
    name: "District Disaster Management Cell",
    number: "1077",
    description: "Floods, landslides, severe weather alerts, and urban emergency evacuation support.",
    category: "specialized",
    badge: "Disaster Cell",
  },
];

export interface MedicalFacility {
  id: string;
  name: string;
  type: "Hospital" | "Clinic" | "24x7 Pharmacy" | "Trauma Center";
  address: string;
  area: string;
  phone: string;
  emergencyAvailable: boolean;
  hours: string;
  verified: boolean;
  services: string[];
}

export const VERIFIED_MEDICAL_FACILITIES: MedicalFacility[] = [
  {
    id: "med-01",
    name: "Sancheti Hospital & Trauma Center",
    type: "Trauma Center",
    address: "16, Shivajinagar, Narveer Tanaji Wadi, Pune, Maharashtra 411005",
    area: "Shivajinagar",
    phone: "+91-20-2899-9999",
    emergencyAvailable: true,
    hours: "24 Hours Open",
    verified: true,
    services: ["Emergency Trauma", "ICU", "Ambulance", "Orthopedic Surgery"],
  },
  {
    id: "med-02",
    name: "Deenanath Mangeshkar Hospital & Research Center",
    type: "Hospital",
    address: "Erandwane, Near Mhatre Bridge, Pune, Maharashtra 411004",
    area: "Erandwane",
    phone: "+91-20-4015-1000",
    emergencyAvailable: true,
    hours: "24 Hours Open",
    verified: true,
    services: ["Multi-Specialty Emergency", "Blood Bank", "Pediatric ICU", "24x7 Pharmacy"],
  },
  {
    id: "med-03",
    name: "Apollo Pharmacy 24/7 Store",
    type: "24x7 Pharmacy",
    address: "Shop 4, Ground Floor, Senapati Bapat Road, Shivajinagar, Pune 411016",
    area: "Shivajinagar",
    phone: "+91-20-2565-4422",
    emergencyAvailable: true,
    hours: "24 Hours Open",
    verified: true,
    services: ["Prescription Medicines", "First Aid Supplies", "Home Delivery Support"],
  },
  {
    id: "med-04",
    name: "MedPlus 24 Hours Chemist",
    type: "24x7 Pharmacy",
    address: "Survey No. 128, University Road, Ganeshkhind, Pune 411007",
    area: "University Circle",
    phone: "+91-20-2569-1144",
    emergencyAvailable: true,
    hours: "24 Hours Open",
    verified: true,
    services: ["Generic & Branded Drugs", "Emergency Inhalers & Insulin", "Rapid Delivery Partner"],
  },
  {
    id: "med-05",
    name: "Jehangir Hospital Emergency Ward",
    type: "Hospital",
    address: "32, Sassoon Road, Opposite Pune Railway Station, Pune 411001",
    area: "Station / Camp",
    phone: "+91-20-6681-9999",
    emergencyAvailable: true,
    hours: "24 Hours Open",
    verified: true,
    services: ["Cardiac Emergency", "Stroke Unit", "Trauma", "24x7 Ambulance"],
  },
];

export interface MedicineDeliveryPartner {
  name: string;
  type: string;
  description: string;
  appUrl: string;
  prescriptionRequired: boolean;
  estTime: string;
}

export const MEDICINE_DELIVERY_PARTNERS: MedicineDeliveryPartner[] = [
  {
    name: "Apollo 24|7 Pharmacy",
    type: "Official Pharmacy Chain",
    description: "Licensed pharmaceutical fulfillment with registered pharmacist prescription review.",
    appUrl: "https://www.apollo247.com",
    prescriptionRequired: true,
    estTime: "Under 2 hours for urban zones",
  },
  {
    name: "Tata 1mg",
    type: "Licensed Online Pharmacy",
    description: "Verified genuine medications, e-prescription upload, and cold-chain insulin handling.",
    appUrl: "https://www.1mg.com",
    prescriptionRequired: true,
    estTime: "Same day / Next morning",
  },
  {
    name: "Netmeds",
    type: "Certified Chemist Network",
    description: "Nationwide licensed distribution network with strict batch quality verification.",
    appUrl: "https://www.netmeds.com",
    prescriptionRequired: true,
    estTime: "Express delivery where available",
  },
];
