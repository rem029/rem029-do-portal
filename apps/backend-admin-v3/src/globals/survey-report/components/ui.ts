// Shared class recipes for the survey report, on the admin's dohaoasis-new brand tokens
// (src/app/(payload)/admin-theme/_tokens.scss): --admin-color-accent is green in light, gold in dark.

export const hairline =
  'border-[color-mix(in_srgb,var(--admin-color-secondary)_35%,var(--theme-elevation-100))]'

export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--admin-color-accent)'

export const surface = `rounded-lg border ${hairline} bg-(--theme-elevation-0)`

export const notice = `p-5 ${surface} text-[15px] text-(--theme-elevation-700)`

export const emptyState = `p-10 text-center ${surface} text-[15px] text-(--theme-elevation-500)`

export const control = `h-[38px] px-3 font-(family-name:--admin-font-sans) border ${hairline} rounded-md text-[14px] font-light! bg-(--theme-elevation-0) text-(--theme-elevation-800) ${focusRing}`

export const secondaryButton = `h-[38px] inline-flex items-center gap-2 px-3.5 rounded-md text-[14px] font-normal! bg-(--theme-elevation-0) text-(--theme-elevation-800) border ${hairline} hover:border-(--admin-color-accent) hover:text-(--admin-color-accent) cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-(--theme-elevation-800) ${focusRing}`

export const headingSerif = 'font-(family-name:--admin-font-secondary) font-normal'

export const divideHairline =
  'divide-[color-mix(in_srgb,var(--admin-color-secondary)_35%,var(--theme-elevation-100))]'
