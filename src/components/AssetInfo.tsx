import { useEffect, useState } from 'react'
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
  useColorModeValue,
} from '@chakra-ui/react'
import { FiMoreHorizontal, FiExternalLink } from 'react-icons/fi'
import { fetchMetadataUri } from '../utils/web3'
import {
  fetchAssetInfo,
  fetchFloorPrice,
  fetchRarities,
  Floor,
  triggerOpenSeaMetadataRefresh,
} from '../utils/api'
import Toast from './Toast'
import EthereumIcon from './EthereumIcon'
import Logo from './Logo'

export const HEIGHT = 85
export const LIST_HEIGHT = 62

const RARITY_COLORS = [
  { top: 0.001, color: { light: 'orange.200', dark: 'orange.500' } },
  { top: 0.01, color: { light: 'purple.200', dark: 'purple.500' } },
  { top: 0.1, color: { light: 'blue.200', dark: 'blue.500' } },
  { top: 0.5, color: { light: 'green.200', dark: 'green.500' } },
  { top: Infinity, color: { light: 'gray.200', dark: 'gray.500' } },
]

const fetchMetadataUriWithOpenSeaFallback = async (
  address: string,
  tokenId: string,
) => {
  const contractTokenUri = await fetchMetadataUri(address, tokenId!)
  if (!contractTokenUri) {
    const assetInfo = await fetchAssetInfo(address, tokenId!)
    return assetInfo?.tokenMetadata
  }
  return contractTokenUri.replace(/^ipfs:\/\//, 'https://ipfs.io/ipfs/')
}

const AssetInfo = ({
  address,
  tokenId,
  type,
  container,
}: {
  address: string
  tokenId: string
  type: 'grid' | 'list' | 'item'
  container: HTMLElement
}) => {
  const [rarity, setRarity] = useState<
    | {
        tokenCount: number
        rank: number
        color: { light: string; dark: string }
      }
    | null
    | undefined
  >(undefined)
  const [floor, setFloor] = useState<Floor | null | undefined>(undefined)

  const toast = useToast()

  useEffect(() => {
    if (!(address && tokenId)) return
    ;(async () => {
      const floor = await fetchFloorPrice(address)
      setFloor(floor)
    })()
    ;(async () => {
      const rarities = await fetchRarities(address)
      if (rarities) {
        const { tokenCount, tokens } = rarities
        const token = tokens.find(
          ({ iteratorID }) => String(iteratorID) === tokenId,
        )
        if (token) {
          const { rank } = token
          setRarity({
            tokenCount,
            rank,
            color: RARITY_COLORS.find(({ top }) => rank / tokenCount <= top)!
              .color,
          })
          return
        }
      }
      setRarity(null)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, tokenId])

  return (
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
      mx={type === 'list' ? 3 : 0}
      alignItems="flex-end"
      borderBottomRadius="5px"
      borderTopRadius={type === 'list' ? '5px' : 0}
      fontSize={type === 'list' ? '12px' : '14px'}
      color={useColorModeValue('gray.700', 'white')}
      borderTop="1px solid"
      borderColor={useColorModeValue('gray.200', 'transparent')}
      bg={useColorModeValue(
        rarity ? rarity.color.light : 'gray.50',
        rarity ? rarity.color.dark : 'gray.600',
      )}
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
      >
        <Logo
          position="absolute"
          opacity={useColorModeValue(rarity ? 0.75 : 0.35, 0.35)}
          width={type === 'list' ? '70px' : '120px'}
          height={type === 'list' ? '70px' : '120px'}
          top="50%"
          right="-16px"
          transform="translateY(-50%)"
          color={useColorModeValue(rarity ? 'white' : 'gray.400', 'white')}
        />
      </Box>
      <Menu isLazy autoSelect={false}>
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
        <MenuList
          borderColor={useColorModeValue('gray.200', 'gray.800')}
          zIndex={2}
          color={useColorModeValue('black', 'white')}
        >
          <MenuGroup
            // @ts-ignore
            title={<Text>Metadata</Text>}
            mr="0"
          >
            <MenuItem
              onClick={async () => {
                const assetInfo = await fetchAssetInfo(address, tokenId!)
                if (!assetInfo) {
                  toast({
                    duration: 3000,
                    position: 'bottom-right',
                    render: () => (
                      <Toast
                        text="Unable to queue OpenSea refresh at this moment."
                        type="error"
                      />
                    ),
                  })
                  return
                }
                await triggerOpenSeaMetadataRefresh(assetInfo?.relayId)
                toast({
                  duration: 3000,
                  position: 'bottom-right',
                  render: () => (
                    <Toast text="Opensea metadata refresh queued." />
                  ),
                })
              }}
            >
              Queue OpenSea refresh
            </MenuItem>
            <MenuItem
              onClick={async () => {
                let metadataUri = await fetchMetadataUriWithOpenSeaFallback(
                  address,
                  tokenId!,
                )
                try {
                  const metadata = await fetch(metadataUri).then((res) =>
                    res.json(),
                  )
                  const imgElement = container.querySelector(
                    '.Image--image',
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
                  toast({
                    duration: 3000,
                    position: 'bottom-right',
                    render: () => (
                      <Toast text="Unable to load source image." type="error" />
                    ),
                  })
                }
              }}
            >
              Replace image from source
            </MenuItem>
            <MenuItem
              onClick={async () => {
                let metadataUri = await fetchMetadataUriWithOpenSeaFallback(
                  address,
                  tokenId!,
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
              View Raw Data <Icon as={FiExternalLink} ml="0.3em" mt="-2px" />
            </MenuItem>
          </MenuGroup>
          <MenuDivider />
          <MenuGroup title="Etherscan">
            <MenuItem
              onClick={() => {
                window.open(`https://etherscan.io/token/${address}`, '_blank')
              }}
            >
              View contract <Icon as={FiExternalLink} ml="0.3em" mt="-2px" />
            </MenuItem>
          </MenuGroup>
        </MenuList>
      </Menu>
      <VStack
        spacing={type === 'list' ? 0 : 1}
        alignItems="flex-start"
        width="100%"
        zIndex={1}
      >
        <Flex width="100%" alignItems="center">
          <Text opacity={0.7} mr="0.5em">
            Rank:
          </Text>
          {rarity !== undefined ? (
            <Text fontWeight="500">
              {rarity === null ? 'Unranked' : `#${rarity.rank}`}
            </Text>
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
              <Link href={floor.floorSearchUrl}>
                {floor === null ? (
                  <Text>Unavailable</Text>
                ) : (
                  <Text verticalAlign="middle" fontWeight="500">
                    {floor.price}
                    {floor.currency !== 'ETH' ? ` ${floor.currency}` : null}
                  </Text>
                )}
              </Link>
            </>
          ) : (
            <Spinner ml={1} width={3} height={3} opacity={0.75} />
          )}
        </Flex>
      </VStack>
    </Flex>
  )
}

export default AssetInfo
