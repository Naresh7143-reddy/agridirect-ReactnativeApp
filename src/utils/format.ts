/**
 * Format a number as Indian Rupee currency.
 */
export const formatPrice = (amount: number, showSymbol = true): string => {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return showSymbol ? formatted : formatted.replace('₹', '').trim();
};

/**
 * Format a date string or Date object to human-readable form.
 */
export const formatDate = (date: string | Date, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { day: '2-digit', month: 'short' }
      : format === 'medium'
      ? { day: '2-digit', month: 'short', year: 'numeric' }
      : { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat('en-IN', options).format(d);
};

/**
 * Format a date as relative time (e.g. "2 hours ago").
 */
export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(d, 'short');
};

/**
 * Format weight with appropriate unit.
 */
export const formatWeight = (value: number, unit: string): string => {
  if (unit === 'kg' && value >= 1000) {
    return `${(value / 1000).toFixed(1)} t`;
  }
  if (unit === 'g' && value >= 1000) {
    return `${(value / 1000).toFixed(2)} kg`;
  }
  return `${value} ${unit}`;
};

/**
 * Format distance in km or m.
 */
export const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

/**
 * Truncate text to a maximum length with ellipsis.
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

/**
 * Capitalize first letter of each word.
 */
export const toTitleCase = (text: string): string =>
  text.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

/**
 * Format phone number for display: +91 XXXXX XXXXX
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};
