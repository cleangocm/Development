/**
 * Escape special regex characters in user input to prevent NoSQL injection.
 * Always use this before passing user input to MongoDB $regex queries.
 */
export const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
