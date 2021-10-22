import _ from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import queryString from 'query-string'
import AppProvider from './components/AppProvider'
import BundleVerification from './components/BundleVerification'
import AssetInfo from './components/AssetInfo'
import ProfileSummary from './components/ProfileSummary'
import GlobalStyles from './components/GlobalStyles'
import { ExtensionConfig, getExtensionConfig } from './utils/extensionConfig'
import { fetchGlobalCSS, fetchSelectors } from './utils/api'
import { selectElement, Selectors } from './utils/selector'
import SearchResults from './components/SearchResults/SearchResults'
import CollectionMenuItem from './components/CollectionMenuItem'

const NODE_PROCESSED_DATA_KEY = '__SuperSea__Processed'

const addGlobalStyle = () => {
  const globalContainer = document.createElement('div')
  document.body.appendChild(globalContainer)
  injectReact(<GlobalStyles />, globalContainer)
  fetchGlobalCSS().then((css) => {
    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)
  })
}

const injectAssetInfo = async () => {
  const selectors = await fetchSelectors()

  const gridNodes = Array.from(
    document.querySelectorAll(selectors.assetInfo.grid.node.selector),
  )
  const listNodes = Array.from(
    document.querySelectorAll(selectors.assetInfo.list.node.selector),
  )
  const itemNode = document.querySelector(
    selectors.assetInfo.item.node.selector,
  )

  const nodes = [
    ...gridNodes.map((node) => ({
      node,
      type: 'grid',
      selectorConfig: selectors.assetInfo.grid,
    })),
    ...listNodes.map((node) => ({
      node,
      type: 'list',
      selectorConfig: selectors.assetInfo.list,
    })),
    ...(itemNode
      ? [
          {
            node: itemNode,
            type: 'item',
            selectorConfig: selectors.assetInfo.item,
          },
        ]
      : []),
  ] as {
    node: HTMLElement
    type: React.ComponentProps<typeof AssetInfo>['type']
    selectorConfig: Selectors['assetInfo'][keyof Selectors['assetInfo']]
  }[]

  nodes.forEach(({ node, type, selectorConfig }) => {
    if (node.dataset[NODE_PROCESSED_DATA_KEY]) return
    node.dataset[NODE_PROCESSED_DATA_KEY] = '1'

    const { address, tokenId, chain } = (() => {
      if (type === 'item') {
        const path = window.location.pathname.split('/')
        const [tokenType, address, tokenId] = path.slice(-3)
        return {
          address: address.toLowerCase(),
          tokenId: tokenId,
          chain:
            tokenType === 'matic'
              ? ('polygon' as const)
              : ('ethereum' as const),
        }
      }
      let link = selectElement(node, selectorConfig.link)
      if (link) {
        const [tokenType, address, tokenId] =
          link
            .getAttribute('href')
            ?.split('/')
            .filter((s) => s.length)
            .slice(-3) || []

        return {
          address,
          tokenId,
          chain:
            tokenType === 'matic'
              ? ('polygon' as const)
              : ('ethereum' as const),
        }
      }
      return {}
    })()
    if (!(address && tokenId && chain)) return

    const container = document.createElement('div')
    container.classList.add('SuperSea__AssetInfo')
    container.classList.add(`SuperSea__AssetInfo--${type}`)
    container.classList.add('SuperSea__AssetInfo--Unrendered')
    if (selectorConfig.node.injectionMethod === 'prepend') {
      node.prepend(container)
    } else {
      node.append(container)
    }
    container.dataset['address'] = address
    container.dataset['tokenId'] = tokenId
    container.dataset['chain'] = chain
    container.dataset['type'] = type
  })
}

let injectedReactContainers: ReactDOM.Container[] = []
const injectReact = (
  content: React.ReactElement,
  target: ReactDOM.Container,
  callback?: () => void,
) => {
  injectedReactContainers.push(target)
  ReactDOM.render(<AppProvider>{content}</AppProvider>, target, callback)
}

let cleanupActive = true
const destroyRemovedInjections = () => {
  window.requestIdleCallback(() => {
    if (!cleanupActive) return
    injectedReactContainers = injectedReactContainers.filter((container) => {
      if (!document.body.contains(container)) {
        ReactDOM.unmountComponentAtNode(container as Element)
        return false
      }
      return true
    })
  })
}

const injectBundleVerification = async () => {
  const selectors = await fetchSelectors()
  const bundleFrames = Array.from(
    document.querySelectorAll(selectors.bundleVerification.frameSelector),
  ) as HTMLElement[]

  bundleFrames.forEach((bundleFrame) => {
    if (!bundleFrame || bundleFrame.dataset[NODE_PROCESSED_DATA_KEY]) return

    bundleFrame.dataset[NODE_PROCESSED_DATA_KEY] = '1'
    const assets = Array.from(
      bundleFrame.querySelectorAll(selectors.bundleVerification.linkSelector),
    ) as HTMLAnchorElement[]
    if (assets.length) {
      const addresses = _.groupBy(
        assets,
        // @ts-ignore
        (asset) => asset.attributes.href.value.split('/')[2],
      )
      const numAddresses = Object.keys(addresses).length

      const header = bundleFrame.querySelector(
        selectors.bundleVerification.headerSelector,
      )
      if (header) {
        const container = document.createElement('div')
        container.classList.add('SuperSea__BundleVerification')
        header.parentNode?.insertBefore(container, header.nextSibling)
        injectReact(
          <BundleVerification numAddresses={numAddresses} />,
          container,
        )
      }
    }
  })
}

const injectProfileSummary = async () => {
  const selectors = await fetchSelectors()
  const accountTitle = document.querySelector(
    selectors.profileSummary.accountTitleSelector,
  ) as HTMLElement
  const accountBanner = accountTitle?.parentElement

  if (!accountBanner || accountBanner.dataset[NODE_PROCESSED_DATA_KEY]) return

  const userName = accountTitle.innerText
  const ensName = (accountBanner.querySelector(
    selectors.profileSummary.accountEnsNameSelector,
  ) as HTMLElement | null)?.innerText
  const addressSlug = window.location.pathname.split('/')[1]
  const address =
    addressSlug === 'account'
      ? (window as any).ethereum?.selectedAddress
      : addressSlug
  accountBanner.dataset[NODE_PROCESSED_DATA_KEY] = '1'
  const container = document.createElement('div')
  accountBanner.appendChild(container)
  injectReact(
    <ProfileSummary userName={userName} address={address} ensName={ensName} />,
    container,
  )
}

const throttledInjectAssetInfo = _.throttle(injectAssetInfo, 250)
const throttledInjectBundleVerification = _.throttle(
  injectBundleVerification,
  250,
)
const throttledInjectProfileSummary = _.throttle(injectProfileSummary, 250)
const throttledDestroyRemovedInjections = _.throttle(
  destroyRemovedInjections,
  1000,
)

const injectInPageContextScript = () => {
  const s = document.createElement('script')
  s.src = chrome.runtime.getURL('static/js/pageContextInject.js')
  document.head.appendChild(s)
  s.onload = function () {
    s.remove()
  }
}

const injectSearchResults = async () => {
  const selectors = await fetchSelectors()
  const container = document.querySelector(
    selectors.searchResults.containerSelector,
  )!.parentElement as HTMLElement | null
  if (container) {
    const collectionMenu = document.querySelector(
      selectors.searchResults.menuSelector,
    ) as HTMLElement | null
    if (collectionMenu) {
      collectionMenu.classList.add('SuperSea--tabActive')
    }
    const reactContainer = document.createElement('div')
    container.classList.add('SuperSea__SearchResults')
    container.replaceWith(reactContainer)
    cleanupActive = false

    const messageListener = (event: MessageEvent) => {
      if (event.data.method === 'SuperSea__Next__routeChangeComplete') {
        reactContainer.replaceWith(container)
        if (collectionMenu) {
          collectionMenu.classList.remove('SuperSea--tabActive')
        }
        window.removeEventListener('message', messageListener)
        cleanupActive = true
      }
    }

    window.addEventListener('message', messageListener)
    const collectionSlug = window.location.pathname
      .split('/')
      .filter(Boolean)
      .pop()

    injectReact(
      <SearchResults collectionSlug={collectionSlug!} />,
      reactContainer,
    )
  }
}

const injectCollectionMenu = async () => {
  const selectors = await fetchSelectors()
  const collectionMenu = document.querySelector(
    selectors.searchResults.menuSelector,
  ) as HTMLElement | null
  if (collectionMenu && !collectionMenu.dataset[NODE_PROCESSED_DATA_KEY]) {
    collectionMenu.dataset[NODE_PROCESSED_DATA_KEY] = '1'
    const container = document.createElement('li')
    container.classList.add('SuperSea__CollectionMenuItem')
    container.classList.add('SuperSea__CollectionMenuItem--items')
    collectionMenu.append(container)
    injectReact(
      <CollectionMenuItem
        type="items"
        onClick={() => {
          const collectionSlug = window.location.pathname
            .split('/')
            .filter(Boolean)
            .pop()
          window.postMessage({
            method: 'SuperSea__Navigate',
            params: {
              url: `/collection?collectionSlug=${collectionSlug}&tab=supersea`,
              as: `/collection/${collectionSlug}?tab=supersea`,
              options: {
                scroll: false,
              },
            },
          })
        }}
      />,
      container,
    )
  }
}

const throttledInjectCollectionMenu = _.throttle(injectCollectionMenu, 250)

const setupInjections = async () => {
  injectBundleVerification()
  injectAssetInfo()
  injectProfileSummary()
  injectCollectionMenu()

  const observer = new MutationObserver(() => {
    throttledInjectBundleVerification()
    throttledInjectAssetInfo()
    throttledInjectProfileSummary()
    throttledInjectCollectionMenu()
    throttledDestroyRemovedInjections()
  })

  observer.observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
  })
}

const setupAssetInfoRenderer = () => {
  const render = () => {
    try {
      const selectedNodes = document.querySelectorAll(
        '.SuperSea__AssetInfo--Unrendered',
      )
      if (selectedNodes.length !== 0) {
        const nodes = [...Array.from(selectedNodes)] as HTMLElement[]
        nodes.forEach((node: HTMLElement) => {
          const { address, tokenId, chain, type } = node.dataset as any
          injectReact(
            <AssetInfo
              address={address}
              tokenId={tokenId}
              chain={chain}
              type={type}
              container={node.parentElement!}
            />,
            node,
          )
          node.classList.remove('SuperSea__AssetInfo--Unrendered')
        })
      }
    } catch (err) {
      console.error('AssetInfo inject error', err)
    }
    setTimeout(() => {
      window.requestIdleCallback(render, { timeout: 500 })
    }, 250)
  }
  window.requestIdleCallback(render, { timeout: 500 })
}

const setupSearchResultsTab = () => {
  const query = queryString.parse(window.location.search)
  if (query.tab === 'supersea') {
    injectSearchResults()
  }
  window.addEventListener('message', (event) => {
    if (event.data.method === 'SuperSea__Next__routeChangeComplete') {
      const query = queryString.parse(event.data.params.url.split('?')[1])
      if (query.tab === 'supersea') {
        injectSearchResults()
      }
    }
  })
}

// We need to keep the background script alive for webRequest handlers
const setupKeepAlivePing = () => {
  setInterval(() => {
    chrome.runtime.sendMessage({
      method: 'ping',
    })
  }, 5000)
}

const initialize = async () => {
  const config = await getExtensionConfig()
  if (config.enabled) {
    setupInjections()
    setupKeepAlivePing()
    addGlobalStyle()
    setupAssetInfoRenderer()
    setupSearchResultsTab()
    injectInPageContextScript()
  }
}

initialize()
