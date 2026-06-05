import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names handling Tailwind conflicts.
 * Use throughout the app for conditional/composed className values.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
