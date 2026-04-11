import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function extractYoutubeId(urlOrId: string): string {
  if (!urlOrId) return "";
  // Regular expression to handle various YouTube URL formats
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = urlOrId.match(regExp);
  return (match && match[7].length === 11) ? match[7] : urlOrId;
}
