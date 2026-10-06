import { faComments } from '@fortawesome/free-solid-svg-icons';
import { useState, type FC } from 'react';

import type { MessagePreferences } from '@/store/settings/type';

import { AdSegmentedControl } from '@/packages/base';
import { DEFAULT_PREFERENCES } from '@/store/settings/constants';

import { SettingCard, SettingRow } from '../components';

const D = DEFAULT_PREFERENCES.messages;

const MessagesSection: FC = () => {
  const [timestamp, setTimestamp] = useState<
    MessagePreferences['timestampFormat']
  >(D.timestampFormat);
  const [bubbleWidth, setBubbleWidth] = useState<
    MessagePreferences['bubbleWidth']
  >(D.bubbleWidth);
  const [animationSpeed, setAnimationSpeed] = useState<
    MessagePreferences['animationSpeed']
  >(D.animationSpeed);
  const [mediaLayout, setMediaLayout] = useState<
    MessagePreferences['defaultMediaLayout']
  >(D.defaultMediaLayout);

  return (
    <SettingCard
      id="general"
      icon={faComments}
      title="General"
      description="Message and feed preferences."
    >
      <SettingRow
        title="Timestamp format"
        description="Display message times in 12-hour or 24-hour format."
        suggested
        control={
          <AdSegmentedControl
            aria-label="Timestamp format"
            onChange={setTimestamp}
            options={[
              { value: '12h', label: '12h' },
              { value: '24h', label: '24h' },
            ]}
            value={timestamp}
          />
        }
      />
      <SettingRow
        title="Bubble width"
        description="How wide message bubbles can grow."
        suggested
        control={
          <AdSegmentedControl
            aria-label="Bubble width"
            onChange={setBubbleWidth}
            options={[
              { value: 'narrow', label: 'Narrow' },
              { value: 'regular', label: 'Regular' },
              { value: 'wide', label: 'Wide' },
            ]}
            value={bubbleWidth}
          />
        }
      />
      <SettingRow
        title="Animation speed"
        description="Speed of message and feed animations."
        suggested
        control={
          <AdSegmentedControl
            aria-label="Animation speed"
            onChange={setAnimationSpeed}
            options={[
              { value: 'slow', label: 'Slow' },
              { value: 'normal', label: 'Normal' },
              { value: 'fast', label: 'Fast' },
            ]}
            value={animationSpeed}
          />
        }
      />
      <SettingRow
        title="Default media layout"
        description="How multiple media attachments are arranged."
        suggested
        control={
          <AdSegmentedControl
            aria-label="Default media layout"
            onChange={setMediaLayout}
            options={[
              { value: 'grid', label: 'Grid' },
              { value: 'stack', label: 'Stack' },
            ]}
            value={mediaLayout}
          />
        }
      />
    </SettingCard>
  );
};

export default MessagesSection;
