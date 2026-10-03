import { getAttachmentReadUrl } from './durableUpload';

const REFRESH_EARLY_MS = 60_000;
type Entry = { url: string; expiresAt: number };
const cache = new Map<string, Entry>();
const pending = new Map<string, Promise<string>>();
let generation = 0;

export const resolvePrivateAttachmentUrl = async (
  attachmentId: string,
): Promise<string> => {
  const current = cache.get(attachmentId);
  if (current && current.expiresAt - Date.now() > REFRESH_EARLY_MS) {
    return current.url;
  }
  const inFlight = pending.get(attachmentId);
  if (inFlight) return inFlight;
  const requestGeneration = generation;
  const request = getAttachmentReadUrl(attachmentId)
    .then((result) => {
      if (requestGeneration === generation) {
        cache.set(attachmentId, {
          url: result.url,
          expiresAt: Date.parse(result.expiresAt),
        });
      }
      return result.url;
    })
    .finally(() => {
      if (pending.get(attachmentId) === request) {
        pending.delete(attachmentId);
      }
    });
  pending.set(attachmentId, request);
  return request;
};

export const clearAttachmentReadUrlCache = () => {
  generation += 1;
  cache.clear();
  pending.clear();
};
