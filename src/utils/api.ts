import DataLoader from 'dataloader'
import { request, gql, GraphQLClient } from 'graphql-request'
import { fetchMetadataUri } from '../utils/web3'
import { RateLimit, Sema } from 'async-sema'
import { User } from './user'
import lastKnownInjectionSelectors from '../assets/lastKnownInjectionSelectors.json'
import { Selectors } from './selector'

const OPENSEA_SHARED_CONTRACT_ADDRESSES = [
  '0x495f947276749ce646f68ac8c248420045cb7b5e',
  '0x2953399124f0cbb46d2cbacd8a89cf0599974963',
]
// Not exactly right but good enough to split tokenIds into their unique collections
const OPENSEA_SHARED_CONTRACT_COLLECTION_ID_LENGTH = 60

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

export type Asset = {
  name: string
  collection: {
    name: string
  }
  image_url: string
  last_sale: {
    total_price: string
    payment_token: {
      symbol: 'ETH' | 'WETH'
    }
  }
  sell_orders: {
    current_price: string
    payment_token_contract: {
      symbol: 'ETH' | 'WETH'
    }
  }[]
}

export type Chain = 'ethereum' | 'polygon'

const REMOTE_ASSET_BASE = 'https://nonfungible.tools/supersea'

const openSeaSema = new Sema(3)
const openSeaRateLimit = RateLimit(3)
const openSeaPublicRateLimit = RateLimit(3)

let selectorsPromise: null | Promise<Selectors> = null
export const fetchSelectors = () => {
  if (!selectorsPromise) {
    // Fallback to last known selectors if request takes more than 5 seconds
    selectorsPromise = Promise.race<Promise<Selectors>>([
      fetch(`${REMOTE_ASSET_BASE}/injectionSelectors.json`).then((res) =>
        res.json(),
      ),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 5000)
      }),
    ]).catch((err) => {
      console.error(err)
      return lastKnownInjectionSelectors as Selectors
    })
  }
  return selectorsPromise
}

export const fetchGlobalCSS = () => {
  return fetch(`${REMOTE_ASSET_BASE}/styleOverrides.css`).then((res) =>
    res.text(),
  )
}

const getOpenSeaHeaders = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['openSeaHeaders'], ({ openSeaHeaders }) => {
      resolve(openSeaHeaders)
    })
  })
}

const openSeaRequest = async (query: any, variables: any = {}) => {
  await openSeaSema.acquire()
  await openSeaRateLimit()
  let res = null
  const headers = (await getOpenSeaHeaders()) as any
  try {
    res = fetch('https://api.opensea.io/graphql/batch/', {
      headers: {
        ...headers,
        'content-type': 'application/json',
        'X-SIGNED-QUERY': 'SuperSea',
      },
      body: JSON.stringify([{ id: 'batchQuery', query: query, variables }]),
      method: 'POST',
    })
      .then((res) => res.json())
      .then((json) => json[0]?.data)
  } catch (err: any) {
    if (err.response && err.response.data) {
      res = err.response.data
    }
  }
  chrome.storage.local.get(
    ['openSeaRateLimitRemaining'],
    ({ openSeaRateLimitRemaining }) => {
      if (openSeaRateLimitRemaining > 10) {
        openSeaSema.release()
      } else {
        setTimeout(() => {
          openSeaSema.release()
        }, 2500)
      }
    },
  )
  return res
}

const refreshTokenQuery = gql`
  mutation RefreshToken {
    refreshToken {
      success
      accessToken
      account {
        role
      }
    }
  }
`

const tokenClient = new GraphQLClient('https://api.nonfungible.tools/graphql', {
  credentials: 'include',
  mode: 'cors',
})

const userSema = new Sema(1)
let cachedUser:
  | { accessToken: string; role: User['role'] }
  | null
  | undefined = undefined
export const getUser = async (refresh = false) => {
  await userSema.acquire()
  if (!refresh) {
    if (cachedUser !== undefined) {
      userSema.release()
      return cachedUser
    }
  }
  const {
    refreshToken: { accessToken, account },
  } = await tokenClient.request(refreshTokenQuery)

  cachedUser = { accessToken, role: account?.role || 'FREE' }
  userSema.release()

  return cachedUser
}

const nonFungibleRequest = async (
  query: any,
  variables: any = {},
  refreshAccessToken = false,
): Promise<any> => {
  const user = await getUser(refreshAccessToken)
  const accessToken = user?.accessToken
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

const floorPriceLoader = new DataLoader(
  async (
    keys: readonly { address: string; tokenId: string; chain: Chain }[],
  ) => {
    const query = gql`
			query batchQuery {
				${keys.map(
          ({ address, tokenId, chain }) => `
				  addr_${address}_${tokenId}:  archetype(archetype: {assetContractAddress: "${address}", tokenId: "${tokenId}", chain: "${
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
    return keys.map(({ address, tokenId }) => {
      const response = res[`addr_${address}_${tokenId}`]
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
    cacheKeyFn: ({ address, tokenId }) => {
      if (OPENSEA_SHARED_CONTRACT_ADDRESSES.includes(address))
        return `${address}/${tokenId.slice(
          0,
          OPENSEA_SHARED_CONTRACT_COLLECTION_ID_LENGTH,
        )}`
      return address
    },
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
      contractAddress
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
      contractAddress
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
    // Assume all are for the same address for now
    const address = addressIdPairs[0].split('_')[0]
    const tokenIds = addressIdPairs.map((pair) => pair.split('_')[1])
    await openSeaPublicRateLimit()
    const res = await fetch(
      `https://api.opensea.io/api/v1/assets?asset_contract_address=${address}&token_ids=${tokenIds.join(
        '&token_ids=',
      )}`,
    ).then((res) => res.json())
    return addressIdPairs.map((addressIdPair) => {
      if (!res) return null
      const tokenId = addressIdPair.split('_')[1]
      const asset = res.assets.find(
        ({ token_id }: { token_id: string }) => token_id === tokenId,
      )
      if (!asset) return null
      return asset
    })
  },
  {
    batchScheduleFn: (callback) => setTimeout(callback, 500),
    maxBatchSize: 20,
  },
)

export const fetchAsset = (address: string, tokenId: number) => {
  return assetLoader.load(`${address}_${tokenId}`) as Promise<Asset>
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

const fetchAllAssetsRateLimit = RateLimit(3)
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
    await fetchAllAssetsRateLimit()
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
  const query = gql`
    query {
      archetype(archetype: {assetContractAddress: "${contractAddress}", tokenId: "${tokenId}"}) {
        asset {
          tokenMetadata
        }
      }
    }
  `
  const res = await openSeaRequest(query)
  return res.archetype.asset.tokenMetadata
}

export const fetchMetadataUriWithOpenSeaFallback = async (
  address: string,
  tokenId: number,
) => {
  const contractTokenUri = await fetchMetadataUri(address, tokenId)
  if (!contractTokenUri) {
    const query = gql`
      query {
        archetype(archetype: {assetContractAddress: "${address}", tokenId: "${tokenId}"}) {
          asset {
            tokenMetadata
          }
        }
      }
    `
    const res = await openSeaRequest(query)
    return res.archetype.asset.tokenMetadata
  }
  return contractTokenUri.replace(/^ipfs:\/\//, 'https://ipfs.io/ipfs/')
}

const refreshLoader = new DataLoader(
  async (addressIdPairs: readonly string[]) => {
    const query = gql`
      query {
        ${addressIdPairs.map((addressIdPair) => {
          const [address, tokenId] = addressIdPair.split('_')
          return `
            addr_id_${addressIdPair}:  archetype(archetype: {assetContractAddress: "${address}", tokenId: "${tokenId}"}) {
              asset {
                relayId
              }
            }
          `
        })}
      }
    `
    const res = await openSeaRequest(query)
    const mutation = gql`
      mutation {
        assets {
          ${addressIdPairs.map((addressIdPair) => {
            const response = res[`addr_id_${addressIdPair}`]
            const relayId = response.asset.relayId
            return `
              addr_id_${addressIdPair}: refresh(asset: "${relayId}") 
            `
          })}
        }
      }
    `
    const mutationRes = await openSeaRequest(mutation)
    return addressIdPairs.map((addressIdPair) => {
      if (!mutationRes) return null
      const response = mutationRes.assets[`addr_id_${addressIdPair}`]
      return response
    })
  },
  {
    batchScheduleFn: (callback) => setTimeout(callback, 1500),
    maxBatchSize: 10,
  },
)

export const triggerOpenSeaMetadataRefresh = async (
  address: string,
  tokenId: string,
) => {
  return refreshLoader.load(`${address}_${tokenId}`) as Promise<Boolean>
}

export const fetchCollectionAddress = async (slug: string) => {
  const data = await fetch(
    `https://api.opensea.io/api/v1/assets?limit=1&collection=${slug}`,
  ).then((res) => res.json())
  return data.assets[0].asset_contract.address
}
