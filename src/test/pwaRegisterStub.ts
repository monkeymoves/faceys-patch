import { useState } from 'react'

/** Test stand-in for 'virtual:pwa-register/react'. Set `pwaStub.needRefresh` before rendering. */
export const pwaStub = { needRefresh: false, updates: 0 }

export function useRegisterSW() {
  const needRefresh = useState(pwaStub.needRefresh)
  const offlineReady = useState(false)
  return {
    needRefresh,
    offlineReady,
    updateServiceWorker: async () => {
      pwaStub.updates += 1
    },
  }
}
