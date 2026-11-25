export class RequestError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

export function requireValue(value, message, status) {
  if (!value) throw new RequestError(message, status)
  return value
}
