import {
  Box,
  SimpleGrid,
  HStack,
  Flex,
  VStack,
  Divider,
  Text,
  Select,
  useColorModeValue,
} from '@chakra-ui/react'
import _ from 'lodash'
import { useState, useEffect, useRef } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import {
  fetchCollectionAddress,
  fetchRarities,
  Rarities,
} from '../../utils/api'
import SearchAsset from './SearchAsset'
import { HEIGHT as ASSET_INFO_HEIGHT, RARITY_TYPES } from '../AssetInfo'
import { useInView } from 'react-intersection-observer'
import ButtonOptions from '../ButtonOptions'
import Logo from '../Logo'

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
  renderItem: (hideAsset: (hidden: boolean) => void) => React.ReactNode
}) => {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '500px',
  })
  const [hidden, setHidden] = useState(false)
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
  const [statusFilters, setStatusFilters] = useState<'buyNow'[]>([])
  const [highestRarity, setHighestRarity] = useState('Legendary')

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
    const listener = _.throttle(() => {
      if (!gridRef.current) return
      const { bottom } = gridRef.current.getBoundingClientRect()
      if (bottom - window.innerHeight <= LOAD_MORE_SCROLL_THRESHOLD) {
        setLoadedItems((items) => items + 20)
      }
    }, 200)
    window.addEventListener('scroll', listener)
    window.addEventListener('resize', listener)
    return () => {
      window.removeEventListener('scroll', listener)
      window.removeEventListener('resize', listener)
    }
  }, [loadedItems, tokens])

  const unranked = tokens === null || tokens?.length === 0
  const placeholderBorderColor = useColorModeValue('#e5e8eb', '#151b22')

  return (
    <HStack width="100%" alignItems="flex-start" position="relative">
      <Box
        width="340px"
        flex="0 0 340px"
        p="4"
        pb="130px"
        position="sticky"
        top="72px"
        background={useColorModeValue('#fbfdff', '#262b2f')}
        borderColor="transparent"
        borderWidth="1px"
        borderRightColor={placeholderBorderColor}
        borderBottomColor={placeholderBorderColor}
        borderBottomRightRadius="lg"
        overflow="hidden"
      >
        <VStack spacing="8" alignItems="flex-start">
          <VStack
            spacing="3"
            divider={
              <Divider
                borderColor={useColorModeValue('gray.300', 'whiteAlpha.200')}
              />
            }
            alignItems="flex-start"
            width="100%"
          >
            <Text fontWeight="500">Status</Text>
            <ButtonOptions
              width="100%"
              columns="2"
              options={[{ name: 'buyNow' as const, label: 'Buy Now' }]}
              active={statusFilters}
              onChange={(active) => setStatusFilters(active)}
            />
          </VStack>
          <VStack
            spacing="3"
            divider={
              <Divider
                borderColor={useColorModeValue('gray.300', 'whiteAlpha.200')}
              />
            }
            alignItems="flex-start"
            width="100%"
          >
            <Text fontWeight="500">Highest Rarity</Text>
            <Select
              borderColor="transparent"
              bg={useColorModeValue('gray.100', 'whiteAlpha.200')}
              onChange={(e) => {
                setHighestRarity(e.target.value)
              }}
            >
              {RARITY_TYPES.map(({ name }) => {
                return (
                  <option key={name} value={name}>
                    {name}
                  </option>
                )
              })}
            </Select>
          </VStack>
        </VStack>
        <Logo
          width="120px"
          height="120px"
          opacity="0.1"
          position="absolute"
          bottom="-15px"
          right="-15px"
        />
      </Box>
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
                ({ name }) => name === highestRarity,
              )
              return rarityIndex >= highestRarityIndex
            })
            .slice(0, loadedItems)
            .map(({ iteratorID }) => {
              return (
                <GridItem
                  key={`${iteratorID}_${statusFilters.join(',')}_${
                    tokens && address ? 'loaded' : 'loading'
                  }`}
                  renderItem={(hideAsset) => (
                    <SearchAsset
                      address={address}
                      tokenId={String(iteratorID)}
                      hideAsset={hideAsset}
                      hideUnlisted={statusFilters.includes('buyNow')}
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
