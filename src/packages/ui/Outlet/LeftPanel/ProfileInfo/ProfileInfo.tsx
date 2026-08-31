import {
  faBell,
  faChevronLeft,
  faChevronRight,
  faComment,
  faHardDrive,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import { Progress } from '@mantine/core';
import clsx from 'clsx';
import { useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';

import logoImg from '@/assets/v0/logo/logo_img.png';
import { authClient, useSession } from '@/auth';
import { AdDivider, AdIcon } from '@/packages/base';
import { useDiaryStore } from '@/store';

import { getTotalMessageCount } from '../leftPanel.utils';
import { PROFILE_INFO_FEATURES } from './profileInfo.config';
import styles from './ProfileInfo.module.css';

type ProfileInfoProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
};

const STORAGE_USED_GB = 1.2;
const STORAGE_TOTAL_GB = 5;
const REMINDER_COUNT = 3;

const formatCount = (value: number) => value.toLocaleString('en-US');

const formatCompactCount = (value: number) => {
  if (value >= 1000) {
    const compact = Math.floor(value / 100) / 10;
    return `${compact}k`;
  }

  return String(value);
};

const ProfileInfo: FC<ProfileInfoProps> = ({ collapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const chatboxes = useDiaryStore('chatboxes');
  const messageCount = getTotalMessageCount(chatboxes);
  const storagePercent = (STORAGE_USED_GB / STORAGE_TOTAL_GB) * 100;
  const user = session?.user;

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setSignOutError('Could not sign out. Please try again.');
        return;
      }
      void navigate('/auth', { replace: true });
    } catch {
      setSignOutError('Could not sign out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <footer className={clsx(styles.profileInfo, collapsed && styles.collapsed)}>
      <button
        aria-label={collapsed ? 'Expand profile' : 'Collapse profile'}
        className={styles.foldBtn}
        onClick={onToggleCollapse}
        type="button"
      >
        <AdIcon icon={collapsed ? faChevronRight : faChevronLeft} size={12} />
      </button>

      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>
            <img alt="" height={40} src={user?.image || logoImg} width={40} />
          </div>
          <span className={styles.messageBadge}>
            {formatCompactCount(messageCount)}
          </span>
        </div>

        <div className={styles.identity}>
          <p className={styles.name}>{user?.name || 'Guest'}</p>
          <p className={styles.email}>{user?.email || 'Not signed in'}</p>
        </div>
      </div>

      <div className={styles.details}>
        <AdDivider className={styles.divider} />

        <div className={styles.stats}>
          {PROFILE_INFO_FEATURES.showStorage ? (
            <>
              <div className={clsx(styles.statRow, styles.statRowStorage)}>
                <div className={clsx(styles.statIcon, styles.statIconPurple)}>
                  <AdIcon icon={faHardDrive} size={13} />
                </div>
                <span className={styles.statLabel}>Storage</span>
                <Progress
                  className={styles.storageProgress}
                  classNames={{ section: styles.storageProgressTrack }}
                  color="var(--accent-purple)"
                  radius="xl"
                  size="sm"
                  value={storagePercent}
                />
                <span className={styles.statValue}>
                  {STORAGE_USED_GB} GB / {STORAGE_TOTAL_GB} GB
                </span>
              </div>

              <AdDivider className={styles.statDivider} />
            </>
          ) : null}

          <div className={styles.statRow}>
            <div className={clsx(styles.statIcon, styles.statIconPink)}>
              <AdIcon icon={faComment} size={13} />
            </div>
            <span className={styles.statLabel}>Messages</span>
            <span className={clsx(styles.statValue, styles.statValuePink)}>
              {formatCount(messageCount)}
            </span>
          </div>

          {PROFILE_INFO_FEATURES.showReminders ? (
            <>
              <AdDivider className={styles.statDivider} />

              <div className={styles.statRow}>
                <div className={clsx(styles.statIcon, styles.statIconYellow)}>
                  <AdIcon icon={faBell} size={13} />
                </div>
                <span className={styles.statLabel}>Reminders</span>
                <span
                  className={clsx(styles.statValue, styles.statValueYellow)}
                >
                  {REMINDER_COUNT} pending
                </span>
              </div>
            </>
          ) : null}
        </div>

        {user ? (
          <>
            {signOutError ? (
              <p
                aria-live="polite"
                className={styles.signOutError}
                role="alert"
              >
                {signOutError}
              </p>
            ) : null}
            <button
              className={styles.signOutBtn}
              disabled={signingOut}
              onClick={() => void handleSignOut()}
              type="button"
            >
              <AdIcon icon={faRightFromBracket} size={13} />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </>
        ) : null}
      </div>
    </footer>
  );
};

export default ProfileInfo;
