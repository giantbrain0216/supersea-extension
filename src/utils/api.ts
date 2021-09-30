import DataLoader from 'dataloader'
import { request, gql, GraphQLClient } from 'graphql-request'
import { fetchMetadataUri } from '../utils/web3'
import { RateLimit, Sema } from 'async-sema'

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

export type Chain = 'ethereum' | 'polygon'

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

const accessTokenSema = new Sema(1)
let cachedAccessToken: string | null | undefined = undefined
export const getAccessToken = async (refresh = false) => {
  await accessTokenSema.acquire()
  if (!refresh) {
    if (cachedAccessToken !== undefined) {
      accessTokenSema.release()
      return cachedAccessToken
    }

    const storedToken = await new Promise((resolve) =>
      chrome.storage.local.get(['accessToken'], ({ accessToken }) => {
        resolve(accessToken)
      }),
    )
    if (storedToken) {
      cachedAccessToken = storedToken as string
      accessTokenSema.release()
      return storedToken
    }
  }
  const {
    refreshToken: { accessToken },
  } = await tokenClient.request(refreshTokenQuery)

  chrome.storage.local.set({ accessToken })
  cachedAccessToken = accessToken
  accessTokenSema.release()

  return accessToken
}

const nonFungibleRequest = async (
  query: any,
  variables: any = {},
  refreshAccessToken = false,
): Promise<any> => {
  const accessToken = await getAccessToken(refreshAccessToken)
  try {
    const res = await request(
      'https://cdn.nonfungible.tools/graphql',
      query,
      variables,
      accessToken
        ? {
            Authorization: accessToken,
          }
        : {},
    )
    return res
  } catch (err: any) {
    if (
      err?.response?.errors[0]?.message === 'Not Authorised!' &&
      !refreshAccessToken
    ) {
      return nonFungibleRequest(query, variables, true)
    }
    throw err
  }
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
  async (
    keys: readonly { address: string; tokenId: string; chain: Chain }[],
  ) => {
    const query = gql`
			query {
				${keys.map(
          ({ address, tokenId, chain }) => `
				  addr_${address}:  archetype(archetype: {assetContractAddress: "${address}", tokenId: "${tokenId}", chain: "${
            chain === 'polygon' ? 'MATIC' : ''
          }"}) {
            asset {
              collection {
                floorPrice
                slug
              }
            }
          }	
				`,
        )}
			}
		`
    const res = await openSeaRequest(query)
    return keys.map(({ address }) => {
      const response = res[`addr_${address}`]
      if (!response) return null
      const collection = response.asset.collection
      return {
        price: Math.round(collection.floorPrice * 10000) / 10000,
        floorSearchUrl: `https://opensea.io/collection/${collection.slug}?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW`,
        currency: 'ETH',
      }
    })
  },
  {
    batchScheduleFn: (callback) => setTimeout(callback, 250),
    maxBatchSize: 10,
    cacheKeyFn: ({ address }) => address,
  },
)

export const fetchFloorPrice = (params: {
  address: string
  tokenId: string
  chain: Chain
}) => {
  return floorPriceLoader.load(params) as Promise<Floor>
}

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

export const fetchRarities = async (address: string) => {
  return rarityLoader.load(address) as Promise<Rarities>
}

const isRankedQuery = gql`
  query IsRankedQuery($address: String!) {
    contract(address: $address) {
      isRanked
    }
  }
`

const isRankedLoader = new DataLoader(
  async (addresses: readonly string[]) => {
    // Max batch size is 1, we only use this for client side caching
    const address = addresses[0]
    try {
      const res = await nonFungibleRequest(isRankedQuery, {
        address,
      })
      return [res.contract.isRanked]
    } catch (e) {
      return [null]
    }
  },
  {
    batchScheduleFn: (callback) => setTimeout(callback, 250),
    maxBatchSize: 1,
  },
)

export const fetchIsRanked = async (address: string) => {
  return isRankedLoader.load(address) as Promise<boolean>
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

export const fetchAssetInfo = (address: string, tokenId: number) => {
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
            tokenId
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

const metadataQuery = gql`
  query GetMetadata($tokenMetadataInput: TokenMetadataInput!) {
    getTokenMetadata(input: $tokenMetadataInput) {
      data
      success
    }
  }
`

export const fetchMetadata = async (
  contractAddress: string,
  tokenId: number,
) => {
  try {
    const {
      getTokenMetadata: { data },
    } = await nonFungibleRequest(metadataQuery, {
      tokenMetadataInput: {
        contractAddress,
        tokenId,
      },
    })
    if (data) {
      return data
    }
  } catch (err) {}
  const assetInfo = await fetchAssetInfo(contractAddress, tokenId)
  return fetch(assetInfo?.tokenMetadata).then((res) => res.json())
}

export const fetchMetadataUriWithOpenSeaFallback = async (
  address: string,
  tokenId: number,
) => {
  const contractTokenUri = await fetchMetadataUri(address, tokenId)
  if (!contractTokenUri) {
    const assetInfo = await fetchAssetInfo(address, tokenId)
    return assetInfo?.tokenMetadata
  }
  return contractTokenUri.replace(/^ipfs:\/\//, 'https://ipfs.io/ipfs/')
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
