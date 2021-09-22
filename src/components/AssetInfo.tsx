import { useEffect, useState } from 'react'
import {
  Box,
  Flex,
  Text,
  VStack,
  Icon,
  Tag,
  Spinner,
  Link,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  IconButton,
  useColorMode,
  useToast,
} from '@chakra-ui/react'
import { FiMoreHorizontal, FiExternalLink } from 'react-icons/fi'
import LogoSvg from '../assets/logo.svg'
import EthereumSVG from '../assets/ethereum.svg'
import {
  AssetInfo as AssetInfoType,
  fetchAssetInfo,
  fetchFloorPrice,
  fetchRarities,
  Floor,
  triggerOpenSeaMetadataRefresh,
} from '../utils/api'

export const HEIGHT = 85
export const LIST_HEIGHT = 62

const RARITY_COLORS = {
  light: [
    { top: 0.001, color: 'orange.400' },
    { top: 0.01, color: 'purple.400' },
    { top: 0.1, color: 'blue.400' },
    { top: 0.5, color: 'green.400' },
    { top: Infinity, color: 'gray.500' },
  ],
  dark: [
    { top: 0.001, color: 'orange.500' },
    { top: 0.01, color: 'purple.500' },
    { top: 0.1, color: 'blue.500' },
    { top: 0.5, color: 'green.500' },
    { top: Infinity, color: 'gray.700' },
  ],
}

const AssetInfo = ({
  address,
  tokenId,
  type,
  container,
}: {
  address?: string
  tokenId?: string
  type: 'grid' | 'list' | 'item'
  container: HTMLElement
}) => {
  const [rarity, setRarity] = useState<
    { tokenCount: number; rank: number; color: string } | null | undefined
  >(undefined)
  const [floor, setFloor] = useState<Floor | null | undefined>(undefined)
  const [assetInfo, setAssetInfo] = useState<AssetInfoType | null | undefined>(
    undefined,
  )

  const { colorMode } = useColorMode()

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
            color: RARITY_COLORS[colorMode].find(
              ({ top }) => rank / tokenCount <= top,
            )!.color,
          })
          return
        }
      }
      setRarity(null)
    })()
    ;(async () => {
      const assetInfo = await fetchAssetInfo(address, tokenId)
      setAssetInfo(assetInfo)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, tokenId])

  if (!address) return <Box height={`${HEIGHT}px`} />

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
      color="white"
      bg={
        rarity ? rarity.color : colorMode === 'light' ? 'gray.600' : 'gray.600'
      }
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
        <Icon
          as={LogoSvg as any}
          position="absolute"
          opacity={colorMode === 'light' ? 0.5 : 0.35}
          color="white"
          width={type === 'list' ? '70px' : '120px'}
          height={type === 'list' ? '70px' : '120px'}
          top="50%"
          right="-16px"
          transform="translateY(-50%)"
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
          borderColor={colorMode === 'light' ? 'gray.400' : 'gray.800'}
          zIndex={2}
          color={colorMode === 'light' ? 'black' : 'white'}
        >
          <MenuGroup
            // @ts-ignore
            title={
              <Text>
                Metadata{' '}
                {assetInfo === undefined && (
                  <Spinner
                    ml="0.4em"
                    size="xs"
                    verticalAlign="middle"
                    position="relative"
                    top="-2px"
                  />
                )}
                {assetInfo === null && (
                  <Tag size="sm" ml="0.3em">
                    Unavailable
                  </Tag>
                )}
              </Text>
            }
            mr="0"
          >
            <MenuItem
              onClick={async () => {
                if (!assetInfo) return
                await triggerOpenSeaMetadataRefresh(assetInfo?.relayId)
                toast({
                  duration: 3000,
                  position: 'bottom-right',
                  render: () => (
                    <Box
                      bg={colorMode === 'light' ? 'gray.500' : 'gray.700'}
                      borderRadius="md"
                      px="6"
                      py="2"
                      mx="5"
                      minWidth="380px"
                      position="relative"
                      overflow="hidden"
                    >
                      <Text color="white">
                        OpenSea metadata refresh queued.
                      </Text>
                      <Icon
                        as={LogoSvg as any}
                        position="absolute"
                        opacity={0.35}
                        color="white"
                        width="80px"
                        height="80px"
                        top="50%"
                        right="-16px"
                        transform="translateY(-50%)"
                      />
                    </Box>
                  ),
                })
              }}
              isDisabled={!assetInfo}
            >
              Queue OpenSea refresh
            </MenuItem>
            <MenuItem
              isDisabled={!assetInfo}
              onClick={async () => {
                if (!assetInfo) return
                chrome.runtime.sendMessage(
                  { method: 'fetch', params: { url: assetInfo.tokenMetadata } },
                  (metadata) => {
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
                  },
                )
              }}
            >
              Replace image from source
            </MenuItem>
            <MenuItem
              isDisabled={!assetInfo}
              onClick={async () => {
                if (!assetInfo) return
                console.log(assetInfo?.tokenMetadata)
                if (/^data:/.test(assetInfo?.tokenMetadata)) {
                  const blob = await fetch(assetInfo.tokenMetadata).then(
                    (res) => res.blob(),
                  )
                  window.open(URL.createObjectURL(blob), '_blank')
                } else {
                  window.open(assetInfo?.tokenMetadata, '_blank')
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
              {floor?.currency === 'ETH' ? (
                <Icon
                  as={EthereumSVG as any}
                  width="0.5em"
                  mr="0.25em"
                  verticalAlign="middle"
                  display="inline-block"
                />
              ) : null}
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
