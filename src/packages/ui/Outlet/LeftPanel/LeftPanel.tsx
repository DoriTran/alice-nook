import { useEffect, useMemo, useState, type FC } from 'react';
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

export type LeftPanelProps = {
  presentation?: 'desktop' | 'drawer';
  onNavigate?: () => void;
};

const LeftPanel: FC<LeftPanelProps> = ({
  presentation = 'desktop',
  onNavigate,
}) => {
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
  const [forceFolded, setForceFolded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const effectiveFolded = presentation === 'desktop' && (folded || forceFolded);

  useEffect(() => {
    const query = window.matchMedia(
      '(min-width: 640px) and (max-width: 899px)',
    );
    const update = () => setForceFolded(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const storyChatboxes = useMemo(
    () => (diaryHydrated ? getLatestUpdatedChatboxes(chatboxes) : []),
    [chatboxes, diaryHydrated],
  );

  const selectedWorkspace = ui.selectedWorkspaceId
    ? workspaces[ui.selectedWorkspaceId]
    : undefined;

  const isActive = (page: NavigationPage) =>
    page === 'diary'
      ? location.pathname.startsWith('/diary')
      : location.pathname === navigationRoutes[page];

  const goToPage = (page: NavigationPage) => {
    void navigate(navigationRoutes[page]);
    onNavigate?.();
  };

  const goToStoryChatbox = (chatboxId: string) => {
    selectChatbox(chatboxId);
    void navigate(`/diary/${chatboxId}`);
    onNavigate?.();
  };

  const goToTool = (type: (typeof toolsNav)[number]['type']) => {
    const workspaceId = resolveWorkspaceForToolType(
      type,
      workspaces,
      orders.workspaceIds,
      ui.lastUsedWorkspaceByType,
    );

    void navigate('/workspace');
    onNavigate?.();

    if (workspaceId) {
      selectWorkspace(workspaceId);
      return;
    }

    openToolHome(type);
  };

  const handleToggleCollapse = () => {
    if (forceFolded) {
      setForceFolded(false);
      setNavPanelFolded(false);
      return;
    }
    setNavPanelFolded(!folded);
  };

  return (
    <LayoutCard
      tag="aside"
      className={styles.panel}
      data-collapsed={effectiveFolded || undefined}
      data-presentation={presentation}
    >
      <header className={styles.header}>
        <Logo
          className={styles.headerLogo}
          variant={effectiveFolded ? 'stacked' : 'expanded'}
        />
      </header>

      <div className={`${styles.navigationScroll} scrollbar-thin`}>
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
              <AdDivider
                aria-hidden={!effectiveFolded}
                className={styles.groupDivider}
              />
              <h2 className={styles.groupLabel}>Story</h2>
              <ul className={styles.navList}>
                {storyChatboxes.map((chatbox) => (
                  <li key={chatbox.id}>
                    <button
                      className={styles.navItem}
                      data-active={
                        (location.pathname.startsWith('/diary') &&
                          diaryPage.selectedChatboxId === chatbox.id) ||
                        undefined
                      }
                      data-module="diary"
                      data-nav-tone="theme"
                      type="button"
                      onClick={() => goToStoryChatbox(chatbox.id)}
                    >
                      <AdIcon icon={chatbox.icon} source="lucide" size={16} />
                      <span className={styles.navItemLabel}>
                        {chatbox.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className={styles.navGroup}>
            <AdDivider
              aria-hidden={!effectiveFolded}
              className={styles.groupDivider}
            />
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
                    data-nav-tone="theme"
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
      </div>

      <section aria-label="Appearance" className={styles.themeSection}>
        <ThemeSelection
          collapsed={effectiveFolded}
          popoverZIndex={presentation === 'drawer' ? 1100 : undefined}
        />
      </section>

      <ProfileInfo
        collapsed={effectiveFolded}
        onToggleCollapse={handleToggleCollapse}
        showCollapse={presentation === 'desktop'}
      />
    </LayoutCard>
  );
};

export default LeftPanel;
