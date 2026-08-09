import { env } from '../config/env.js';

export async function deliverOtp(identity: string, purpose: string, code: string) {
  if (env.OTP_PROVIDER === 'console') {
    if (env.NODE_ENV !== 'production') console.info(`Development OTP for ${identity} (${purpose}): ${code}`);
    return;
  }
  const response = await fetch(env.OTP_DELIVERY_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(env.OTP_DELIVERY_WEBHOOK_TOKEN ? { authorization: `Bearer ${env.OTP_DELIVERY_WEBHOOK_TOKEN}` } : {}) },
    body: JSON.stringify({ identity, purpose, code, expiresInMinutes: env.OTP_TTL_MINUTES }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`OTP delivery provider returned ${response.status}`);
}
