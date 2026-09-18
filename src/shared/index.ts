import Ele from '@/core/ele'
import { rootThemePrefix, type Theme } from '@/config/page-themes'

export const HTML = document.documentElement
export const HEAD = document.head
export const BODY = document.body
export const RAW_SELECTOR = 'pre'
export const HEADERS = 'h1, h2, h3, h4, h5, h6'
export const CONTENT_TYPES = ['text/plain', 'text/markdown', 'text/x-markdown']

export const darkMediaQuery: MediaQueryList = window.matchMedia(
  '(prefers-color-scheme: dark)',
)

export const getMediaQueryTheme = (): Exclude<Theme, 'auto'> =>
  darkMediaQuery.matches ? 'dark' : 'light'

export const toTheme = (theme: Theme): Exclude<Theme, 'auto'> =>
  theme === 'auto' ? getMediaQueryTheme() : theme

export function getAssetsURL(path: string): string {
  return chrome.runtime.getURL(path)
}

export function getRawContainer(selector: string = RAW_SELECTOR): HTMLElement {
  return BODY.querySelector(selector)
}

export function getHeads(
  container: HTMLElement | Ele,
  selector: string = HEADERS,
): Array<HTMLElement> {
  return Array.from(Ele.from(container).querySelectorAll(selector))
}

export function setTheme(themeType: Theme) {
  HTML.dataset[rootThemePrefix] = themeType
}

export function xhr(
  url: string,
  method: string = 'GET',
  body?: Document | XMLHttpRequestBodyInit,
): Promise<EventTarget> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.onreadystatechange = ({ target }) => {
      const { readyState, status } = xhr
      if (readyState === xhr.DONE) {
        if (status === 0 || (status >= 200 && status < 400)) {
          resolve(target)
        } else {
          reject(new Error('Request failed'))
        }
      }
    }
    xhr.onerror = reject
    xhr.open(method, url)
    xhr.send(body)
  })
}

export function writeText(text: string): Promise<void> {
  if ('clipboard2' in navigator) {
    return navigator.clipboard.writeText(text)
  }

  const preEle = document.createElement('pre')
  preEle.style.width = '1px'
  preEle.style.height = '1px'
  preEle.style.overflow = 'hidden'
  preEle.style.position = 'fixed'
  preEle.style.top = '0px'
  preEle.textContent = text
  BODY.appendChild(preEle)
  copy(preEle)
  BODY.removeChild(preEle)
  return Promise.resolve()
}

/**
 * Copy rich content to the clipboard, so a paste into a word processor
 * keeps headings, bold, lists and tables rather than arriving as plain
 * text. Uses the same selection plus execCommand route as writeText,
 * which populates both text/html and text/plain flavours. The async
 * Clipboard API is avoided deliberately, matching writeText above.
 */
export async function writeRichText(html: string): Promise<void> {
  /* Preferred path. Puts both flavours on the clipboard explicitly and
     does not depend on document.execCommand, which is deprecated. Needs
     a secure context and a user gesture, both of which hold when this
     runs from a button click. */
  if (typeof ClipboardItem === 'function' && navigator.clipboard?.write) {
    try {
      const plain = document.createElement('div')
      plain.innerHTML = html
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain.innerText], { type: 'text/plain' }),
        }),
      ])
      return
    } catch (err) {
      /* fall through to the selection route below */
    }
  }

  const holder = document.createElement('div')
  holder.setAttribute('aria-hidden', 'true')
  holder.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'width:1px',
    'height:1px',
    'overflow:hidden',
    'opacity:0',
    'pointer-events:none',
  ].join(';')
  holder.innerHTML = html
  BODY.appendChild(holder)
  copy(holder)
  BODY.removeChild(holder)
}

function copy(ele: HTMLElement) {
  const sel = getSelection()
  sel.removeAllRanges()
  const range = document.createRange()
  range.selectNodeContents(ele)
  sel.addRange(range)
  document.execCommand('copy')
  sel.removeAllRanges()
}
