import type { JSONContent } from '@tiptap/core';

import { createStore, get, set } from 'idb-keyval';

export type SecretAttrs = {
  secretId: string;
  version: 1;
  keyVersion: 1;
  ciphertext: string;
  iv: string;
  authTag?: string;
  displayLength: number;
};

const secretKeyStore = createStore('alice-nook-secret', 'crypto-keys');
const KEY_ID = 'local-secret-v1';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((value) => (binary += String.fromCharCode(value)));
  return btoa(binary);
};
const base64ToBytes = (value: string) => {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

export const getLocalSecretKey = async (): Promise<CryptoKey> => {
  const existing = await get<CryptoKey>(KEY_ID, secretKeyStore);
  if (existing) return existing;
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  await set(KEY_ID, key, secretKeyStore);
  const verified = await get<CryptoKey>(KEY_ID, secretKeyStore);
  if (!verified) throw new Error('LOCAL_SECRET_UNAVAILABLE');
  return verified;
};

export const encryptLocalSecret = async (
  fragment: JSONContent,
  attrs: Pick<SecretAttrs, 'secretId' | 'displayLength'>,
): Promise<SecretAttrs> => {
  const key = await getLocalSecretKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(JSON.stringify({ version: 1, fragment }));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext),
  );
  return {
    ...attrs,
    version: 1,
    keyVersion: 1,
    ciphertext: bytesToBase64(ciphertext),
    iv: bytesToBase64(iv),
  };
};

export const decryptLocalSecret = async (
  attrs: SecretAttrs,
): Promise<JSONContent> => {
  const key = await getLocalSecretKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(attrs.iv) },
    key,
    base64ToBytes(attrs.ciphertext),
  );
  const envelope = JSON.parse(decoder.decode(plaintext)) as {
    version: number;
    fragment: JSONContent;
  };
  if (envelope.version !== 1 || envelope.fragment?.type !== 'doc')
    throw new Error('LOCAL_SECRET_INVALID');
  return envelope.fragment;
};
