
export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export interface AppSettings {
  userName: string;
  bloodType: string;
  medications: string;
  allergies: string;
  isOrganDonor: string;
  message: string;
  contacts: EmergencyContact[];
  groupLink?: string;
}

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  error?: string;
}
