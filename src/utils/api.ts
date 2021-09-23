import DataLoader from 'dataloader'
import { request, gql, GraphQLClient } from 'graphql-request'
import { RateLimit } from 'async-sema'

export type Rarities = {
  tokenCount: number
  tokens: {
    iteratorID: number
    rank: number
  }[]
}

export type Floor = {
  price: number
  floorSearchUrl: string
  currency: string
}

export type AssetInfo = {
  relayId: string
  tokenMetadata: string
}

const openSeaRateLimit = RateLimit(3)

const getOpenSeaHeaders = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['openSeaHeaders'], ({ openSeaHeaders }) => {
      resolve(openSeaHeaders)
    })
  })
}

const openSeaRequest = async (query: any, variables: any = {}) => {
  await openSeaRateLimit()
  let resp = null
  const headers = await getOpenSeaHeaders()
  try {
    resp = await retryingOpenSeaRequest(query, variables, headers)
  } catch (err: any) {
    if (err.response && err.response.data) {
      resp = err.response.data
    }
  }
  return resp
}

const refreshTokenQuery = gql`
  mutation RefreshToken {
    refreshToken {
      success
      accessToken
    }
  }
`

const tokenClient = new GraphQLClient('https://api.nonfungible.tools/graphql', {
  credentials: 'include',
  mode: 'cors',
})

let cachedAccessToken: string | null = null
const getAccessToken = async (refresh = false) => {
  if (!refresh) {
    if (cachedAccessToken) return cachedAccessToken

    const storedToken = await new Promise((resolve) =>
      chrome.storage.local.get(['accessToken'], ({ openSeaHeaders }) => {
        resolve(openSeaHeaders)
      }),
    )
    if (storedToken) {
      cachedAccessToken = storedToken as string
      return storedToken
    }
  }
  const {
    refreshToken: { accessToken },
  } = await tokenClient.request(refreshTokenQuery)

  chrome.storage.local.set({ accessToken })
  cachedAccessToken = accessToken

  return accessToken
}

const nonFungibleRequest = async (query: any, variables: any = {}) => {
  const accessToken = await getAccessToken()

  return request(
    'https://cdn.nonfungible.tools/graphql',
    query,
    variables,
    accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {},
  )
}

const retryingOpenSeaRequest = async (
  query: any,
  variables: any,
  headers: any,
  wait = 0,
): Promise<any> => {
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait))
  try {
    const resp = await request(
      'https://api.opensea.io/graphql/',
      query,
      variables,
      headers,
    )
    return resp
  } catch (err: any) {
    if (err.response?.status === 429) {
      const wait =
        +err.response.error.match(/Please wait (\d+) microseconds./)[1] / 1000
      return await retryingOpenSeaRequest(query, variables, headers, wait + 25)
    } else {
      throw err
    }
  }
}

const floorPriceLoader = new DataLoader(
  async (addresses: readonly string[]) => {
    const query = gql`
			query {
				${addresses.map(
          (address) => `
				  addr_${address}: collections(assetContractAddress: "${address}", first: 1) {
						edges {
							node {
								slug
								floorPrice
							}
						}
					}	
				`,
        )}
			}
		`
    const res = await openSeaRequest(query)
    return addresses.map((address) => {
      const response = res[`addr_${address}`]
      if (!response) return null
      const node = response.edges[0].node
      return {
        price: Math.round(node.floorPrice * 10000) / 10000,
        floorSearchUrl: `https://opensea.io/collection/${node.slug}?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW`,
        currency: 'ETH',
      }
    })
  },
  {
    batchScheduleFn: (callback) => setTimeout(callback, 250),
    maxBatchSize: 10,
  },
)

export const fetchFloorPrice = (address: string) => {
  return floorPriceLoader.load(address) as Promise<Floor>
}

const rarityLoader = new DataLoader(
  async (addresses: readonly string[]) => {
    // Max batch size is 1, we only use this for client side caching
    const address = addresses[0]
    try {
      const res = await nonFungibleRequest(rarityQuery, {
        address,
      })
      return [res.contract]
    } catch (e) {
      return [null]
    }
  },
  {
    batchScheduleFn: (callback) => setTimeout(callback, 250),
    maxBatchSize: 1,
  },
)

const rarityQuery = gql`
  query RarityQuery($address: String!) {
    contract(address: $address) {
      tokenCount
      tokens {
        iteratorID
        rank
      }
    }
  }
`

export const fetchRarities = async (address: string) => {
  return rarityLoader.load(address) as Promise<Rarities>
}

const assetLoader = new DataLoader(
  async (addressIdPairs: readonly string[]) => {
    const query = gql`
    query {
      ${addressIdPairs.map((addressIdPair) => {
        const [address, tokenId] = addressIdPair.split('_')
        return `
          addr_id_${addressIdPair}:  archetype(archetype: {assetContractAddress: "${address}", tokenId: "${tokenId}"}) {
            asset {
              relayId
              tokenMetadata
            }
          }
        `
      })}
    }
  `
    const res = await openSeaRequest(query)
    return addressIdPairs.map((addressIdPair) => {
      if (!res) return null
      const response = res[`addr_id_${addressIdPair}`]
      if (!response) return null
      return response.asset
    })
  },
  {
    // batchScheduleFn: (callback) => setTimeout(callback, 250),
    maxBatchSize: 10,
  },
)

export const fetchAssetInfo = (address: string, tokenId: string) => {
  return assetLoader.load(`${address}_${tokenId}`) as Promise<AssetInfo>
}

const userAssetsQuery = gql`
  query UserAssetsQuery(
    $userName: String
    $ensName: String
    $address: String
    $cursor: String
  ) {
    search(
      identity: { username: $userName, name: $ensName, address: $address }
      first: 100
      after: $cursor
    ) {
      edges {
        node {
          asset {
            assetContract {
              address
            }
          }
        }
      }
      totalCount
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`

export const fetchAllAssetsForUser = async ({
  userName,
  ensName,
  address,
  onPageFetched,
}: {
  userName?: string
  ensName?: string
  address?: string
  onPageFetched: (page: any[], count: number) => void
}) => {
  const selector = (() => {
    if (ensName) return { ensName }
    if (userName && userName !== 'Unnamed') return { userName }
    return { address }
  })()
  let hasNextPage = true
  let cursor = null
  let result: any[] = []
  while (hasNextPage) {
    const res: any = await openSeaRequest(userAssetsQuery, {
      cursor,
      ...selector,
    })
    hasNextPage = res.search.pageInfo.hasNextPage
    cursor = res.search.pageInfo.endCursor
    const assets = res.search.edges.map(({ node }: { node: any }) => node.asset)
    onPageFetched(assets, res.search.totalCount)
    result = result.concat(assets)
  }
  return result
}

const openSeaRefreshMetaDataMutation = gql`
  mutation RefreshMetadata($asset: AssetRelayID!) {
    assets {
      refresh(asset: $asset)
    }
  }
`

export const triggerOpenSeaMetadataRefresh = async (assetId: string) => {
  return openSeaRequest(openSeaRefreshMetaDataMutation, {
    asset: assetId,
  })
}
