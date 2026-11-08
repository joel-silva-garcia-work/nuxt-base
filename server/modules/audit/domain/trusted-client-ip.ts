import { isIP } from 'node:net'

const trustedClientIpBrand: unique symbol = Symbol('TrustedClientIp')

export type TrustedClientIp = string & {
  readonly [trustedClientIpBrand]: true
}

function normalizeIpAddress(value: string): string | null {
  const address = value.trim()
  return isIP(address) === 0 ? null : address.toLowerCase()
}

export function resolveTrustedClientIpAddress(
  remoteAddress: string | null,
  forwardedFor: string | null | undefined,
  trustedProxyAddresses: ReadonlySet<string> = new Set(),
): TrustedClientIp | null {
  if (remoteAddress === null) {
    return null
  }

  const peerAddress = normalizeIpAddress(remoteAddress)
  if (peerAddress === null) {
    return null
  }

  const trustedProxies = new Set<string>()
  for (const address of trustedProxyAddresses) {
    const normalizedAddress = normalizeIpAddress(address)
    if (normalizedAddress === null) {
      throw new TypeError('Trusted proxy addresses must be valid IP addresses')
    }
    trustedProxies.add(normalizedAddress)
  }

  if (!trustedProxies.has(peerAddress) || !forwardedFor) {
    return peerAddress as TrustedClientIp
  }

  const parsedForwardedAddresses = forwardedFor.split(',').map(normalizeIpAddress)
  if (
    parsedForwardedAddresses.length > 16
    || parsedForwardedAddresses.some(address => address === null)
  ) {
    return peerAddress as TrustedClientIp
  }

  const forwardedAddresses = parsedForwardedAddresses.filter(
    (address): address is string => address !== null,
  )
  const chain = [...forwardedAddresses, peerAddress]
  for (let index = chain.length - 1; index >= 0; index -= 1) {
    const address = chain[index]
    if (address !== undefined && !trustedProxies.has(address)) {
      return address as TrustedClientIp
    }
  }

  return peerAddress as TrustedClientIp
}
