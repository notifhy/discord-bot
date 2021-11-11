export interface AbortError extends Error {
  name: 'AbortError';
  message: string;
}