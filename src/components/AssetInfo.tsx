import { useEffect, useState, useContext, useCallback } from 'react'
import { CheckIcon } from '@chakra-ui/icons'
import {
  Box,
  Flex,
  Text,
  VStack,
  Icon,
  Spinner,
  Link,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  IconButton,
  useToast,
  Tag,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react'
import { FiMoreHorizontal, FiExternalLink } from 'react-icons/fi'

import {
  Chain,
  fetchFloorPrice,
  fetchIsRanked,
  fetchMetadata,
  fetchMetadataUriWithOpenSeaFallback,
  fetchRarities,
  fetchSelectors,
  Floor,
  triggerOpenSeaMetadataRefresh,
} from '../utils/api'
import Toast from './Toast'
import EthereumIcon from './EthereumIcon'
import Logo from './Logo'
import { useUser } from '../utils/user'
import ScopedCSSPortal from './ScopedCSSPortal'
import RefreshIndicator, { RefreshState } from './RefreshIndicator'
import { EventEmitterContext, GlobalConfigContext } from './AppProvider'
import { RateLimit } from 'async-sema'
import BuyNowButton from './BuyNowButton'
import LockedFeature from './LockedFeature'
import { selectElement } from '../utils/selector'

export const HEIGHT = 85
export const LIST_HEIGHT = 62
const MEMBERSHIP_ADDRESS = '0x24e047001f0ac15f72689d3f5cd0b0f52b1abdf9'

const replaceImageRateLimit = RateLimit(3)

export const RARITY_TYPES = [
  {
    top: 0.001,
    name: 'Legendary',
    color: { light: 'orange.200', dark: 'orange.500' },
  },
  {
    top: 0.01,
    name: 'Epic',
    color: { light: 'purple.200', dark: 'purple.500' },
  },
  { top: 0.1, name: 'Rare', color: { light: 'blue.200', dark: 'blue.500' } },
  {
    top: 0.5,
    name: 'Uncommon',
    color: { light: 'green.200', dark: 'green.500' },
  },
  {
    top: Infinity,
    name: 'Common',
    color: { light: 'gray.200', dark: 'gray.500' },
  },
]

type Rarity = {
  isRanked: boolean
  tokenCount: number
  rank: number
  type: typeof RARITY_TYPES[number]
}
const RarityBadge = ({
  rarity,
  isSubscriber,
  isMembershipNFT,
}: {
  rarity: Rarity | null
  isSubscriber: boolean
  isMembershipNFT: boolean
}) => {
  if (isSubscriber || isMembershipNFT) {
    const tooltipLabel = (() => {
      if (isMembershipNFT) {
        return "You're all legendary to us <3"
      }
      if (rarity) {
        return `${rarity.type.name}${
          rarity.type.top !== Infinity ? ` (top ${rarity.type.top * 100}%)` : ''
        }`
      }

      return ''
    })()
    return (
      <Tooltip
        isDisabled={!(rarity || isMembershipNFT)}
        label={tooltipLabel}
        size="lg"
        hasArrow
        bg="gray.700"
        placement="top"
        color="white"
        px={3}
        py={2}
      >
        <Text fontWeight="500" cursor={rarity ? 'pointer' : undefined}>
          {rarity === null ? 'Unranked' : `#${rarity.rank}`}
        </Text>
      </Tooltip>
    )
  }
  if (rarity && rarity.isRanked) {
    return <LockedFeature />
  }
  return <Text fontWeight="500">Unranked</Text>
}

const AssetInfo = ({
  address,
  tokenId,
  type,
  container,
  chain,
}: {
  address: string
  tokenId: string
  type: 'grid' | 'list' | 'item'
  chain: Chain
  container: HTMLElement
}) => {
  const events = useContext(EventEmitterContext)
  const globalConfig = useContext(GlobalConfigContext)

  const { isSubscriber } = useUser() || { isSubscriber: false }

  const [rarity, setRarity] = useState<Rarity | null | undefined>(undefined)
  const [floor, setFloor] = useState<Floor | null | undefined>(undefined)
  const [refreshState, setRefreshState] = useState<RefreshState>('IDLE')
  const [isAutoQueued, setIsAutoQueued] = useState(false)
  const [isAutoImageReplaced, setIsAutoImageReplaced] = useState(false)

  const toast = useToast()
  const isMembershipNFT = MEMBERSHIP_ADDRESS === address

  const replaceImage = useCallback(async () => {
    await replaceImageRateLimit()
    const selectors = await fetchSelectors()
    try {
      const metadata = await fetchMetadata(address, +tokenId)
      const imgElement = selectElement(
        container,
        selectors.assetInfo[type].image,
      ) as HTMLElement
      if (imgElement) {
        imgElement.style.opacity = '0'
        setTimeout(() => {
          imgElement.setAttribute('src', '')
        }, 0)
        setTimeout(() => {
          imgElement.style.opacity = '1'
          imgElement.setAttribute(
            'src',
            (metadata.image || metadata.image_url).replace(
              /^ipfs:\/\//,
              'https://ipfs.io/ipfs/',
            ),
          )
        }, 100)
      }
    } catch (err) {
      console.error(err)
      toast({
        duration: 3000,
        position: 'bottom-right',
        render: () => (
          <Toast text="Unable to load source image." type="error" />
        ),
      })
    }
  }, [address, container, toast, tokenId, type])

  const autoReplaceImage = useCallback(() => {
    if (globalConfig.autoImageReplaceAddresses[address]) {
      setIsAutoImageReplaced(true)
      if (!globalConfig.imageReplaced[`${address}/${tokenId}`]) {
        globalConfig.imageReplaced[`${address}/${tokenId}`] = true
        replaceImage()
      }
    } else if (isAutoImageReplaced) {
      setIsAutoImageReplaced(false)
    }
  }, [address, globalConfig, replaceImage, isAutoImageReplaced, tokenId])

  useEffect(() => {
    events.addListener('toggleAutoReplaceImage', autoReplaceImage)
    return () => {
      events.removeListener('toggleAutoReplaceImage', autoReplaceImage)
    }
  }, [autoReplaceImage, events])

  useEffect(() => {
    autoReplaceImage()
  }, [autoReplaceImage])

  const queueRefresh = useCallback(async () => {
    if (refreshState === 'QUEUING') return
    setRefreshState('QUEUING')
    const success = await triggerOpenSeaMetadataRefresh(address, tokenId)
    setRefreshState(success ? 'QUEUED' : 'FAILED')
  }, [address, refreshState, tokenId])

  const autoQueueRefresh = useCallback(() => {
    if (globalConfig.autoQueueAddresses[address]) {
      setIsAutoQueued(true)
      if (!globalConfig.refreshQueued[`${address}/${tokenId}`]) {
        globalConfig.refreshQueued[`${address}/${tokenId}`] = true
        queueRefresh()
      }
    } else if (isAutoQueued) {
      setIsAutoQueued(false)
    }
  }, [address, globalConfig, isAutoQueued, queueRefresh, tokenId])

  useEffect(() => {
    events.addListener('toggleAutoQueue', autoQueueRefresh)
    return () => {
      events.removeListener('toggleAutoQueue', autoQueueRefresh)
    }
  }, [autoQueueRefresh, events])

  useEffect(() => {
    autoQueueRefresh()
  }, [autoQueueRefresh])

  useEffect(() => {
    if (!(address && tokenId)) return
    ;(async () => {
      const floor = await fetchFloorPrice({ address, tokenId, chain })
      setFloor(floor)
    })()
    ;(async () => {
      if (isSubscriber) {
        if (chain === 'polygon') {
          setRarity(null)
          return
        }
        const rarities = await fetchRarities(address)
        if (rarities) {
          const { tokenCount, tokens } = rarities
          const token = tokens.find(
            ({ iteratorID }) => String(iteratorID) === tokenId,
          )
          if (token) {
            const { rank } = token
            if (rank !== null) {
              setRarity({
                isRanked: true,
                tokenCount,
                rank,
                type:
                  rank === 1
                    ? RARITY_TYPES[0]
                    : RARITY_TYPES.find(({ top }) => rank / tokenCount <= top)!,
              })
              return
            }
          }
        }
        setRarity(null)
      } else {
        const isRanked = await fetchIsRanked(address)
        if (isMembershipNFT) {
          setRarity({
            isRanked: true,
            tokenCount: 100,
            rank: 1,
            type: RARITY_TYPES[0],
          })
        } else {
          setRarity({
            isRanked: Boolean(isRanked),
            tokenCount: 0,
            rank: 0,
            type: RARITY_TYPES[RARITY_TYPES.length - 1],
          })
        }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, tokenId])

  return (
    <Box
      pr={type === 'list' ? 3 : 0}
      width={type === 'list' ? '165px' : undefined}
    >
      <Flex
        height={type === 'list' ? `${LIST_HEIGHT}px` : `${HEIGHT}px`}
        minWidth={type === 'list' ? '140px' : 0}
        transition="background 250ms ease"
        position={type === 'grid' ? 'absolute' : 'relative'}
        bottom={type === 'grid' ? 0 : undefined}
        width="100%"
        pt={type === 'list' ? 6 : 4}
        pb={type === 'list' ? 1 : 3}
        px="3"
        alignItems="flex-end"
        borderBottomRadius="5px"
        borderTopRadius={type === 'list' ? '5px' : 0}
        fontSize={type === 'list' ? '12px' : '14px'}
        color={useColorModeValue('gray.700', 'white')}
        border={type === 'list' ? '1px solid' : undefined}
        borderTop="1px solid"
        borderColor={useColorModeValue('gray.200', 'transparent')}
        _hover={{
          '.SuperSea__BuyNowContainer': {
            opacity: 1,
          },
        }}
        bg={useColorModeValue(
          rarity && (isSubscriber || isMembershipNFT)
            ? rarity.type.color.light
            : 'gray.50',
          rarity && (isSubscriber || isMembershipNFT)
            ? rarity.type.color.dark
            : 'gray.600',
        )}
        onClick={(e) => {
          if ((e.target as HTMLElement).tagName !== 'A') {
            e.preventDefault()
          }
          e.stopPropagation()
        }}
      >
        <Box
          position="absolute"
          pointerEvents="none"
          width="100%"
          top="0"
          right="0"
          height="100%"
          borderBottomRightRadius="5px"
          borderTopRightRadius={type === 'list' ? '5px' : 0}
          overflow="hidden"
          zIndex={0}
        >
          <Logo
            position="absolute"
            opacity={useColorModeValue(
              rarity ? 0.4 : 0.35,
              rarity ? 0.15 : 0.1,
            )}
            width={type === 'list' ? '70px' : '120px'}
            height={type === 'list' ? '70px' : '120px'}
            top="50%"
            right="-16px"
            transform="translateY(-50%)"
            color={useColorModeValue(
              rarity && (isSubscriber || isMembershipNFT)
                ? 'white'
                : 'gray.300',
              'white',
            )}
          />
          <Box position="absolute" bottom="2" right="2">
            <RefreshIndicator state={refreshState} />
          </Box>
        </Box>
        <Menu autoSelect={false}>
          <MenuButton
            as={IconButton}
            icon={<Icon as={FiMoreHorizontal} />}
            size="md"
            position="absolute"
            top="0"
            bg="transparent"
            height="20px"
            mt="1"
            minWidth="24px"
            ml="5px"
            left="0"
          >
            More Options
          </MenuButton>
          <ScopedCSSPortal>
            <MenuList
              borderColor={useColorModeValue('gray.200', 'gray.800')}
              zIndex={2}
              color={useColorModeValue('black', 'white')}
              fontSize="sm"
            >
              <MenuGroup
                // @ts-ignore
                title={
                  <Text>
                    Metadata{' '}
                    {chain === 'polygon' ? (
                      <Tag fontSize="xs" mt="-1px" ml="0.35em">
                        Unavailable
                      </Tag>
                    ) : null}
                  </Text>
                }
                mr="0"
              >
                <MenuItem
                  isDisabled={chain === 'polygon'}
                  onClick={queueRefresh}
                >
                  Queue OpenSea refresh
                </MenuItem>
                <MenuItem
                  isDisabled={chain === 'polygon'}
                  onClick={replaceImage}
                >
                  Replace image from source
                </MenuItem>
                <MenuItem
                  isDisabled={chain === 'polygon'}
                  onClick={async () => {
                    globalConfig.autoQueueAddresses[address] = !globalConfig
                      .autoQueueAddresses[address]

                    if (!globalConfig.autoQueueAddresses[address]) {
                      Object.keys(globalConfig.refreshQueued).forEach((key) => {
                        const [_address] = key.split('/')
                        if (address === _address) {
                          globalConfig.refreshQueued[key] = false
                        }
                      })
                    }

                    events.emit('toggleAutoQueue', {
                      value: globalConfig.autoQueueAddresses[address],
                      address,
                    })
                  }}
                >
                  <Text maxWidth="210px">
                    Mass-queue OpenSea refresh for collection
                    {isAutoQueued && (
                      <CheckIcon
                        width="12px"
                        height="auto"
                        display="inline-block"
                        marginLeft="3px"
                      />
                    )}
                  </Text>
                </MenuItem>
                <MenuItem
                  isDisabled={chain === 'polygon'}
                  onClick={async () => {
                    globalConfig.autoImageReplaceAddresses[
                      address
                    ] = !globalConfig.autoImageReplaceAddresses[address]

                    if (!globalConfig.autoImageReplaceAddresses[address]) {
                      Object.keys(globalConfig.imageReplaced).forEach((key) => {
                        const [_address] = key.split('/')
                        if (address === _address) {
                          globalConfig.imageReplaced[key] = false
                        }
                      })
                    }

                    events.emit('toggleAutoReplaceImage', {
                      value: globalConfig.autoImageReplaceAddresses[address],
                      address,
                    })
                  }}
                >
                  <Text maxWidth="210px">
                    Mass-replace image from source for collection
                    {isAutoImageReplaced && (
                      <CheckIcon
                        width="12px"
                        height="auto"
                        display="inline-block"
                        marginLeft="3px"
                      />
                    )}
                  </Text>
                </MenuItem>
                <MenuItem
                  isDisabled={chain === 'polygon'}
                  onClick={async () => {
                    let metadataUri = await fetchMetadataUriWithOpenSeaFallback(
                      address,
                      +tokenId,
                    )
                    if (!metadataUri) {
                      toast({
                        duration: 3000,
                        position: 'bottom-right',
                        render: () => (
                          <Toast text="Unable to load metadata." type="error" />
                        ),
                      })
                      return
                    }
                    if (/^data:/.test(metadataUri)) {
                      const blob = await fetch(metadataUri).then((res) =>
                        res.blob(),
                      )
                      window.open(URL.createObjectURL(blob), '_blank')
                    } else {
                      window.open(metadataUri, '_blank')
                    }
                  }}
                >
                  View Raw Data{' '}
                  <Icon as={FiExternalLink} ml="0.3em" mt="-2px" />
                </MenuItem>
              </MenuGroup>
              <MenuDivider />
              <MenuGroup
                title={chain === 'ethereum' ? 'Etherscan' : 'Polygonscan'}
              >
                <MenuItem
                  onClick={() => {
                    window.open(
                      `https://${
                        chain === 'ethereum'
                          ? 'etherscan.io'
                          : 'polygonscan.com'
                      }/token/${address}`,
                      '_blank',
                    )
                  }}
                >
                  View contract{' '}
                  <Icon as={FiExternalLink} ml="0.3em" mt="-2px" />
                </MenuItem>
              </MenuGroup>
            </MenuList>
          </ScopedCSSPortal>
        </Menu>
        <VStack
          spacing={type === 'list' ? 0 : 1}
          alignItems="flex-start"
          width="100%"
          zIndex={0}
        >
          <Flex width="100%" alignItems="center">
            <Text opacity={0.7} mr="0.5em">
              Rank:
            </Text>
            {rarity !== undefined ? (
              <RarityBadge
                isSubscriber={isSubscriber}
                rarity={rarity}
                isMembershipNFT={isMembershipNFT}
              />
            ) : (
              <Spinner ml={1} width={3} height={3} opacity={0.75} />
            )}
          </Flex>
          <Flex width="100%" alignItems="center">
            <Text opacity={0.7} mr="0.5em">
              Floor:{' '}
            </Text>
            {floor ? (
              <>
                {floor?.currency === 'ETH' ? <EthereumIcon /> : null}
                <Link
                  href={floor.floorSearchUrl}
                  fontWeight="500"
                  verticalAlign="middle"
                >
                  {floor === null
                    ? 'Unavailable'
                    : `${floor.price} ${
                        floor.currency !== 'ETH' ? ` ${floor.currency}` : ''
                      }`}
                </Link>
              </>
            ) : (
              <Spinner ml={1} width={3} height={3} opacity={0.75} />
            )}
          </Flex>
        </VStack>
        <Box
          position="absolute"
          pointerEvents="none"
          width="100%"
          top="0"
          right="0"
          height="100%"
          overflow="hidden"
          zIndex={0}
        >
          <Box position="absolute" bottom="2" right="2">
            <RefreshIndicator state={refreshState} />
          </Box>
        </Box>
        <Box
          position="absolute"
          top="0"
          right="0"
          m="1"
          className="SuperSea__BuyNowContainer"
          opacity="0"
          transition="opacity 115ms ease"
        >
          <BuyNowButton address={address} tokenId={tokenId} />
        </Box>
      </Flex>
    </Box>
  )
}

export default AssetInfo
