import type { MarkViewProps } from '@tiptap/core';

import { MarkViewContent } from '@tiptap/react';
import { Mail, Phone } from 'lucide-react';

import AdIcon from '../../../AdIcon/AdIcon';
import styles from './ContentContactMarkView.module.css';

const ContentContactMarkView = ({ editor, mark }: MarkViewProps) => {
  const phone = mark.type.name === 'contentPhone';
  const target = String(
    phone
      ? (mark.attrs.normalizedPhone ?? '')
      : (mark.attrs.normalizedEmail ?? ''),
  );
  return (
    <span className={styles.root} data-contact-kind={phone ? 'phone' : 'email'}>
      <span className={styles.icon} contentEditable={false} aria-hidden>
        <AdIcon icon={phone ? Phone : Mail} source="lucide" size={13} />
      </span>
      <MarkViewContent
        as="a"
        className={styles.link}
        data-content-phone={phone || undefined}
        data-content-email={!phone || undefined}
        href={`${phone ? 'tel' : 'mailto'}:${target}`}
        onClick={(event) => {
          if (editor.isEditable) event.preventDefault();
        }}
      />
    </span>
  );
};

export default ContentContactMarkView;
