
import { z } from 'zod';

export type Member = {
  id: string;
  name: string;
  mobile: string;
  address: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  garageName: string;
  photoUrl: string;
  email: string;
  certificate: {
    issuedDate: string; // ISO Date String
    expiryDate: string; // ISO Date String
    id: string;
  } | null;
  documents?: {
    aadhar?: string; // URL
    dl?: string; // URL
    pan?: string; // URL
    ration?: string; // URL
  };
  tags: string[];
  status?: 'active' | 'inactive';
  aadharNumber?: string;
  drivingLicenseNumber?: string;
  dob?: string; // ISO Date string
};

export type UpdateRequest = {
  id: string;
  memberId: string;
  memberName: string;
  memberPhotoUrl?: string;
  field: keyof Member | string;
  oldValue: string;
  newValue: string;
  requestDate: string; // ISO Date String
  status: 'Pending';
};

export type Notification = {
  id: string;
  memberId: string;
  message: string;
  type: 'request_approved' | 'request_rejected' | 'certificate_reminder' | 'broadcast';
  createdAt: string; // ISO Date String
  isRead: boolean;
  relatedId?: string; // e.g., request.id
};


export type AdminProfile = {
  uid: string;
  name:string;
  photoUrl: string;
  phone?: string;
  address?: string;
}

export type PositionableElement = 'photo' | 'name' | 'garage' | 'address' | 'meta' | 'issuedDate' | 'expiryDate';

export type ElementPosition = {
  top: number;
  left: number;
  lineSpacing?: number;
};

export type CertificateLayout = Record<PositionableElement, ElementPosition>;

export type IdCardPositionableElement = 'photo' | 'name' | 'shopName' | 'detailsLine1' | 'detailsLine2' | 'dlNumber' | 'detailsLine4' | 'dob' | 'address';

export type IdCardElementPosition = {
  top: number;
  left: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  textTransform?: 'none' | 'uppercase';
  backgroundColor?: string;
};


export type IdCardLayout = Record<IdCardPositionableElement, IdCardElementPosition>;
