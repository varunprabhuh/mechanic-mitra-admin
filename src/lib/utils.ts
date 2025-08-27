
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Member } from './types';
import { parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMemberStatus(member: Member): 'Active' | 'Expired' | 'Not Issued' | 'Inactive' {
  if (member.status === 'inactive') {
    return 'Inactive';
  }
  
  if (!member.certificate) {
    // If status is active, they are active, just without a cert.
    // If status is missing (older data), we can call it 'Not Issued'
    return member.status === 'active' ? 'Active' : 'Not Issued';
  }

  if (new Date() > parseISO(member.certificate.expiryDate)) {
    return 'Expired';
  }

  return 'Active';
}
