import { PayloadRequest } from 'payload'

export const getClientIp = (req: PayloadRequest): string => {
  // 1. Try X-Forwarded-For (Nginx / Load Balancers)
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  // 2. Try X-Real-IP (Nginx)
  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // 3. Try standard Next.js / Node property
  // Next.js often populates req.ip in Middleware or certain runtimes
  const reqIp = (req as any).ip
  if (reqIp) {
    return reqIp
  }

  // 4. Check for standard connection info (Node.js/H3 fallback)
  const socketIp = (req as any).raw?.socket?.remoteAddress || (req as any).raw?.connection?.remoteAddress
  if (socketIp) {
    return socketIp
  }

  // Fallback for local development
  return process.env.NODE_ENV === 'development' ? '127.0.0.1' : 'unknown'
}
