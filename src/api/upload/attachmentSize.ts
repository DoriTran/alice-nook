export const MAX_ATTACHMENT_SIZE_BYTES = 200 * 1024 * 1024;

export type OversizedAttachmentFile = {
  name: string;
  size: number;
};

export const isAttachmentSizeAllowed = (size: number): boolean =>
  size <= MAX_ATTACHMENT_SIZE_BYTES;

export const assertAttachmentSize = (size: number): void => {
  if (!isAttachmentSizeAllowed(size)) {
    throw new Error('Attachment exceeds the 200 MiB size limit');
  }
};

export const partitionAttachmentFiles = (files: FileList | File[]) => {
  const acceptedFiles: File[] = [];
  const oversizedFiles: OversizedAttachmentFile[] = [];

  Array.from(files).forEach((file) => {
    if (isAttachmentSizeAllowed(file.size)) {
      acceptedFiles.push(file);
    } else {
      oversizedFiles.push({ name: file.name, size: file.size });
    }
  });

  return { acceptedFiles, oversizedFiles };
};

export const formatAttachmentSizeMiB = (size: number): string =>
  `${(size / (1024 * 1024)).toFixed(2)} MiB (${size.toLocaleString('en-US')} bytes)`;
