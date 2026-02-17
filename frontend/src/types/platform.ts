// Platform Types
export type Platform = 'all' | 'instagram' | 'tiktok' | 'linkedin'

export interface PlatformConfig {
  id: Platform
  name: string
  color: string
  bgColor: string
  textColor: string
  borderColor: string
  icon: string
}

export const platformConfigs: Record<Platform, PlatformConfig> = {
  all: {
    id: 'all',
    name: 'Overview',
    color: 'indigo',
    bgColor: 'bg-primary-600',
    textColor: 'text-primary-600',
    borderColor: 'border-primary-600',
    icon: 'LayoutDashboard'
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    color: 'pink',
    bgColor: 'bg-pink-600',
    textColor: 'text-pink-600',
    borderColor: 'border-pink-600',
    icon: 'Instagram'
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    color: 'slate',
    bgColor: 'bg-slate-900',
    textColor: 'text-slate-900',
    borderColor: 'border-slate-900',
    icon: 'Music2'
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    color: 'blue',
    bgColor: 'bg-blue-600',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-600',
    icon: 'Linkedin'
  }
}
