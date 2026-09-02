import { useMemo, type FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AdDivider, AdIcon } from '@/packages/base';
import { resolveWorkspaceForToolType } from '@/pages/workspace/workspace.utils';
import {
  useAppStore,
  useDiaryHydrated,
  useDiaryStore,
  useWorkspaceStore,
} from '@/store';

import LayoutCard from '../../LayoutCard/LayoutCard';
import Logo from '../../Logo/Logo';
import ThemeSelection from '../../ThemeSelection/ThemeSelection';
import styles from './LeftPanel.module.css';
import { getLatestUpdatedChatboxes } from './leftPanel.utils';
import {
  mainNavigationPages,
  navigationIcons,
  navigationLabels,
  navigationRoutes,
  toolsNav,
  type NavigationPage,
} from './nav.constants';
import ProfileInfo from './ProfileInfo/ProfileInfo';

const LeftPanel: FC = () => {
  const { navPanel, diaryPage, setNavPanelFolded, selectChatbox } = useAppStore(
    ['navPanel', 'diaryPage', 'setNavPanelFolded', 'selectChatbox'],
  );
  const chatboxes = useDiaryStore('chatboxes');
  const workspaces = useWorkspaceStore('workspaces');
  const orders = useWorkspaceStore('orders');
  const ui = useWorkspaceStore('ui');
  const selectWorkspace = useWorkspaceStore('selectWorkspace');
  const openToolHome = useWorkspaceStore('openToolHome');
  const diaryHydrated = useDiaryHydrated();

  const folded = navPanel.folded;
  const navigate = useNavigate();
  const location = useLocation();

  const storyChatboxes = useMemo(
    () => (diaryHydrated ? getLatestUpdatedChatboxes(chatboxes) : []),
    [chatboxes, diaryHydrated],
  );

  const selectedWorkspace = ui.selectedWorkspaceId
    ? workspaces[ui.selectedWorkspaceId]
    : undefined;

  const isActive = (page: NavigationPage) =>
    location.pathname === navigationRoutes[page];

  const goToPage = (page: NavigationPage) => {
    void navigate(navigationRoutes[page]);
  };

  const goToStoryChatbox = (chatboxId: string) => {
    selectChatbox(chatboxId);
    void navigate('/diary');
  };

  const goToTool = (type: (typeof toolsNav)[number]['type']) => {
    const workspaceId = resolveWorkspaceForToolType(
      type,
      workspaces,
      orders.workspaceIds,
      ui.lastUsedWorkspaceByType,
    );

    void navigate('/workspace');

    if (workspaceId) {
      selectWorkspace(workspaceId);
      return;
    }

    openToolHome(type);
  };

  return (
    <LayoutCard
      tag="aside"
      className={styles.panel}
      data-collapsed={folded || undefined}
    >
      <header className={styles.header}>
        <Logo
          className={styles.headerLogo}
          variant={folded ? 'stacked' : 'expanded'}
        />
      </header>

      <nav aria-label="Sidebar" className={`${styles.nav} scrollbar-hidden`}>
        <section className={styles.navGroup}>
          <h2 className={styles.groupLabel}>Main</h2>
          <ul className={styles.navList}>
            {mainNavigationPages.map((page) => (
              <li key={page}>
                <button
                  className={styles.navItem}
                  data-active={isActive(page) || undefined}
                  data-module={page}
                  type="button"
                  onClick={() => goToPage(page)}
                >
                  <AdIcon icon={navigationIcons[page]} size={16} />
                  <span className={styles.navItemLabel}>
                    {navigationLabels[page]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {storyChatboxes.length > 0 ? (
          <section className={styles.navGroup}>
            <AdDivider aria-hidden={!folded} className={styles.groupDivider} />
            <h2 className={styles.groupLabel}>Story</h2>
            <ul className={styles.navList}>
              {storyChatboxes.map((chatbox) => (
                <li key={chatbox.id}>
                  <button
                    className={styles.navItem}
                    data-active={
                      (location.pathname === '/diary' &&
                        diaryPage.selectedChatboxId === chatbox.id) ||
                      undefined
                    }
                    data-module="diary"
                    type="button"
                    onClick={() => goToStoryChatbox(chatbox.id)}
                  >
                    <AdIcon icon={chatbox.icon} source="lucide" size={16} />
                    <span className={styles.navItemLabel}>{chatbox.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className={styles.navGroup}>
          <AdDivider aria-hidden={!folded} className={styles.groupDivider} />
          <h2 className={styles.groupLabel}>Tools</h2>
          <ul className={styles.navList}>
            {toolsNav.map((item) => (
              <li key={item.id}>
                <button
                  className={styles.navItem}
                  data-active={
                    (location.pathname === '/workspace' &&
                      selectedWorkspace?.type === item.type) ||
                    undefined
                  }
                  data-module={item.type}
                  type="button"
                  onClick={() => goToTool(item.type)}
                >
                  <AdIcon icon={item.icon} size={16} />
                  <span className={styles.navItemLabel}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </nav>

      <section aria-label="Appearance" className={styles.themeSection}>
        <ThemeSelection collapsed={folded} />
      </section>

      <ProfileInfo
        collapsed={folded}
        onToggleCollapse={() => setNavPanelFolded(!folded)}
      />
    </LayoutCard>
  );
};

export default LeftPanel;
