export function isUnauthorizedError(error: Error | null): boolean {
  return error ? /^401: .*Unauthorized/.test(error.message) : false;
}