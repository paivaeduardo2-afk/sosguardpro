
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
  isOrganDonor: string; // "Sim", "Não" ou ""
  message: string;
  contacts: EmergencyContact[];
}

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  error?: string;
}
