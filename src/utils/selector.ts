export type HierarchySelector = {
  selector: string
  hierarchy: 'child' | 'parent' | 'either'
}

export type AssetInfoSelector = {
  node: {
    selector: string
    injectionMethod: 'append' | 'prepend'
  }
  link: HierarchySelector
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
  }
  return container.querySelector(selector) || container.closest(selector)
}
