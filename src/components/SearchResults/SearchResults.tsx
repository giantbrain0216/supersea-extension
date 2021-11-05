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
  fetchCollectionAddress,
  fetchRarities,
  Rarities,
} from '../../utils/api'
import SearchAsset from './SearchAsset'
import { HEIGHT as ASSET_INFO_HEIGHT, RARITY_TYPES } from '../AssetInfo'
import { useInView } from 'react-intersection-observer'
import Filters, { FiltersType } from './Filters'
import { weiToEth } from '../../utils/ethereum'

const PLACEHOLDER_TOKENS = _.times(40, (num) => ({
  iteratorID: num,
  rank: num,
}))
const LOAD_MORE_SCROLL_THRESHOLD = 600

const GridItem = ({
  renderPlaceholder,
  renderItem,
  onItemHidden,
}: {
  renderPlaceholder: () => React.ReactNode
  renderItem: (hideAsset: (hidden: boolean) => void) => React.ReactNode
  onItemHidden: () => void
}) => {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '500px',
  })
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (hidden) onItemHidden()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden])

  if (hidden) return null
  return (
    <div ref={ref}>
      {inView
        ? renderItem((hidden) => {
            setHidden(hidden)
          })
        : renderPlaceholder()}
    </div>
  )
}

const SearchResults = ({ collectionSlug }: { collectionSlug: string }) => {
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [tokens, setTokens] = useState<Rarities['tokens'] | null | undefined>()
  const [address, setAddress] = useState<string | null>(null)
  const [loadedItems, setLoadedItems] = useState(40)
  const [filters, setFilters] = useState<FiltersType>({
    status: [],
    priceRange: [undefined, undefined],
    highestRarity: 'Legendary',
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
      const address = await fetchCollectionAddress(collectionSlug)
      const rarities = await fetchRarities(address)
      unstable_batchedUpdates(() => {
        setAddress(address)
        setTokens(rarities ? rarities.tokens : null)
      })
    })()
  }, [collectionSlug])

  useEffect(() => {
    if (tokens && tokens.length <= loadedItems) return
    window.addEventListener('scroll', throttledLoadMore)
    window.addEventListener('resize', throttledLoadMore)
    return () => {
      window.removeEventListener('scroll', throttledLoadMore)
      window.removeEventListener('resize', throttledLoadMore)
    }
  }, [throttledLoadMore, tokens, loadedItems])

  const unranked = tokens === null || tokens?.length === 0
  const placeholderBorderColor = useColorModeValue('#e5e8eb', '#151b22')

  return (
    <HStack width="100%" alignItems="flex-start" position="relative">
      <Filters
        filters={filters}
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
      {unranked ? (
        <Flex width="100%" justifyContent="center" py="16" height="800px">
          <Text fontSize="2xl" opacity={0.75}>
            This collection has not been ranked yet
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
          {(tokens && address ? tokens : PLACEHOLDER_TOKENS)
            ?.filter(({ rank }, _, list) => {
              const rarityIndex = RARITY_TYPES.findIndex(
                ({ top }) => rank / list.length <= top,
              )
              const highestRarityIndex = RARITY_TYPES.findIndex(
                ({ name }) => name === filters.highestRarity,
              )
              return rarityIndex >= highestRarityIndex
            })
            .slice(0, loadedItems)
            .map(({ iteratorID }) => {
              return (
                <GridItem
                  key={`${iteratorID}_${filters.status.join(
                    ',',
                  )}_${filters.priceRange.join(',')}_${
                    tokens && address ? 'loaded' : 'loading'
                  }`}
                  onItemHidden={throttledLoadMore}
                  renderItem={(hideAsset) => (
                    <SearchAsset
                      address={address}
                      tokenId={String(iteratorID)}
                      hideAsset={hideAsset}
                      shouldHide={(asset) => {
                        if (
                          filters.status.includes('buyNow') &&
                          !asset.sell_orders?.length
                        ) {
                          return true
                        }

                        if (filters.priceRange[0] || filters.priceRange[1]) {
                          const matchesPriceRange =
                            asset.sell_orders?.length &&
                            weiToEth(+asset.sell_orders[0].current_price) >=
                              (filters.priceRange[0] || 0) &&
                            weiToEth(+asset.sell_orders[0].current_price) <=
                              (filters.priceRange[1] || 0)

                          if (!matchesPriceRange) return true
                        }

                        return false
                      }}
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
        </SimpleGrid>
      )}
    </HStack>
  )
}

export default SearchResults
