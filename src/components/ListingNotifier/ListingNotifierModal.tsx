import React, { useState } from 'react'
import _ from 'lodash'
import { unstable_batchedUpdates } from 'react-dom'
import {
  Heading,
  Text,
  IconButton,
  Circle,
  Flex,
  Spinner,
  Icon,
  Modal,
  Checkbox,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormHelperText,
  HStack,
  Input,
  useColorModeValue,
  VStack,
  Tag,
  Select,
  Button,
  Table,
  Thead,
  Tbody,
  Th,
  Tr,
  Td,
  Switch,
  useColorMode,
} from '@chakra-ui/react'
import EthereumIcon from '../EthereumIcon'
import { RarityName, RARITY_TYPES } from '../../utils/rarity'
import TraitSelect from '../SearchResults/TraitSelect'
import { BiRefresh } from 'react-icons/bi'
import ScopedCSSPortal from '../ScopedCSSPortal'
import MatchedAssetListing, { MatchedAsset } from './MatchedAssetListing'
import { DeleteIcon } from '@chakra-ui/icons'
import { Trait } from '../../utils/api'
import TraitTag from '../SearchResults/TraitTag'
import LockedFeature from '../LockedFeature'
import { useExtensionConfig } from '../../utils/extensionConfig'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
let notifierNumber = 0

export type Notifier = {
  id: string
  minPrice: number | null
  maxPrice: number | null
  lowestRarity: RarityName
  includeAuctions: boolean
  traits: string[]
  autoQuickBuy: boolean
}

const ListingNotifierModal = ({
  addedNotifiers,
  onAddNotifier,
  onRemoveNotifier,
  isRanked,
  isSubscriber,
  matchedAssets,
  allTraits,
  playSound,
  pollStatus,
  onChangePlaySound,
  sendNotification,
  onChangeSendNotification,
  onClearMatches,
  ...modalProps
}: {
  addedNotifiers: Notifier[]
  onAddNotifier: (notifier: Notifier) => Promise<void>
  onRemoveNotifier: (id: string) => void
  allTraits?: Trait[]
  isRanked: boolean | null
  isSubscriber: boolean
  matchedAssets: MatchedAsset[]
  playSound: boolean
  pollStatus: 'STARTING' | 'ACTIVE' | 'FAILED'
  onChangePlaySound: (playSound: boolean) => void
  sendNotification: boolean
  onClearMatches: () => void
  onChangeSendNotification: (sendNotification: boolean) => void
} & Omit<React.ComponentProps<typeof Modal>, 'children'>) => {
  const [extensionConfig] = useExtensionConfig()
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [includeAuctions, setIncludeAuctions] = useState(false)
  const [lowestRarity, setLowestRarity] = useState<RarityName>('Common')
  const [traits, setTraits] = useState<string[]>([])
  const [autoQuickBuy, setAutoQuickBuy] = useState(false)
  const [creatingNotifier, setCreatingNotifier] = useState(false)

  const { colorMode } = useColorMode()

  const borderColor = useColorModeValue('blackAlpha.300', 'whiteAlpha.400')
  const idCircleBackground = useColorModeValue(
    'blackAlpha.100',
    'blackAlpha.300',
  )
  const rarityInputsDisabled = isRanked === false || !isSubscriber

  return (
    <ScopedCSSPortal>
      <Modal {...modalProps}>
        <ModalOverlay />
        <ModalContent maxWidth="container.sm">
          <ModalCloseButton />
          <ModalBody px="3">
            <VStack spacing="1" px="1" alignItems="flex-start" pb="2">
              <Heading as="h4" size="md" pt="3" pb="2">
                Create a Notifier
              </Heading>
              <Text opacity="0.75">
                Notify when a listing is posted matching these filters. <br />
                Leave filters empty to get notified on all listings.
              </Text>
            </VStack>
            <VStack
              spacing="5"
              alignItems="flex-start"
              bg={useColorModeValue('transparent', 'blackAlpha.500')}
              width="100%"
              borderRadius="md"
              border={useColorModeValue('1px solid', 'none')}
              borderColor="blackAlpha.300"
              mt="3"
              p="4"
            >
              <HStack spacing="3" alignItems="flex-end">
                <FormControl maxWidth="100px">
                  <FormLabel fontSize="sm">
                    <EthereumIcon /> Min Price
                  </FormLabel>
                  <Input
                    borderColor={useColorModeValue(
                      'blackAlpha.300',
                      'whiteAlpha.300',
                    )}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </FormControl>
                <FormControl maxWidth="100px">
                  <FormLabel fontSize="sm">
                    <EthereumIcon /> Max Price
                  </FormLabel>
                  <Input
                    borderColor={useColorModeValue(
                      'blackAlpha.300',
                      'whiteAlpha.300',
                    )}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </FormControl>
                <Flex height="40px" alignItems="center" pl="2">
                  <Checkbox
                    isChecked={includeAuctions}
                    onChange={(e) => setIncludeAuctions(e.target.checked)}
                    borderColor={useColorModeValue(
                      'blackAlpha.500',
                      'whiteAlpha.500',
                    )}
                  >
                    Include auctions
                  </Checkbox>
                </Flex>
              </HStack>
              <FormControl>
                <FormLabel fontSize="sm">
                  <Text as="span" opacity={rarityInputsDisabled ? 0.75 : 1}>
                    Lowest Rarity
                  </Text>
                  {(() => {
                    if (isRanked === false) {
                      return (
                        <Tag verticalAlign="bottom" ml="0.5em" size="sm">
                          Unranked
                        </Tag>
                      )
                    } else if (!isSubscriber) {
                      return <LockedFeature ml="0.5em" />
                    }
                    return null
                  })()}
                </FormLabel>
                <Select
                  isDisabled={rarityInputsDisabled}
                  borderColor="transparent"
                  bg={useColorModeValue('gray.100', 'whiteAlpha.200')}
                  value={lowestRarity}
                  onChange={(e) =>
                    setLowestRarity(e.target.value as RarityName)
                  }
                >
                  {RARITY_TYPES.map(({ name }) => {
                    return (
                      <option key={name} value={name}>
                        {name === 'Common' ? 'Ignore rarity' : name}
                      </option>
                    )
                  })}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">
                  <Text as="span" opacity={rarityInputsDisabled ? 0.75 : 1}>
                    Traits
                  </Text>
                  {(() => {
                    if (isRanked === false) {
                      return (
                        <Tag verticalAlign="bottom" ml="0.5em" size="sm">
                          Unavailable
                        </Tag>
                      )
                    } else if (!isSubscriber) {
                      return <LockedFeature ml="0.5em" />
                    }
                    return null
                  })()}
                </FormLabel>
                <TraitSelect
                  isDisabled={rarityInputsDisabled}
                  traits={allTraits || []}
                  value={traits}
                  onChange={(traits) => {
                    setTraits(traits)
                  }}
                />
              </FormControl>
              <FormControl isDisabled={!isSubscriber}>
                <FormLabel fontSize="sm" htmlFor="auto-quick-buy" mb="3">
                  Trigger Quick Buy
                  {!isSubscriber ? <LockedFeature ml="0.5em" /> : null}
                </FormLabel>
                <HStack spacing="2" alignItems="center">
                  <Switch
                    id="auto-quick-buy"
                    isChecked={autoQuickBuy}
                    isDisabled={!extensionConfig?.quickBuyEnabled}
                    onChange={(event) => {
                      setAutoQuickBuy(event.target.checked && isSubscriber)
                    }}
                  />
                  {isSubscriber && !extensionConfig?.quickBuyEnabled ? (
                    <Text opacity="0.75" fontSize="sm">
                      Quick Buy is disabled.{' '}
                      <Button
                        size="sm"
                        variant="link"
                        color="blue.400"
                        onClick={() => {
                          chrome.runtime.sendMessage({
                            method: 'openPopup',
                            params: { action: 'activateQuickBuy' },
                          })
                        }}
                      >
                        Enable?
                      </Button>
                    </Text>
                  ) : null}
                </HStack>
                <FormHelperText maxWidth="300px" lineHeight="1.6em">
                  Automatically trigger Quick Buy when a listing that matches
                  this notifier is posted.
                </FormHelperText>
              </FormControl>
              <Flex justify="flex-end" width="100%">
                <Button
                  isLoading={creatingNotifier}
                  onClick={async () => {
                    setCreatingNotifier(true)
                    await onAddNotifier({
                      id: `${ALPHABET[notifierNumber % ALPHABET.length]}${
                        Math.floor(notifierNumber / ALPHABET.length) || ''
                      }`,
                      minPrice: minPrice ? Number(minPrice) : null,
                      maxPrice: maxPrice ? Number(maxPrice) : null,
                      lowestRarity,
                      includeAuctions,
                      traits,
                      autoQuickBuy,
                    })
                    notifierNumber++
                    unstable_batchedUpdates(() => {
                      setMinPrice('')
                      setMaxPrice('')
                      setLowestRarity('Common')
                      setTraits([])
                      setAutoQuickBuy(false)
                      setCreatingNotifier(false)
                    })
                  }}
                >
                  Add Notifier
                </Button>
              </Flex>
            </VStack>
            <VStack spacing="4" alignItems="flex-start" mt="3" px="1">
              {addedNotifiers.length ? (
                <VStack alignItems="flex-start" width="100%">
                  <Heading as="h4" size="md" pt="3" pb="2">
                    Active Notifiers
                  </Heading>

                  <Table
                    variant="simple"
                    width="100%"
                    sx={{
                      '& th, & td': {
                        borderColor,
                      },
                    }}
                  >
                    <Thead borderBottom="1px solid" borderColor={borderColor}>
                      <Tr>
                        <Th px="4">ID</Th>
                        <Th>Price Range</Th>
                        <Th>Lowest Rarity</Th>
                        <Th>Traits</Th>
                        <Th>Quick Buy</Th>
                        <Th></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {addedNotifiers.map(
                        ({
                          id,
                          minPrice,
                          maxPrice,
                          lowestRarity,
                          traits,
                          autoQuickBuy,
                        }) => {
                          return (
                            <Tr key={id}>
                              <Td px="2" py="1">
                                <Circle
                                  p="2"
                                  width="28px"
                                  height="28px"
                                  fontWeight="bold"
                                  bg={idCircleBackground}
                                >
                                  {id}
                                </Circle>
                              </Td>
                              <Td>
                                {(() => {
                                  if (minPrice === null && maxPrice === null) {
                                    return 'Any'
                                  } else if (minPrice === null) {
                                    return (
                                      <Text>
                                        <EthereumIcon verticalAlign="top" />
                                        {maxPrice}
                                        {' or less'}
                                      </Text>
                                    )
                                  } else if (maxPrice === null) {
                                    return (
                                      <Text>
                                        <EthereumIcon verticalAlign="top" />
                                        {minPrice}
                                        {' or more'}
                                      </Text>
                                    )
                                  }
                                  return (
                                    <Text>
                                      <EthereumIcon verticalAlign="top" />
                                      {minPrice}
                                      <Text as="span" mx="0.4em">
                                        -
                                      </Text>
                                      <EthereumIcon verticalAlign="top" />
                                      {maxPrice}
                                    </Text>
                                  )
                                })()}
                              </Td>
                              <Td>
                                {lowestRarity === 'Common' ? (
                                  'Any'
                                ) : (
                                  <Tag
                                    bg={
                                      RARITY_TYPES.find(
                                        ({ name }) => name === lowestRarity,
                                      )!.color[colorMode]
                                    }
                                  >
                                    {lowestRarity}
                                  </Tag>
                                )}
                              </Td>
                              <Td>
                                {traits.length ? (
                                  <Flex flexWrap="wrap">
                                    {traits.map((trait) => {
                                      return (
                                        <TraitTag
                                          key={trait}
                                          traitJson={trait}
                                        />
                                      )
                                    })}
                                  </Flex>
                                ) : (
                                  'Any'
                                )}
                              </Td>
                              <Td>{autoQuickBuy ? 'On' : 'Off'}</Td>
                              <Td maxWidth="30px" textAlign="right">
                                <IconButton
                                  icon={<DeleteIcon />}
                                  bg="transparent"
                                  aria-label="delete"
                                  onClick={() => {
                                    onRemoveNotifier(id)
                                  }}
                                />
                              </Td>
                            </Tr>
                          )
                        },
                      )}
                    </Tbody>
                  </Table>
                  <Flex justifyContent="flex-end" width="100%" pt="2">
                    <VStack alignItems="flex-end" spacing="2">
                      <HStack alignItems="center" spacing="2">
                        <Text fontSize="sm" opacity="0.75">
                          Play sound
                        </Text>
                        <Switch
                          isChecked={playSound}
                          onChange={(event) => {
                            onChangePlaySound(event?.target.checked)
                          }}
                        />
                      </HStack>
                      <HStack alignItems="center" spacing="2">
                        <Text fontSize="sm" opacity="0.75">
                          Send Chrome notification
                        </Text>
                        <Switch
                          isChecked={sendNotification}
                          onChange={(event) => {
                            onChangeSendNotification(event?.target.checked)
                          }}
                        />
                      </HStack>
                    </VStack>
                  </Flex>
                </VStack>
              ) : null}
              <VStack alignItems="flex-start" width="100%" pt="3">
                <Flex alignItems="center" width="100%" pb="2">
                  <Heading as="h4" size="md">
                    Matched Listings
                  </Heading>
                  <Flex alignItems="center" opacity="0.7" ml="0.75em" pt="1">
                    {(() => {
                      if (addedNotifiers.length === 0) return null
                      if (pollStatus === 'STARTING') {
                        return (
                          <>
                            <Text fontSize="sm">Initializing</Text>
                            <Spinner size="xs" ml="0.25em" />
                          </>
                        )
                      } else if (pollStatus === 'ACTIVE') {
                        return (
                          <>
                            <Text fontSize="sm">Checking every 2 seconds</Text>
                            <Icon
                              as={BiRefresh}
                              width="18px"
                              height="18px"
                              ml="0.25em"
                              mt="-2px"
                              animation="SuperSea__Rotate 4s linear infinite"
                            ></Icon>
                          </>
                        )
                      } else if (pollStatus === 'FAILED') {
                        return (
                          <>
                            <Text fontSize="sm" color="red.400">
                              Unable to retrieve listings.
                            </Text>
                          </>
                        )
                      }
                    })()}
                  </Flex>
                  {matchedAssets.length ? (
                    <Flex flex="1 1 auto" justifyContent="flex-end">
                      <Button size="xs" onClick={onClearMatches}>
                        Clear all
                      </Button>
                    </Flex>
                  ) : null}
                </Flex>
                {matchedAssets.length ? (
                  <VStack spacing="2" alignItems="flex-start" width="100%">
                    {matchedAssets.slice(0, 30).map((asset) => {
                      return (
                        <MatchedAssetListing
                          key={asset.listingId}
                          asset={asset}
                        />
                      )
                    })}
                  </VStack>
                ) : (
                  <Text opacity="0.5" maxWidth="500px">
                    None yet
                    {addedNotifiers.length
                      ? '. You can close this modal as long as you stay on the OpenSea activity tab.'
                      : ', add a notifier above to get started.'}
                  </Text>
                )}
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter />
        </ModalContent>
      </Modal>
    </ScopedCSSPortal>
  )
}

export default ListingNotifierModal
