import { useEffect, useRef, useState, type ComponentType } from 'react'
import { CookScreen } from '../features/cook/CookScreen'
import { LarderScreen } from '../features/larder/LarderScreen'
import { PatchScreen } from '../features/patch/PatchScreen'
import { SettingsSheet } from '../features/settings/SettingsSheet'
import { ShopScreen } from '../features/shop/ShopScreen'
import { WeekScreen } from '../features/week/WeekScreen'
import { AppHeader } from '../ui/AppHeader'
import { IconButton } from '../ui/IconButton'
import { MAIN_TABS, TabBar, type MainTabId } from '../ui/TabBar'
import styles from './App.module.css'
import { NavigationProvider } from './navigation'
import { useNavigation } from './useNavigation'
import { ErrorBoundary } from './ErrorBoundary'
import { StorageNotice } from './StorageNotice'
import { UpdateNotice } from './UpdateNotice'
import { StoreProvider } from './store'
import { ViewedWeekProvider } from './viewedWeek'

const SCREENS: Record<MainTabId, ComponentType> = {
  patch: PatchScreen,
  larder: LarderScreen,
  cook: CookScreen,
  week: WeekScreen,
  shop: ShopScreen,
}

export function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <NavigationProvider>
          <ViewedWeekProvider>
            <Shell />
          </ViewedWeekProvider>
        </NavigationProvider>
      </StoreProvider>
    </ErrorBoundary>
  )
}

const TITLES: Record<MainTabId, string> = {
  patch: "What's ready",
  larder: 'Larder',
  cook: 'What to cook',
  week: "What's for dinner",
  shop: 'Shopping list',
}

/** Focus the screen's title, so a screen reader announces where the person has landed. */
function focusScreen(main: HTMLElement | null) {
  const heading = main?.querySelector('h1')
  if (heading) {
    heading.tabIndex = -1
    heading.focus()
  } else {
    main?.focus()
  }
}

function Shell() {
  const { route, go } = useNavigation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const main = useRef<HTMLElement>(null)
  const shownTab = useRef(route.tab)

  useEffect(() => {
    document.title = `${TITLES[route.tab]} | Facey's Patch`
  }, [route.tab])

  // On a tab change (not on first load), start at the top and move focus to
  // the new screen so screen reader and keyboard users land in the right place.
  // Comparing tabs rather than counting renders survives StrictMode's double effects.
  useEffect(() => {
    if (shownTab.current === route.tab) return
    shownTab.current = route.tab
    window.scrollTo(0, 0)
    focusScreen(main.current)
  }, [route.tab])

  const Screen = SCREENS[route.tab]
  return (
    <>
      {/* The tab bar comes first in the page, so keyboard users can jump past it. */}
      <button type="button" className={styles.skip} onClick={() => focusScreen(main.current)}>
        Skip to content
      </button>
      <AppHeader
        nav={<TabBar tabs={MAIN_TABS} active={route.tab} onSelect={(tab) => go({ tab })} />}
        actions={<IconButton icon="settings" label="Settings" onClick={() => setSettingsOpen(true)} />}
      />
      <main ref={main} tabIndex={-1} className={styles.main}>
        <div className={styles.notice}>
          <StorageNotice />
          <UpdateNotice />
        </div>
        <Screen />
      </main>
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
