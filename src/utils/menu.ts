import {
  BookOpen,
  CircleDot,
  ClipboardList,
  FolderKey,
  Home,
  Settings,
  ShieldCheck,
  User,
  Users,
  type LucideIcon
} from 'lucide-react'
import type { MenuItem } from '@/api/system'

const menuIconMap: Record<string, LucideIcon> = {
  BookOpen,
  ClipboardList,
  FolderKey,
  Home,
  Settings,
  ShieldCheck,
  User,
  Users
}

export function resolveMenuIcon(icon?: string): LucideIcon {
  return icon ? menuIconMap[icon] || CircleDot : CircleDot
}

export function flattenMenus(menuItems: MenuItem[]): MenuItem[] {
  return menuItems.flatMap((item) => [item, ...flattenMenus(item.children || [])])
}

export function findMenuByPath(menuItems: MenuItem[], pathname: string): MenuItem | undefined {
  for (const item of menuItems) {
    if (item.path === pathname) {
      return item
    }
    const child = findMenuByPath(item.children || [], pathname)
    if (child) {
      return child
    }
  }
  return undefined
}
