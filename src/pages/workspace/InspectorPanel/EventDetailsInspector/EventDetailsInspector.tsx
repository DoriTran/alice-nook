import type { FC } from 'react';

import { useNavigate } from 'react-router-dom';

import type { Message } from '@/store/diary/type';
import type { WorkspaceRecord } from '@/store/workspace/type';

import { AdChip } from '@/packages/base';
import { DEFAULT_COLOR_ID } from '@/packages/color';
import { getMessagePreviewText } from '@/pages/diary/MessagePanel/messagePanel.utils';
import { useAppStore, useDiaryStore, useWorkspaceStore } from '@/store';

import { useWorkspacePageData } from '../../.hooks/useWorkspacePageData';
import {
  formatEventDate,
  formatEventTimeRange,
} from '../../tools/scheduler/scheduler.utils';
import {
  getSchedulerPayload,
  getWorkspaceSources,
  resolveRecordSourceMeta,
} from '../../workspace.utils';
import styles from './EventDetailsInspector.module.css';

export type EventDetailsInspectorProps = {
  record: WorkspaceRecord;
};

const EventDetailsInspector: FC<EventDetailsInspectorProps> = ({ record }) => {
  const navigate = useNavigate();
  const deleteRecord = useWorkspaceStore('deleteRecord');
  const selectRecord = useWorkspaceStore('selectRecord');
  const sources = useWorkspaceStore('sources');
  const messages = useDiaryStore('messages');
  const chatboxes = useDiaryStore('chatboxes');
  const selectChatbox = useAppStore('selectChatbox');
  const { selectedWorkspace } = useWorkspacePageData();

  const payload = getSchedulerPayload(record);

  if (!payload) {
    return null;
  }

  const workspaceSources = getWorkspaceSources(selectedWorkspace, sources);
  const sourceMeta = resolveRecordSourceMeta(
    record.source,
    workspaceSources,
    chatboxes,
  );

  const linkedMessages = (payload.linkedMessageIds ?? [])
    .map((messageId: string) => messages[messageId])
    .filter(Boolean);

  const handleViewInChat = () => {
    if (record.source.type !== 'chatbox') {
      return;
    }

    selectChatbox(record.source.chatboxId);
    void navigate(`/diary/${record.source.chatboxId}`);
  };

  const handleDelete = () => {
    deleteRecord(record.id);
    selectRecord(null);
  };

  return (
    <div className={styles.root}>
      <section className={styles.section}>
        <h3 className={styles.eventTitle}>{payload.title}</h3>
        <span
          className={styles.sourceBadge}
          style={{
            background: `color-mix(in srgb, ${sourceMeta.color} 24%, var(--surface))`,
          }}
        >
          <span
            className={styles.sourceDot}
            style={{ background: sourceMeta.color }}
            aria-hidden
          />
          {sourceMeta.label}
        </span>
        <p className={styles.meta}>
          {formatEventDate(payload)} · {formatEventTimeRange(payload)}
        </p>
      </section>

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Description</h4>
        <textarea
          className={styles.textarea}
          value={payload.description ?? ''}
          readOnly
          rows={4}
          placeholder="No description"
        />
      </section>

      {record.source.type === 'chatbox' ? (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Source Details</h4>
          <button
            type="button"
            className={styles.linkButton}
            onClick={handleViewInChat}
          >
            View in Chat
          </button>
        </section>
      ) : null}

      {linkedMessages.length > 0 ? (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Linked Messages</h4>
          <ul className={styles.messageList}>
            {linkedMessages.map((message: Message) => {
              const chatbox = chatboxes[message.chatboxId];

              return (
                <li key={message.id} className={styles.messageItem}>
                  <span className={styles.messageText}>
                    {getMessagePreviewText(message)}
                  </span>
                  <span className={styles.messageMeta}>
                    {chatbox?.name ?? 'Chat'} ·{' '}
                    {new Date(message.createdAt).toLocaleDateString()}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {payload.tags && payload.tags.length > 0 ? (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Tags</h4>
          <div className={styles.tags}>
            {payload.tags.map((tag: string) => (
              <AdChip
                key={tag}
                label={tag.replace(/^#/, '')}
                colorId={DEFAULT_COLOR_ID}
                size="small"
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Notes</h4>
        <textarea
          className={styles.textarea}
          value={payload.notes ?? ''}
          readOnly
          rows={3}
          placeholder="No notes"
        />
      </section>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.deleteButton}
          onClick={handleDelete}
        >
          Delete Event
        </button>
      </footer>
    </div>
  );
};

export default EventDetailsInspector;
