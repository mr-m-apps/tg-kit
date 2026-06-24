import type { RuntimeMode, TgUser } from '../types/webapp';

type NodeCrypto = typeof import('node:crypto');
let _nodeCryptoPromise: Promise<NodeCrypto> | null = null;
async function getNodeCrypto(): Promise<NodeCrypto> {
  if (!_nodeCryptoPromise) {
    _nodeCryptoPromise = import('node:crypto');
  }
  return _nodeCryptoPromise;
}

function getNodeCryptoSync(): NodeCrypto {
  return require('node:crypto') as NodeCrypto;
}

export interface ValidateInitDataOptions {
  maxAgeSeconds?: number;
  runtime?: RuntimeMode;
  parseUser?: boolean;
  strict?: boolean;
  skipAuthDateCheck?: boolean;
  extractStartParam?: boolean;
  extractChat?: boolean;
  parseUnsafeData?: boolean;
  verifySignature?: boolean;
  publicKey?: string;
  botId?: number;
}

export interface ValidateInitDataResult<TUser = TgUser> {
  valid: boolean;
  reason?:
    | 'invalid_hash'
    | 'invalid_signature'
    | 'missing_signature'
    | 'missing_public_key'
    | 'expired'
    | 'missing_hash'
    | 'malformed';
  data?: Record<string, string>;
  authDate?: number;
  user?: TUser;
  startParam?: string | null;
  chatType?: string | null;
  chatInstance?: string | null;
  rawInitData?: string;
  signatureValid?: boolean;
}

function parseInitData(initData: string) {
  const params = new URLSearchParams(initData);

  const hash = params.get('hash');
  const signature = params.get('signature');
  const authDate = params.get('auth_date');
  const startParam = params.get('start_param');
  const chatType = params.get('chat_type');
  const chatInstance = params.get('chat_instance');

  params.delete('hash');

  const data: Record<string, string> = {};
  for (const [k, v] of params.entries()) {
    data[k] = v;
  }

  return { params, data, hash, signature, authDate, startParam, chatType, chatInstance };
}

function buildDataCheckString(data: Record<string, string>) {
  return Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('\n');
}

function hexToUint8Array(hex: string): Uint8Array {
  const len = hex.length;
  const bytes = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function verifyEdge(
  dataCheckString: string,
  botToken: string,
  hash: string
): Promise<boolean> {
  const enc = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const secret = await crypto.subtle.sign('HMAC', key, enc.encode(botToken));

  const hmacKey = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', hmacKey, enc.encode(dataCheckString));

  const computedBytes = new Uint8Array(signature);
  const hashBytes = hexToUint8Array(hash);

  if (computedBytes.length !== hashBytes.length) return false;

  let diff = 0;
  for (let i = 0; i < computedBytes.length; i++) {
    diff |= computedBytes[i] ^ hashBytes[i];
  }
  return diff === 0;
}

async function verifyNode(
  dataCheckString: string,
  botToken: string,
  hash: string
): Promise<boolean> {
  const { createHmac, timingSafeEqual } = await getNodeCrypto();
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = createHmac('sha256', secretKey).update(dataCheckString).digest();
  const hashBuffer = Buffer.from(hash, 'hex');
  if (hashBuffer.length !== computed.length) return false;
  return timingSafeEqual(hashBuffer, computed);
}

function verifyNodeSync(
  dataCheckString: string,
  botToken: string,
  hash: string
): boolean {
  const { createHmac, timingSafeEqual } = getNodeCryptoSync();
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = createHmac('sha256', secretKey).update(dataCheckString).digest();
  const hashBuffer = Buffer.from(hash, 'hex');
  if (hashBuffer.length !== computed.length) return false;
  return timingSafeEqual(hashBuffer, computed);
}

async function verifySignatureNode(
  dataCheckString: string,
  signatureB64: string,
  publicKeyPem: string
): Promise<boolean> {
  try {
    const { createVerify } = await getNodeCrypto();
    const verifier = createVerify('SHA-256');
    verifier.update(dataCheckString);
    return verifier.verify(publicKeyPem, signatureB64, 'base64');
  } catch {
    return false;
  }
}

async function verifySignatureEdge(
  dataCheckString: string,
  signatureB64: string,
  publicKeyPem: string
): Promise<boolean> {
  try {
    const pemBody = publicKeyPem
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s+/g, '');
    const der = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'spki',
      der,
      { name: 'Ed25519' },
      false,
      ['verify']
    );
    const enc = new TextEncoder();
    const sigBytes = Uint8Array.from(atob(signatureB64), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify('Ed25519', key, sigBytes, enc.encode(dataCheckString));
  } catch {
    return false;
  }
}

export async function validateInitData<TUser = TgUser>(
  initData: string,
  botToken: string,
  options: ValidateInitDataOptions = {}
): Promise<ValidateInitDataResult<TUser>> {
  const {
    maxAgeSeconds = 86400,
    runtime = 'node',
    parseUser = true,
    strict = false,
    skipAuthDateCheck = false,
    extractStartParam = true,
    extractChat = true,
    parseUnsafeData = false,
  } = options;

  if (!initData || typeof initData !== 'string') {
    if (strict) throw new Error('malformed initData');
    return { valid: false, reason: 'malformed' };
  }

  let hash: string | null = null;
  let authDateStr: string | null = null;
  let data: Record<string, string> = {};

  try {
    const parsed = parseInitData(initData);
    hash = parsed.hash;
    authDateStr = parsed.authDate;
    data = parsed.data;
  } catch {
    if (strict) throw new Error('malformed initData');
    return { valid: false, reason: 'malformed' };
  }

  if (!hash) {
    if (strict) throw new Error('missing_hash');
    return { valid: false, reason: 'missing_hash' };
  }

  const dataCheckString = buildDataCheckString(data);

  const isValid =
    runtime === 'edge'
      ? await verifyEdge(dataCheckString, botToken, hash)
      : await verifyNode(dataCheckString, botToken, hash);

  if (!isValid) {
    if (strict) throw new Error('invalid_hash');
    return { valid: false, reason: 'invalid_hash' };
  }

  const authDate = authDateStr ? Number(authDateStr) : 0;

  if (!skipAuthDateCheck) {
    if (!authDate || Number.isNaN(authDate)) {
      if (strict) throw new Error('malformed auth_date');
      return { valid: false, reason: 'malformed' };
    }
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > maxAgeSeconds) {
      if (strict) throw new Error('expired');
      return { valid: false, reason: 'expired', authDate };
    }
  }

  let parsedUser: TUser | undefined;
  if (parseUser && data.user) {
    try {
      parsedUser = JSON.parse(data.user);
    } catch {
      if (strict) throw new Error('invalid_user_json');
    }
  }

  const startParam = extractStartParam ? data.start_param ?? null : undefined;
  const chatType = extractChat ? data.chat_type ?? null : undefined;
  const chatInstance = extractChat ? data.chat_instance ?? null : undefined;

  let signatureValid: boolean | undefined;
  if (options.verifySignature) {
    const params = new URLSearchParams(initData);
    const signatureB64 = params.get('signature');
    if (!signatureB64) {
      if (strict) throw new Error('missing_signature');
      return { valid: false, reason: 'missing_signature', data };
    }
    if (!options.publicKey) {
      if (strict) throw new Error('missing_public_key');
      return { valid: false, reason: 'missing_public_key', data };
    }
    
    const botId = options.botId ?? 0;
    const signatureCheckString = `${botId}:WebAppData\n${dataCheckString}`;
    signatureValid =
      runtime === 'edge'
        ? await verifySignatureEdge(signatureCheckString, signatureB64, options.publicKey)
        : await verifySignatureNode(signatureCheckString, signatureB64, options.publicKey);
    if (!signatureValid) {
      if (strict) throw new Error('invalid_signature');
      return { valid: false, reason: 'invalid_signature', data };
    }
  }

  return {
    valid: true,
    data,
    authDate,
    user: parsedUser,
    startParam,
    chatType,
    chatInstance,
    rawInitData: parseUnsafeData ? initData : undefined,
    signatureValid,
  };
}

export function validateInitDataSync<TUser = TgUser>(
  initData: string,
  botToken: string,
  options: ValidateInitDataOptions = {}
): ValidateInitDataResult<TUser> {
  const {
    maxAgeSeconds = 86400,
    parseUser = true,
    strict = false,
    skipAuthDateCheck = false,
    extractStartParam = true,
    extractChat = true,
    parseUnsafeData = false,
  } = options;

  if (!initData || typeof initData !== 'string') {
    if (strict) throw new Error('malformed initData');
    return { valid: false, reason: 'malformed' };
  }

  let parsed: ReturnType<typeof parseInitData>;
  try {
    parsed = parseInitData(initData);
  } catch {
    if (strict) throw new Error('malformed initData');
    return { valid: false, reason: 'malformed' };
  }

  const hash = parsed.hash;

  if (!hash) {
    if (strict) throw new Error('missing_hash');
    return { valid: false, reason: 'missing_hash' };
  }

  const dataCheckString = buildDataCheckString(parsed.data);
  const ok = verifyNodeSync(dataCheckString, botToken, hash);

  if (!ok) {
    if (strict) throw new Error('invalid_hash');
    return { valid: false, reason: 'invalid_hash' };
  }

  const authDate = parsed.authDate ? Number(parsed.authDate) : 0;

  if (!skipAuthDateCheck) {
    if (!authDate || Number.isNaN(authDate)) {
      if (strict) throw new Error('malformed auth_date');
      return { valid: false, reason: 'malformed' };
    }
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > maxAgeSeconds) {
      if (strict) throw new Error('expired');
      return { valid: false, reason: 'expired', authDate };
    }
  }

  let parsedUser: TUser | undefined;
  if (parseUser && parsed.data.user) {
    try {
      parsedUser = JSON.parse(parsed.data.user);
    } catch {
      if (strict) throw new Error('invalid_user_json');
    }
  }

  const startParam = extractStartParam ? parsed.data.start_param ?? null : undefined;
  const chatType = extractChat ? parsed.data.chat_type ?? null : undefined;
  const chatInstance = extractChat ? parsed.data.chat_instance ?? null : undefined;

  return {
    valid: true,
    data: parsed.data,
    authDate,
    user: parsedUser,
    startParam,
    chatType,
    chatInstance,
    rawInitData: parseUnsafeData ? initData : undefined,
  };
}

export {
  verifySignatureNode,
  verifySignatureEdge,
};
