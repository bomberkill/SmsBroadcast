export interface Contact {
  id: string;
  fullName: string;
  phoneNumber: string;
  createdAt: string;
  email: string;
  gender?: string;
  profession: string;
  country: string;
  region: string;
  healthDistrict?: string;
  city: string;
  status?: string;
  tmsSpecialty?: string;
  otherProfession?: string;
}

export interface Group {
  id: string;
  groupName: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  groupId: string;
  message: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'failed';
  senderId?: string;
}

export type GoogleSheetContact = Omit<Contact, 'id' | 'createdAt'>;