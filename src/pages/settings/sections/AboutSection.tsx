import type { FC } from 'react';

import {
  faArrowUpRightFromSquare,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

import { AdIcon } from '@/packages/base';

import { SettingCard, SettingRow } from '../components';
import { APP_INFO } from '../settings.constants';
import styles from './sections.module.css';

const AboutSection: FC = () => {
  const buildMode = import.meta.env.MODE;

  return (
    <SettingCard
      id="about"
      icon={faInfoCircle}
      title="About Dear Diary"
      description="Your cozy personal diary workspace."
    >
      <SettingRow
        title="Version"
        control={<span className={styles.aboutValue}>{APP_INFO.version}</span>}
      />
      <SettingRow
        title="License"
        control={<span className={styles.aboutValue}>{APP_INFO.license}</span>}
      />
      <SettingRow
        title="Build"
        description="Current build environment."
        control={<span className={styles.aboutValue}>{buildMode}</span>}
      />
      <SettingRow
        title="Source code"
        description="View the project on GitHub."
        control={
          <a
            className={styles.aboutLink}
            href={APP_INFO.repository}
            rel="noreferrer"
            target="_blank"
          >
            GitHub
            <AdIcon icon={faArrowUpRightFromSquare} size={11} />
          </a>
        }
      />
      <SettingRow
        title="External apps"
        description="Explore more from Alice Nook."
        control={
          <a
            className={styles.aboutLink}
            href={APP_INFO.kanaFlip}
            rel="noreferrer"
            target="_blank"
          >
            Kana Flip
            <AdIcon icon={faArrowUpRightFromSquare} size={11} />
          </a>
        }
      />
    </SettingCard>
  );
};

export default AboutSection;
