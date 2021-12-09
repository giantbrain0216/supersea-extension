export type HierarchySelector = {
  selector: string
  hierarchy: 'child' | 'parent' | 'either' | 'outside'
}

export type InjectionSelector = {
  selector: string
  injectionMethod: 'append' | 'prepend' | 'insertBefore' | 'insertAfter'
}

export type AssetInfoSelector = {
  node: InjectionSelector
  link: HierarchySelector
  collectionLink: HierarchySelector
  image: HierarchySelector
}

export type Selectors = {
  assetInfo: {
    grid: AssetInfoSelector
    list: AssetInfoSelector
    item: AssetInfoSelector
  }
  bundleVerification: {
    frameSelector: string
    linkSelector: string
    headerSelector: string
  }
  profileSummary: {
    accountTitleSelector: string
    accountEnsNameSelector: string
  }
  searchResults: {
    menuSelector: string
    containerSelector: string
    route: {
      url: string
      as: string
    }
  }
  listingNotifier: { node: InjectionSelector }
}

export const selectElement = (
  container: HTMLElement,
  config: HierarchySelector,
) => {
  const { selector, hierarchy } = config
  if (hierarchy === 'child') {
    return container.querySelector(selector)
  } else if (hierarchy === 'parent') {
    return container.closest(selector)
  } else if (hierarchy === 'outside') {
    return document.querySelector(selector)
  }
  return container.querySelector(selector) || container.closest(selector)
}

export const injectElement = (
  node: HTMLElement,
  child: HTMLElement,
  injectionMethod: InjectionSelector['injectionMethod'],
) => {
  if (injectionMethod === 'append') {
    node.appendChild(child)
  } else if (injectionMethod === 'prepend') {
    node.prepend(child)
  } else if (injectionMethod === 'insertBefore') {
    node.parentNode?.insertBefore(child, node)
  } else if (injectionMethod === 'insertAfter') {
    node.parentNode?.insertBefore(child, node.nextSibling)
  }
}
