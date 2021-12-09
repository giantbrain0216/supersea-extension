import React from 'react'
import {
  Heading,
  Text,
  Flex,
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
  Select,
  Button,
  Table,
  Thead,
  Tbody,
  Th,
  Tr,
  Td,
  Switch,
} from '@chakra-ui/react'
import EthereumIcon from '../EthereumIcon'
import { RarityName, RARITY_TYPES } from '../AssetInfo'
import TraitSelect from '../SearchResults/TraitSelect'
import ScopedCSSPortal from '../ScopedCSSPortal'
import { unstable_batchedUpdates } from 'react-dom'
import MatchedAssetListing, { MatchedAsset } from './MatchedAssetListing'
import { useExtensionConfig } from '../../utils/extensionConfig'

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
  matchedAssets,
  ...modalProps
}: {
  addedNotifiers: Notifier[]
  onAddNotifier: (notifier: Notifier) => void
  matchedAssets: MatchedAsset[]
} & Omit<React.ComponentProps<typeof Modal>, 'children'>) => {
  const [notifierNumber, setNotifierNumber] = React.useState(0)
  const [minPrice, setMinPrice] = React.useState('')
  const [maxPrice, setMaxPrice] = React.useState('')
  const [lowestRarity, setLowestRarity] = React.useState<RarityName>('Common')
  const [traits, setTraits] = React.useState<string[]>([])

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
                  traits={[]}
                  value={traits}
                  onChange={(traits) => {
                    setTraits(traits)
                  }}
                />
              </FormControl>
              <Flex justify="flex-end" width="100%">
                <Button
                  onClick={() => {
                    onAddNotifier({
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
                        <Th>ID</Th>
                        <Th>Price Range</Th>
                        <Th>Lowest Rarity</Th>
                        <Th>Traits</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {addedNotifiers.map(
                        ({ id, minPrice, maxPrice, lowestRarity, traits }) => {
                          return (
                            <Tr key={id}>
                              <Td>
                                <Text opacity="0.75">{id}</Text>
                              </Td>
                              <Td>
                                {(() => {
                                  if (minPrice === null && maxPrice === null) {
                                    return 'Any'
                                  } else if (minPrice === null) {
                                    return `< ${maxPrice}`
                                  } else if (maxPrice === null) {
                                    return `>= ${minPrice}`
                                  }
                                  return `${minPrice} - ${maxPrice}`
                                })()}
                              </Td>
                              <Td>
                                {lowestRarity === 'Common'
                                  ? 'Any'
                                  : lowestRarity}
                              </Td>
                              <Td>{traits.length ? traits : 'Any'}</Td>
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
              <VStack alignItems="flex-start" width="100%">
                <Heading as="h4" size="md" pt="3" pb="2">
                  Matched Listings
                </Heading>
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
