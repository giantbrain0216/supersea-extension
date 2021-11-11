import {
  Box,
  SimpleGrid,
  HStack,
  Flex,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import _ from 'lodash'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
import { HEIGHT as ASSET_INFO_HEIGHT, RARITY_TYPES } from '../AssetInfo'
import { useInView } from 'react-intersection-observer'
import Filters, { FiltersType } from './Filters'
import { weiToEth } from '../../utils/ethereum'
import { VALUE_DIVIDER } from './TraitSelect'

const PLACEHOLDER_TOKENS = _.times(40, (num) => ({
  iteratorID: num,
  rank: num,
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
      if (tokens && tokens.length <= loadedItems) return
      if (!gridRef.current) return
      const { bottom } = gridRef.current.getBoundingClientRect()
      if (bottom - window.innerHeight <= LOAD_MORE_SCROLL_THRESHOLD) {
        setLoadedItems((items) => items + 20)
      }
    }),
    [tokens, loadedItems],
  )

  useEffect(() => {
    ;(async () => {
      unstable_batchedUpdates(() => {
        setTokens(undefined)
        setLoadedItems(40)
      })
      const address = await fetchCollectionAddress(collectionSlug)
      const rarities = await fetchRaritiesWithTraits(
        address,
        filters.traits.map((val) => {
          const [key, value] = val.split(VALUE_DIVIDER)
          return { key, value }
        }),
      )
      unstable_batchedUpdates(() => {
        setAddress(address)
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
  }, [collectionSlug, filters.traits])

  // Tokens filtered with data that we have _before_ fetching the asset
  const preFilteredTokens = useMemo(
    () =>
      (tokens && address ? tokens : PLACEHOLDER_TOKENS)
        ?.filter(({ rank }, _) => {
          const rarityIndex = RARITY_TYPES.findIndex(
            ({ top }) => rank / tokenCount <= top,
          )
          const highestRarityIndex = RARITY_TYPES.findIndex(
            ({ name }) => name === filters.highestRarity,
          )
          return rarityIndex >= highestRarityIndex
        })
        .slice(0, loadedItems),
    [address, filters.highestRarity, loadedItems, tokenCount, tokens],
  )

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
    preFilteredTokens.forEach(async ({ iteratorID }) => {
      if (assetMap[iteratorID] || loadingAssetMapRef.current[iteratorID]) return
      loadingAssetMapRef.current[iteratorID] = true
      const asset = await fetchAsset(address, iteratorID)
      updateBatch[iteratorID] = asset
      batchUpdate()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preFilteredTokens, address])

  // Tokens filtered with data that we have _after_ fetching the asset
  const postFilteredTokens = preFilteredTokens
    .map(({ iteratorID }) => {
      return {
        tokenId: String(iteratorID),
        asset: assetMap[iteratorID],
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
            (filters.priceRange[1] || 0)

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

  useEffect(throttledLoadMore, [
    throttledLoadMore,
    assetMap,
    filters.priceRange,
    filters.status,
  ])

  const placeholderBorderColor = useColorModeValue('#e5e8eb', '#151b22')

  return (
    <HStack width="100%" alignItems="flex-start" position="relative">
      <Filters
        filters={filters}
        allTraits={allTraits}
        onApplyFilters={(appliedFilters) => {
          setFilters(appliedFilters)
          setLoadedItems(40)
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
          {postFilteredTokens.map(({ tokenId, asset }) => {
            return (
              <GridItem
                key={tokenId}
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
