import { Heart } from 'lucide-react';
import { useState, type FC } from 'react';

import { AdEmojiPicker, AdIcon, AdTooltip } from '@/packages/base';

import styles from './ReactionIconPicker.module.css';

export type ReactionIconPickerProps = {
  onSelect: (value: string) => void;
};

const ReactionIconPicker: FC<ReactionIconPickerProps> = ({ onSelect }) => {
  const [opened, setOpened] = useState(false);

  return (
    <AdEmojiPicker
      opened={opened}
      onChange={setOpened}
      onSelect={onSelect}
      anchor={
        <AdTooltip
          label="Insert emoji"
          position="top"
          withArrow={false}
          classNames={{ tooltip: styles.tooltip }}
        >
          <button
            type="button"
            className={styles.triggerBtn}
            aria-label="Insert emoji"
            onClick={() => setOpened((current) => !current)}
          >
            <AdIcon icon={Heart} source="lucide" size={16} />
          </button>
        </AdTooltip>
      }
    />
  );
};

export default ReactionIconPicker;
