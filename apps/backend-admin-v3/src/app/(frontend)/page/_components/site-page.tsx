'use client'

import { Media, SitePage as SitePageType } from '@/payload-types'
import { RenderPageBlocks } from '@/app/(frontend)/page/_components/render-blocks'
import { cn } from '@/utilities/cn'

const ROOT_KEYS = {
  FONT_PRIMARY: '--page-font-primary',
  FONT_SECONDARY: '--page-font-secondary',
}

/**
 * Parse DaisyUI @plugin theme syntax to actual CSS variables
 * Extracts CSS variables and creates [data-theme="name"] selector
 */
const parseThemeToCssVars = (themeCSS: string, themeName: string): string => {
  try {
    // Extract all CSS variable definitions (--color-primary: value;)
    const varRegex = /--([\w-]+):\s*([^;]+);/g
    const matches = [...themeCSS.matchAll(varRegex)]

    if (matches.length === 0) return ''

    // Build CSS rule with data-theme selector
    const cssVars = matches.map((match) => `  --${match[1]}: ${match[2]};`).join('\n')

    return `
[data-theme="${themeName}"] {
${cssVars}
}
    `.trim()
  } catch (error) {
    console.error('Error parsing theme CSS:', error)
    return ''
  }
}

const SitePage = ({ initialData: content }: { initialData: SitePageType }) => {
  if (!content) return <p>No content</p>

  const useCustomTheme = content?.c?.use_custom_theme === true
  const themeName = useCustomTheme
    ? (content?.c as any)?.custom_theme_name || 'dohaquest-new'
    : content?.c?.theme || 'dohaquest-new'

  return (
    <>
      <style>{css(content)}
        {`
        h1, h2, h3, h4, h5, h6 {
          font-family: var(--page-font-primary), sans-serif;
        }
        p, span, div {
          font-family: var(--page-font-secondary), sans-serif;
        }
        `}
      </style>

      <div
        data-theme={themeName}
        className={cn(
          'bg-base-100 text-base-content',
          content.adv?.className || '',
          'w-full h-full min-h-screen',
        )}
      >
        <div className={cn('mx-auto w-full max-w-7xl h-full flex flex-col')}>
          <RenderPageBlocks blocks={content?.c?.blk} />

         
        </div>
      </div>
    </>
  )
}

const css = (data: SitePageType) => {
  const styles = ['']
  const { c } = data
  const useCustomTheme = c?.use_custom_theme === true

  // If using custom theme, convert to actual CSS variables
  if (useCustomTheme && c?.custom_theme_css) {
    const themeName = (c as any)?.custom_theme_name || 'custom-theme'
    const cssVars = parseThemeToCssVars(c.custom_theme_css, themeName)
    styles.push(cssVars)
  }

  const getFileType = (fileName: string) => {
    const parts = fileName.split('.')
    return parts[parts.length - 1]
  }

  const getFileName = (fileName: string, type: string) => {
    if (!fileName) return ''
    const name = fileName.replace(`.${type}`, '')
    return `${name}`
  }

  const getFontFormat = (type: string) => {
    switch (type) {
      case 'woff2':
        return 'woff2'
      case 'woff':
        return 'woff'
      case 'ttf':
        return 'truetype'
      case 'otf':
        return 'opentype'
      default:
        return 'woff2'
    }
  }

  const getFontFaceStyle = (font: Media) => {
    const type = getFileType(font?.filename || '')
    const fileName = getFileName(font?.filename || '', type)
    const format = getFontFormat(type)
    const url = font?.url || ''

    return {
      fileName: fileName,
      css: `
        @font-face {
          font-family: "${fileName}";
          src: local("${fileName}"), url(${url}) format("${format}");
          font-weight: normal;
          font-style: normal;
        }
      `,
    }
  }

  const vars = []

  // Handle custom fonts
  if (data?.c?.font_primary) {
    const font = getFontFaceStyle(data.c.font_primary as Media)
    vars.push(`${ROOT_KEYS.FONT_PRIMARY}: "${font.fileName}";`)
    styles.push(font.css)
  }
  if (data?.c?.font_secondary) {
    const font = getFontFaceStyle(data.c.font_secondary as Media)
    vars.push(`${ROOT_KEYS.FONT_SECONDARY}: "${font.fileName}";`)
    styles.push(font.css)
  }

  // Only add :root variables if we have fonts
  if (vars.length > 0) {
    const root = [`:root {`, vars.join('\n'), `}`].join('\n')
    styles.push(root)
  }

  // Add any custom advanced CSS
  styles.push(data.adv?.css ? data.adv.css : '')

  return styles.join('\n')
}

export default SitePage
