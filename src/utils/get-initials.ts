export const getInitials = (name: string): string => {
  const words = name
    .trim()
    .replace(/[^\p{L}\s]+/gu, '')
    .split(/\s+/);

  if (words.length === 0) return '';

  let initials = words[0].charAt(0).toUpperCase();

  if (words.length > 1) {
    initials += words[1].charAt(0).toUpperCase();
  }

  if (words.length > 2) {
    initials += words[2].charAt(0).toUpperCase();
  }

  return initials;
};
