import {
  Box,
  SimpleGrid,
  HStack,
  Flex,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import _ from 'lodash'
import { useState, useEffect, useRef, useCallback } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import {
  Asset,
  fetchAsset,
  fetchCollectionAddress,
  fetchRaritiesWithTraits,
  Rarities,
  Trait,
} from '../../utils/api'
import SearchAsset from './SearchAsset'
import { HEIGHT as ASSET_INFO_HEIGHT } from '../AssetInfo/AssetInfo'
import { useInView } from 'react-intersection-observer'
import Filters, { FiltersType } from './Filters'
import { weiToEth } from '../../utils/ethereum'
import { determineRarityType, RARITY_TYPES } from '../../utils/rarity'

const PLACEHOLDER_TOKENS = _.times(40, (num) => ({
  iteratorID: num,
  rank: num,
  placeholder: true,
}))
const LOAD_MORE_SCROLL_THRESHOLD = 600

const GridItem = ({
  renderPlaceholder,
  renderItem,
}: {
  renderPlaceholder: () => React.ReactNode
  renderItem: () => React.ReactNode
}) => {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '500px',
  })

  return <div ref={ref}>{inView ? renderItem() : renderPlaceholder()}</div>
}

const SearchResults = ({ collectionSlug }: { collectionSlug: string }) => {
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [tokenCount, setTokenCount] = useState(0)
  const [tokens, setTokens] = useState<Rarities['tokens'] | null | undefined>()
  const [address, setAddress] = useState<string | null>(null)
  const [loadedItems, setLoadedItems] = useState(40)
  const [assetMap, setAssetMap] = useState<Record<string, Asset>>({})

  const loadingAssetMapRef = useRef<Record<string, boolean>>({})
  const [allTraits, setAllTraits] = useState<Trait[]>([])
  const [filters, setFilters] = useState<FiltersType>({
    status: [],
    priceRange: [undefined, undefined],
    highestRarity: 'Legendary',
    traits: [],
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledLoadMore = useCallback(
    _.throttle(() => {
      if (!gridRef.current) return
      const { bottom } = gridRef.current.getBoundingClientRect()
      if (
        bottom > 0 &&
        bottom - window.innerHeight <= LOAD_MORE_SCROLL_THRESHOLD
      ) {
        setLoadedItems((items) => items + 20)
      }
    }, 250),
    [],
  )

  useEffect(() => {
    ;(async () => {
      let fetchedAddress = ''
      if (!address) {
        fetchedAddress = await fetchCollectionAddress(collectionSlug)
      }
      const rarities = await fetchRaritiesWithTraits(
        address || fetchedAddress,
        filters.traits.map((val) => {
          const { groupName, value } = JSON.parse(val)
          return { key: groupName, value }
        }),
      )
      unstable_batchedUpdates(() => {
        if (fetchedAddress) {
          setAddress(fetchedAddress)
        }
        setTokens(rarities ? rarities.tokens : null)
        setTokenCount(rarities.tokenCount)
        if (rarities) {
          const groupVariants = _.groupBy(rarities.traits, 'trait_type')
          setAllTraits(
            rarities.traits.filter(({ trait_type }) => {
              return (
                !rarities.rankingOptions.excludeTraits.includes(trait_type) &&
                // Filter out trait types that have more variations than half the collection size,
                // since it likely won't be very interesting to filter by and clogs up the select list
                groupVariants[trait_type].length < rarities.tokenCount * 0.5
              )
            }),
          )
        }
      })
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionSlug, filters.traits])

  // Tokens filtered with data that we have _before_ fetching the asset
  const preFilteredTokens = (tokens && address ? tokens : PLACEHOLDER_TOKENS)
    ?.filter(({ rank }) => {
      const rarityType = determineRarityType(rank, tokenCount)
      if (!rarityType) return true
      const rarityIndex = RARITY_TYPES.findIndex(
        ({ name }) => rarityType.name === name,
      )
      const highestRarityIndex = RARITY_TYPES.findIndex(
        ({ name }) => name === filters.highestRarity,
      )
      return rarityIndex >= highestRarityIndex
    })
    .slice(0, loadedItems) as (Rarities['tokens'][number] & {
    placeholder: boolean
  })[]

  useEffect(() => {
    // Load assets
    if (!address) return
    const updateBatch: typeof assetMap = {}
    const batchUpdate = _.throttle(
      () => {
        setAssetMap((assetMap) => ({ ...assetMap, ...updateBatch }))
      },
      100,
      { leading: false },
    )
    preFilteredTokens.forEach(async ({ iteratorID, placeholder }) => {
      if (
        assetMap[iteratorID] ||
        loadingAssetMapRef.current[iteratorID] ||
        placeholder
      ) {
        return
      }
      loadingAssetMapRef.current[iteratorID] = true
      const asset = await fetchAsset(address, iteratorID)
      updateBatch[iteratorID] = asset
      batchUpdate()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, filters.highestRarity, loadedItems, tokenCount, tokens])

  // Tokens filtered with data that we have _after_ fetching the asset
  const postFilteredTokens = preFilteredTokens
    .map(({ iteratorID, placeholder }) => {
      return {
        tokenId: String(iteratorID),
        asset: placeholder ? null : assetMap[iteratorID],
        placeholder,
      }
    })
    .filter(({ asset }) => {
      if (!asset) return true
      if (
        filters.status.includes('buyNow') &&
        (!asset.sell_orders?.length ||
          asset.sell_orders[0].payment_token_contract.symbol === 'WETH')
      ) {
        return false
      }

      if (filters.priceRange[0] || filters.priceRange[1]) {
        const matchesPriceRange =
          asset.sell_orders?.length &&
          weiToEth(+asset.sell_orders[0].current_price) >=
            (filters.priceRange[0] || 0) &&
          weiToEth(+asset.sell_orders[0].current_price) <=
            (filters.priceRange[1] || Infinity)

        if (!matchesPriceRange) return false
      }

      return true
    })

  useEffect(() => {
    if (tokens && tokens.length <= loadedItems) return
    window.addEventListener('scroll', throttledLoadMore)
    window.addEventListener('resize', throttledLoadMore)
    return () => {
      window.removeEventListener('scroll', throttledLoadMore)
      window.removeEventListener('resize', throttledLoadMore)
    }
  }, [throttledLoadMore, tokens, loadedItems])

  useEffect(() => {
    if (tokens && tokens.length <= loadedItems) return
    throttledLoadMore()
  }, [
    throttledLoadMore,
    assetMap,
    filters.priceRange,
    filters.status,
    tokens,
    loadedItems,
  ])

  const placeholderBorderColor = useColorModeValue('#e5e8eb', '#151b22')

  return (
    <HStack width="100%" alignItems="flex-start" position="relative">
      <Filters
        filters={filters}
        allTraits={allTraits}
        onApplyFilters={(appliedFilters) => {
          unstable_batchedUpdates(() => {
            setFilters(appliedFilters)
            setLoadedItems(40)
            if (appliedFilters.traits !== filters.traits) {
              setTokens(undefined)
            }
          })
        }}
        showSearchProgress={
          filters.status.length > 0 ||
          filters.priceRange[0] !== undefined ||
          filters.priceRange[1] !== undefined
        }
        searchNumber={loadedItems}
      />
      {tokens === null || tokens?.length === 0 ? (
        <Flex width="100%" justifyContent="center" py="16" height="800px">
          <Text fontSize="2xl" opacity={0.75}>
            {filters.traits.length
              ? 'No items matching filters available'
              : 'This collection has not been ranked yet'}
          </Text>
        </Flex>
      ) : (
        <SimpleGrid
          minChildWidth="175px"
          spacing="4"
          px="4"
          py="4"
          width="100%"
          ref={gridRef}
        >
          {postFilteredTokens.map(({ tokenId, asset, placeholder }) => {
            return (
              <GridItem
                key={`${tokenId}${placeholder ? '_placeholder' : ''}`}
                renderItem={() => (
                  <SearchAsset
                    address={address}
                    tokenId={tokenId}
                    asset={asset}
                  />
                )}
                renderPlaceholder={() => (
                  <Box
                    paddingBottom={ASSET_INFO_HEIGHT}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={placeholderBorderColor}
                  >
                    <Box css={{ aspectRatio: '1' }} width="100%" />
                    <Box height="80px" />
                  </Box>
                )}
              />
            )
          })}
          {postFilteredTokens.length < 10
            ? _.times(10 - postFilteredTokens.length, (i) => {
                return (
                  <Box paddingBottom={ASSET_INFO_HEIGHT} key={i}>
                    <Box css={{ aspectRatio: '1' }} width="100%" />
                    <Box height="80px" />
                  </Box>
                )
              })
            : null}
        </SimpleGrid>
      )}
    </HStack>
  )
}

export default SearchResults
