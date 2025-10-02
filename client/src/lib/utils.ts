import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFirstName(fullName: string | undefined | null): string {
  if (!fullName) return '';
  return fullName.trim().split(' ')[0];
}
