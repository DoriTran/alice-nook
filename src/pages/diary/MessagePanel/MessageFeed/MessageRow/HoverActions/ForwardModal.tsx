import { useMemo, useState, type FC } from 'react';

import { AdModal, AdSelect } from '@/packages/base';
import { useDiaryStore } from '@/store';

export type ForwardModalProps = {
  sourceMessageId: string | null;
  currentChatboxId: string;
  onConfirm: (targetChatboxId: string, caption?: string) => void;
  onClose: () => void;
};

const ForwardModal: FC<ForwardModalProps> = ({
  sourceMessageId,
  currentChatboxId,
  onConfirm,
  onClose,
}) => {
  const chatboxes = useDiaryStore('chatboxes');
  const [targetChatboxId, setTargetChatboxId] = useState('');
  const [caption, setCaption] = useState('');

  const options = useMemo(
    () =>
      Object.values(chatboxes)
        .filter((chatbox) => chatbox.id !== currentChatboxId)
        .map((chatbox) => ({ value: chatbox.id, label: chatbox.name })),
    [chatboxes, currentChatboxId],
  );

  const handleClose = () => {
    setTargetChatboxId('');
    setCaption('');
    onClose();
  };

  return (
    <AdModal
      opened={Boolean(sourceMessageId)}
      onClose={handleClose}
      title="Forward message"
      size="sm"
    >
      <AdSelect
        label="Target chatbox"
        placeholder="Select chatbox..."
        data={options}
        value={targetChatboxId || null}
        onChange={(value) => setTargetChatboxId(value ?? '')}
        searchable
        emptyLabel="No chatboxes found"
      />
      <label
        htmlFor="forward-caption"
        style={{
          display: 'block',
          marginTop: '0.75rem',
          marginBottom: '0.35rem',
          fontSize: 'var(--font-xs)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-muted)',
        }}
      >
        Caption (optional)
      </label>
      <textarea
        id="forward-caption"
        value={caption}
        placeholder="Add a caption..."
        onChange={(event) => setCaption(event.target.value)}
        style={{
          width: '100%',
          minHeight: '4rem',
          padding: '0.625rem 0.75rem',
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius-md)',
          font: 'inherit',
          fontSize: 'var(--font-sm)',
          resize: 'vertical',
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          marginTop: '1rem',
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!targetChatboxId}
          onClick={() => {
            onConfirm(targetChatboxId, caption);
            handleClose();
          }}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary)',
            color: 'var(--on-primary, #fff)',
            cursor: targetChatboxId ? 'pointer' : 'not-allowed',
            font: 'inherit',
            opacity: targetChatboxId ? 1 : 0.6,
          }}
        >
          Forward
        </button>
      </div>
    </AdModal>
  );
};

export default ForwardModal;
