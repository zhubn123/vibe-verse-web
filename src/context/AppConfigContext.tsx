import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getAppConfigApi } from '@/api/system'

const DEFAULT_PLATFORM_NAME = 'Vibe Verse'

interface AppConfigContextValue {
  platformName: string
  platformInitial: string
  reloadAppConfig: () => Promise<void>
}

const AppConfigContext = createContext<AppConfigContextValue | null>(null)

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [platformName, setPlatformName] = useState(DEFAULT_PLATFORM_NAME)

  const reloadAppConfig = useCallback(async () => {
    try {
      const config = await getAppConfigApi()
      setPlatformName(normalizePlatformName(config.platformName))
    } catch {
      setPlatformName(DEFAULT_PLATFORM_NAME)
    }
  }, [])

  useEffect(() => {
    void reloadAppConfig()
  }, [reloadAppConfig])

  const value = useMemo<AppConfigContextValue>(
    () => ({
      platformName,
      platformInitial: getPlatformInitial(platformName),
      reloadAppConfig
    }),
    [platformName, reloadAppConfig]
  )

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>
}

export function useAppConfig() {
  const value = useContext(AppConfigContext)
  if (!value) {
    throw new Error('useAppConfig must be used inside AppConfigProvider')
  }
  return value
}

function normalizePlatformName(input?: string): string {
  const normalized = input?.trim()
  return normalized || DEFAULT_PLATFORM_NAME
}

function getPlatformInitial(input: string): string {
  return Array.from(input.trim())[0]?.toUpperCase() || 'V'
}
