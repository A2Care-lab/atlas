import { BRAND_LOGO_URLS } from '../lib/brand'

interface BrandProps {
  variant?: 'white' | 'black' | 'teal'
  withText?: boolean
  className?: string
}

export function Brand({ variant = 'teal', withText = true, className = '' }: BrandProps) {
  const src = withText
    ? variant === 'white'
      ? BRAND_LOGO_URLS.white_with_text
      : variant === 'black'
      ? BRAND_LOGO_URLS.black_with_text
      : BRAND_LOGO_URLS.teal_with_text
    : BRAND_LOGO_URLS.teal_icon_only

  return (
    <img src={src} alt="ATLAS" className={`select-none ${className}`} />
  )
}

