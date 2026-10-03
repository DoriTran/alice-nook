import { describe, expect, it } from 'vitest';

import {
  assertAttachmentSize,
  formatAttachmentSizeMB,
  MAX_ATTACHMENT_SIZE_BYTES,
  partitionAttachmentFiles,
} from './attachmentSize';

const fileWithSize = (name: string, size: number): File =>
  ({ name, size }) as File;

describe('attachment size validation', () => {
  it('accepts exactly 200 MB and rejects one byte more', () => {
    expect(() => assertAttachmentSize(MAX_ATTACHMENT_SIZE_BYTES)).not.toThrow();
    expect(() => assertAttachmentSize(MAX_ATTACHMENT_SIZE_BYTES + 1)).toThrow(
      'Attachment exceeds the 200 MB size limit',
    );
  });

  it('keeps valid files and reports every oversized file in a mixed batch', () => {
    const valid = fileWithSize('valid.zip', MAX_ATTACHMENT_SIZE_BYTES);
    const tooLargeImage = fileWithSize(
      'huge-image.png',
      MAX_ATTACHMENT_SIZE_BYTES + 1,
    );
    const tooLargeVideo = fileWithSize(
      'huge-video.mp4',
      MAX_ATTACHMENT_SIZE_BYTES + 1024,
    );

    expect(
      partitionAttachmentFiles([valid, tooLargeImage, tooLargeVideo]),
    ).toEqual({
      acceptedFiles: [valid],
      oversizedFiles: [
        { name: 'huge-image.png', size: MAX_ATTACHMENT_SIZE_BYTES + 1 },
        { name: 'huge-video.mp4', size: MAX_ATTACHMENT_SIZE_BYTES + 1024 },
      ],
    });
  });

  it('shows a compact rounded MB label', () => {
    expect(formatAttachmentSizeMB(233_850_738)).toBe('234 MB');
  });
});
