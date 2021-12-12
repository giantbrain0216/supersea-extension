import React, { useState } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import {
  Heading,
  Text,
  IconButton,
  Flex,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
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
import { useExtensionConfig } from '../../utils/extensionConfig'
import { DeleteIcon } from '@chakra-ui/icons'
import { Trait } from '../../utils/api'
import TraitTag from '../SearchResults/TraitTag'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export type Notifier = {
  id: string
  minPrice: number | null
  maxPrice: number | null
  lowestRarity: RarityName
  traits: string[]
}

const ListingNotifierModal = ({
  addedNotifiers,
  onAddNotifier,
  onRemoveNotifier,
  matchedAssets,
  allTraits,
  ...modalProps
}: {
  addedNotifiers: Notifier[]
  onAddNotifier: (notifier: Notifier) => Promise<void>
  onRemoveNotifier: (id: string) => void
  allTraits?: Trait[]
  matchedAssets: MatchedAsset[]
} & Omit<React.ComponentProps<typeof Modal>, 'children'>) => {
  const [notifierNumber, setNotifierNumber] = useState(0)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [lowestRarity, setLowestRarity] = useState<RarityName>('Common')
  const [traits, setTraits] = useState<string[]>([])
  const [creatingNotifier, setCreatingNotifier] = useState(false)
  const { colorMode } = useColorMode()

  const borderColor = useColorModeValue('blackAlpha.300', 'whiteAlpha.300')

  const [extensionConfig, setExtensionConfig] = useExtensionConfig()

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
              </HStack>
              <FormControl>
                <FormLabel fontSize="sm">Lowest Rarity</FormLabel>
                <Select
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
                <FormLabel fontSize="sm">Traits</FormLabel>
                <TraitSelect
                  traits={allTraits || []}
                  value={traits}
                  onChange={(traits) => {
                    setTraits(traits)
                  }}
                />
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
                      traits,
                    })
                    unstable_batchedUpdates(() => {
                      setMinPrice('')
                      setMaxPrice('')
                      setLowestRarity('Common')
                      setTraits([])
                      setNotifierNumber((n) => n + 1)
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
                        <Th>Price Range</Th>
                        <Th>Lowest Rarity</Th>
                        <Th>Traits</Th>
                        <Th></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {addedNotifiers.map(
                        ({ id, minPrice, maxPrice, lowestRarity, traits }) => {
                          return (
                            <Tr key={id}>
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
                    <HStack alignItems="center" spacing="2">
                      <Text fontSize="sm">Play sound</Text>
                      <Switch
                        isChecked={extensionConfig?.notificationSounds}
                        onChange={() => {
                          if (extensionConfig) {
                            setExtensionConfig({
                              ...extensionConfig,
                              notificationSounds: !Boolean(
                                extensionConfig?.notificationSounds,
                              ),
                            })
                          }
                        }}
                      />
                    </HStack>
                  </Flex>
                </VStack>
              ) : null}
              <VStack alignItems="flex-start" width="100%" pt="3">
                <Flex alignItems="center" width="100%" pb="2">
                  <Heading as="h4" size="md">
                    Matched Listings
                  </Heading>
                  {addedNotifiers.length ? (
                    <Flex alignItems="center" opacity="0.7" ml="0.75em" pt="1">
                      <Text fontSize="sm">Checking every 3 seconds</Text>
                      <Icon
                        as={BiRefresh}
                        width="18px"
                        height="18px"
                        ml="0.25em"
                        mt="-2px"
                        animation="SuperSea__Rotate 4s linear infinite"
                      ></Icon>
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
                  <Text opacity="0.5">
                    None yet
                    {addedNotifiers.length
                      ? ''
                      : ', add a notifier above to get started'}
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
