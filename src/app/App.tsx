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
import { StorageNotice } from './StorageNotice'
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
    <StoreProvider>
      <NavigationProvider>
        <ViewedWeekProvider>
          <Shell />
        </ViewedWeekProvider>
      </NavigationProvider>
    </StoreProvider>
  )
}

function Shell() {
  const { route, go } = useNavigation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const main = useRef<HTMLElement>(null)
  const shownTab = useRef(route.tab)

  // On a tab change (not on first load), start at the top and move focus to
  // the new screen so screen reader and keyboard users land in the right place.
  // Comparing tabs rather than counting renders survives StrictMode's double effects.
  useEffect(() => {
    if (shownTab.current === route.tab) return
    shownTab.current = route.tab
    window.scrollTo(0, 0)
    main.current?.focus()
  }, [route.tab])

  const Screen = SCREENS[route.tab]
  return (
    <>
      <AppHeader
        nav={<TabBar tabs={MAIN_TABS} active={route.tab} onSelect={(tab) => go({ tab })} />}
        actions={<IconButton icon="settings" label="Settings" onClick={() => setSettingsOpen(true)} />}
      />
      <main ref={main} tabIndex={-1} className={styles.main}>
        <div className={styles.notice}>
          <StorageNotice />
        </div>
        <Screen />
      </main>
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
