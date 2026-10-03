import type { FC } from 'react';

import { Button, Group, List, ScrollArea, Stack, Text } from '@mantine/core';

import {
  formatAttachmentSizeMiB,
  type OversizedAttachmentFile,
} from '@/api/upload/attachmentSize';
import { AdModal } from '@/packages/base';

export type OversizedAttachmentDialogProps = {
  files: OversizedAttachmentFile[];
  onClose: () => void;
};

const OversizedAttachmentDialog: FC<OversizedAttachmentDialogProps> = ({
  files,
  onClose,
}) => (
  <AdModal
    opened={files.length > 0}
    onClose={onClose}
    title="Some files are too large"
    size="sm"
  >
    <Stack gap="sm">
      <Text size="sm">
        Each attachment can be up to 200 MiB. These files were not added:
      </Text>
      <ScrollArea.Autosize mah={240} offsetScrollbars>
        <List size="sm" spacing="xs">
          {files.map((file, index) => (
            <List.Item key={`${file.name}:${file.size}:${index}`}>
              <Text span fw={600}>
                {file.name}
              </Text>{' '}
              <Text span c="dimmed">
                — {formatAttachmentSizeMiB(file.size)}
              </Text>
            </List.Item>
          ))}
        </List>
      </ScrollArea.Autosize>
      <Group justify="flex-end">
        <Button onClick={onClose}>Got it</Button>
      </Group>
    </Stack>
  </AdModal>
);

export default OversizedAttachmentDialog;
