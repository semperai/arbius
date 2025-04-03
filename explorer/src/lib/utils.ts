import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateMiddle(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  const prefixLength = Math.ceil(maxLength / 2);
  const suffixLength = Math.floor(maxLength / 2);
  return `${str.slice(0, prefixLength)}...${str.slice(-suffixLength)}`;
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  const prefix = str.slice(0, maxLength / 2);
  const suffix = str.slice(-maxLength / 2);
  return `${prefix}...${suffix}`;
}

export function formatDate(timestamp: number): string {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp * 1000);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}

export function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  
  if (diff < 60) return `${diff} sec ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString();
}
