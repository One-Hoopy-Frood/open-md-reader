import throttle from 'lodash.throttle'
import Event from '@/core/event'
import storage from '@/core/storage'
import Ele, { svg } from '@/core/ele'
import { initPlugins } from '@/plugins'
import lifecycle from '@/core/lifecycle'
import className from '@/config/class-name'
import type { Theme } from '@/config/page-themes'
import { getDefaultData, type Data } from '@/core/data'
import { mdRender, type MdOptions } from '@/core/markdown'
import {
  HEAD,
  getHeads,
  getRawContainer,
  setTheme,
  CONTENT_TYPES,
  darkMediaQuery,
  getMediaQueryTheme,
  toTheme,
  writeRichText,
} from '@/shared'
import codeIcon from '@/images/icon_code.svg'
import sideIcon from '@/images/icon_side.svg'
import goTopIcon from '@/images/icon_go_top.svg'
import copyIcon from '@/images/icon_copy.svg'
import successIcon from '@/images/icon_success.svg'
import printIcon from '@/images/icon_print.svg'
import '@/style/index.less'

function main(data: Data) {
  const configData = getDefaultData(data)
  const actions = {
    reload() {
      window.location.reload()
    },
    updateMdPlugins() {
      reloading = true
      if (mdRaw) {
        contentRender(mdRaw)
        renderSide()
      } else {
        window.location.reload()
      }
      reloading = false
    },
    updatePageTheme(theme: Theme, prevTheme: Theme) {
      setTheme(theme)
      renderContentByTheme(theme, prevTheme)
    },
    toggleRefresh(value) {
      clearTimeout(pollingTimer)
      value && polling()
    },
    toggleCentered(value) {
      mdContent.classList.toggle('centered', value)
    },
    toggleSide() {
      onToggleSide()
    },
    updateCustomCss(value: string) {
      applyCustomCss(value)
    },
    toggleForceCustomCss() {
      applyCustomCss(configData.customCss)
    },
  }
  /* Guards the listener below. Every action except 'reload' closes over
     state that only exists once main() gets past the early return, so
     dispatching before then throws a temporal dead zone error. */
  let initialized: boolean = false

  chrome.runtime.onMessage.addListener(({ action, data: { key, value } }) => {
    const oldValue = configData[key]
    configData[key] = value
    /* 'reload' is the action bound to the enable switch. It only calls
       window.location.reload, so it is safe and must still work while
       the extension is switched off, otherwise turning it back on could
       not take effect. */
    if (!initialized && action !== 'reload') {
      return
    }
    actions[action]?.(value, oldValue)
  })

  if (!configData.enable || !CONTENT_TYPES.includes(document.contentType)) {
    return
  }

  let pollingTimer: number = null
  let reloading: boolean = false
  let mdRaw: string = null
  let isSideHover: boolean = false
  let globalEvent: Event = new Event()
  let customStyleEle: HTMLStyleElement = null

  initPlugins({ event: globalEvent })

  /* init md page */
  setTheme(configData.pageTheme)
  applyCustomCss(configData.customCss)
  document.body.classList.toggle(
    className.SIDE_COLLAPSED,
    configData.hiddenSide,
  )

  const rawContainer = getRawContainer()
  lifecycle.init(rawContainer)
  mdRaw = rawContainer?.textContent

  /* render content */
  const mdContent = new Ele<HTMLElement>('article', {
    className: `${className.MD_CONTENT} ${
      configData.centered ? 'centered' : ''
    }`,
  })

  const mdRenderer =
    (target: HTMLElement | Ele) =>
    (code: string = '', options?: MdOptions) => {
      target.innerHTML = mdRender(code, {
        theme: toTheme(configData.pageTheme),
        plugins: configData.mdPlugins,
        ...options,
      })
      const ele = target instanceof Ele ? target.ele : target
      document.title = ele.querySelector('h1')?.textContent.trim() ?? ''
      globalEvent.emit(
        'contentRendered',
        target instanceof Ele ? target.ele : target,
      )
    }
  const contentRender = mdRenderer(mdContent)
  contentRender(mdRaw)

  mdContent.on(
    'click',
    async e => {
      globalEvent.emit('click', e.target)
    },
    true,
  )

  const mdBody = new Ele<HTMLElement>(
    'main',
    { className: className.MD_BODY },
    mdContent,
  )

  /* render side */
  const mdSide = new Ele<HTMLElement>('ul', { className: className.MD_SIDE })
  let idCache: { [content: string]: number } = Object.create(null)
  let headElements: HTMLElement[] = []
  let sideLiElements: HTMLElement[] = []
  let df: Ele<DocumentFragment> = null
  let targetIndex: number = null
  mdSide.on('mouseenter', () => {
    isSideHover = true
  })
  mdSide.on('mouseleave', () => {
    isSideHover = false
  })

  renderSide()
  document.addEventListener('scroll', throttle(onScroll, 100))

  /* render raw toggle button */
  const rawToggleBtn = new Ele<HTMLElement>(
    'button',
    {
      className: [className.MD_BUTTON, className.CODE_TOGGLE_BTN],
      title: 'Toggle raw',
    },
    svg(codeIcon),
  )
  rawToggleBtn.on('click', () => {
    lifecycle.toggleRaw([mdBody, mdSide])
  })

  /* render side expand button */
  const sideExpandBtn = new Ele<HTMLElement>(
    'button',
    {
      className: [className.MD_BUTTON, className.SIDE_EXPAND_BTN],
      title: 'Expand side',
    },
    svg(sideIcon),
  )
  sideExpandBtn.on('click', () => {
    chrome.runtime.sendMessage({
      action: 'storage',
      data: {
        key: 'hiddenSide',
        value: !configData.hiddenSide,
      },
    })
  })
  function onToggleSide() {
    if (window.innerWidth <= 960) {
      const value = document.body.classList.toggle(className.SIDE_EXPANDED)
      mdBody.off('click', foldSide, true)
      window.removeEventListener('resize', foldSide)
      document.removeEventListener('keydown', foldSide)
      if (value) {
        setTimeout(() => {
          mdBody.on('click', foldSide, { capture: true, once: true })
          window.addEventListener('resize', foldSide, { once: true })
          document.addEventListener('keydown', foldSide, { once: true })
        }, 0)
      }
    } else {
      configData.hiddenSide = document.body.classList.toggle(
        className.SIDE_COLLAPSED,
      )
    }
  }
  function foldSide(e: UIEvent) {
    if (e.type === 'keydown' && (e as KeyboardEvent).code !== 'Escape') {
      return
    }
    document.body.classList.remove(className.SIDE_EXPANDED)
    mdBody.off('click', foldSide, true)
    window.removeEventListener('resize', foldSide)
    document.removeEventListener('keydown', foldSide)
    e.stopPropagation()
    e.preventDefault()
    return false
  }
  /* render copy-formatted button */
  const copyContentBtn = new Ele<HTMLElement>(
    'button',
    {
      className: [className.MD_BUTTON, className.COPY_CONTENT_BTN],
      title: 'Copy formatted',
    },
    [
      svg(copyIcon, { className: 'icon-copy' }),
      svg(successIcon, { className: 'icon-success' }),
    ],
  )
  copyContentBtn.on('click', async () => {
    if (copyContentBtn.classList.contains('copied')) {
      return
    }
    /* Clone so the heading anchors and per-block copy buttons can be
       stripped without touching what is on screen. */
    const clone = mdContent.ele.cloneNode(true) as HTMLElement
    clone
      .querySelectorAll(
        `.${className.HEAD_ANCHOR}, .${className.COPY_BTN}, .${className.MD_BUTTON}`,
      )
      .forEach(node => node.remove())
    await writeRichText(clone.innerHTML)
    copyContentBtn.classList.add('copied')
    setTimeout(() => copyContentBtn.classList.remove('copied'), 1200)
  })

  /* render print button */
  const printBtn = new Ele<HTMLElement>(
    'button',
    {
      className: [className.MD_BUTTON, className.PRINT_BTN],
      title: 'Print',
    },
    svg(printIcon),
  )
  printBtn.on('click', () => window.print())

  /* render go top button */
  const goTopBtn = new Ele<HTMLElement>(
    'button',
    {
      className: [className.MD_BUTTON, className.GO_TOP_BTN],
      title: 'Go top',
    },
    svg(goTopIcon),
  )
  goTopBtn.hide()
  goTopBtn.on('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }))

  const buttonWrap = new Ele<HTMLElement>(
    'div',
    { className: className.BUTTON_WRAP_ELE },
    [sideExpandBtn, rawToggleBtn, copyContentBtn, printBtn, goTopBtn],
  )

  /* mount elements */
  lifecycle.mount([buttonWrap, mdBody, mdSide])
  updateAnchorPosition()

  darkMediaQuery.addEventListener('change', (e: MediaQueryListEvent) => {
    if (configData.pageTheme === 'auto') {
      renderContentByTheme(
        e.matches ? 'light' : 'dark',
        e.matches ? 'dark' : 'light',
      )
    }
  })

  /* auto refresh */
  if (configData.refresh) {
    polling()
  }

  /* everything the actions depend on now exists */
  initialized = true

  function polling() {
    void (function watch() {
      clearTimeout(pollingTimer)
      chrome.runtime.sendMessage({ action: 'fetch' }, res => {
        if (res !== undefined) {
          if (mdRaw === undefined || mdRaw === null) {
            if (res) {
              window.location.reload()
              return
            }
          } else if (mdRaw !== res) {
            mdRaw = res
            contentRender(res)
            renderSide()
            /* update raw content */
            setTimeout(() => {
              rawContainer.textContent = res
            }, 0)
          }
        }
        pollingTimer = setTimeout(watch, 500)
      })
    })()
  }

  function renderSide() {
    idCache = Object.create(null)
    headElements = getHeads(mdContent)
    df = new Ele<DocumentFragment>('#document-fragment')
    sideLiElements = headElements.reduce(handleHeadItem, [])
    mdSide.innerHTML = null
    mdSide.append(df)
    setTimeout(onScroll, 0)
  }

  function handleHeadItem(
    eleList: HTMLElement[],
    head: HTMLElement,
  ): HTMLElement[] {
    const content = String(head.textContent).trim()
    const encodeContent = getDecodeContent(content)

    head.setAttribute('id', encodeContent)

    const headAnchor = new Ele<HTMLElement>('a', {
      className: className.HEAD_ANCHOR,
      href: `#${encodeContent}`,
    })
    headAnchor.textContent = '#'
    head.insertBefore(headAnchor.ele, head.firstChild)

    const link = new Ele<HTMLElement>('a', {
      title: content,
      href: `#${encodeContent}`,
    })
    link.textContent = content
    const li = new Ele<HTMLElement>('li', {
      className: `${className.MD_SIDE}-${head.tagName.toLowerCase()}`,
    })
    eleList.push(li.ele)
    li.append(link)
    df.append(li.ele)

    return eleList
  }

  function getDecodeContent(content: string): string {
    return (function unique(key: string): string {
      if (key in idCache) {
        return unique(`${key}-${idCache[key]++}`)
      } else {
        idCache[key] = 1
        return key
      }
    })(encodeURIComponent(content.toLowerCase().replace(/\s+/g, '-')))
  }

  function onScroll() {
    const documentScrollTop = document.documentElement.scrollTop
    goTopBtn.toggle(documentScrollTop >= 640)

    headElements.some((_, index) => {
      let sectionHeight = -20
      const item = headElements[index + 1]
      if (item) {
        sectionHeight += item.offsetTop
      }

      const hit = sectionHeight <= 0 || sectionHeight > documentScrollTop

      if (hit && (targetIndex !== index || reloading)) {
        let target = sideLiElements[targetIndex]
        target && target.classList.remove(className.MD_SIDE_ACTIVE)

        target = sideLiElements[(targetIndex = index)]
        if (target) {
          target.classList.add(className.MD_SIDE_ACTIVE)
          if (!isSideHover && target.scrollIntoView) {
            target.scrollIntoView({ block: 'nearest' })
          }
        }
      }
      return hit
    })
  }

  function renderContentByTheme(theme: Theme, prevTheme: Theme) {
    if (configData.mdPlugins.includes('Mermaid')) {
      if (theme === 'auto' || prevTheme === 'auto') {
        const themeScheme = getMediaQueryTheme()
        if (theme !== themeScheme && prevTheme !== themeScheme) {
          contentRender(mdRaw)
          renderSide()
        }
      } else {
        contentRender(mdRaw)
        renderSide()
      }
    }
  }

  /* user stylesheet, injected last so it outranks the bundled theme */
  function applyCustomCss(css: string) {
    if (!customStyleEle) {
      if (!css) {
        return
      }
      customStyleEle = document.createElement('style')
      customStyleEle.setAttribute('data-md-reader-custom-css', '')
      HEAD.appendChild(customStyleEle)
    }
    /* Always reassign from source. Re-parsing clears any priority flags
       added on a previous pass, so toggling the option off really does
       drop back to normal declarations. */
    customStyleEle.textContent = css || ''
    if (configData.forceCustomCss) {
      forceImportant(customStyleEle.sheet)
    }
  }

  /* Raise every declaration in the user's stylesheet to important.
     Done through the CSSOM rather than by rewriting the text, so the
     browser has already parsed the CSS. That keeps semicolons inside
     quoted values, comments, and url() from breaking anything, and it
     reaches declarations nested inside @media, @supports, @layer, and
     native CSS nesting. */
  function forceImportant(sheet: CSSStyleSheet) {
    if (!sheet) {
      return
    }
    const walk = (rules: CSSRuleList) => {
      Array.from(rules).forEach((rule: CSSRule) => {
        if (rule instanceof CSSStyleRule) {
          const style = rule.style
          /* snapshot the names first, we are mutating as we iterate */
          Array.from(style).forEach(name => {
            if (!style.getPropertyPriority(name)) {
              style.setProperty(name, style.getPropertyValue(name), 'important')
            }
          })
        }
        /* grouping rules, and style rules that use CSS nesting, both
           carry child rules. Keyframe rules are deliberately skipped:
           they are not CSSStyleRule and a priority flag is invalid
           inside @keyframes. */
        const nested = (rule as CSSGroupingRule).cssRules
        if (nested) {
          walk(nested)
        }
      })
    }
    try {
      walk(sheet.cssRules)
    } catch (err) {
      /* cssRules can throw on a sheet the page is not allowed to read */
      console.warn('md-reader: could not force custom CSS priority', err)
    }
  }

  function updateAnchorPosition() {
    if (window.location.hash) {
      setTimeout(() => {
        const hash = window.location.hash.slice(1)
        const target = headElements.find(head => {
          return head.getAttribute('id') === hash
        })
        if (target) {
          const top = target.offsetTop
          top && window.scrollTo(0, top)
        }
      })
    }
  }
}

storage.get().then(main)
