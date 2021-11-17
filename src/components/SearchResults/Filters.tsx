import { useState, useEffect, useCallback } from 'react'
import _ from 'lodash'
import {
  Spinner,
  Box,
  useColorModeValue,
  VStack,
  HStack,
  Divider,
  Select,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
} from '@chakra-ui/react'
import { RARITY_TYPES } from '../AssetInfo'
import ButtonOptions from '../ButtonOptions'
import Logo from '../Logo'
import EthereumIcon from '../EthereumIcon'
import { motion } from 'framer-motion'
import { Trait } from '../../utils/api'
import TraitSelect from './TraitSelect'

export type FiltersType = {
  status: 'buyNow'[]
  priceRange: [number | undefined, number | undefined]
  highestRarity: typeof RARITY_TYPES[number]['name']
  traits: string[]
}

const Filters = ({
  filters,
  allTraits,
  onApplyFilters,
  showSearchProgress,
  searchNumber,
}: {
  filters: FiltersType
  allTraits: Trait[]
  onApplyFilters: (filters: FiltersType) => void
  showSearchProgress: boolean
  searchNumber: number
}) => {
  const minPriceProp = filters.priceRange[0]
  const maxPriceProp = filters.priceRange[1]

  const [minPrice, setMinPrice] = useState<string>(
    minPriceProp !== undefined ? String(minPriceProp) : '',
  )
  const [maxPrice, setMaxPrice] = useState<string>(
    maxPriceProp !== undefined ? String(maxPriceProp) : '',
  )

  const [searchProgressVisible, setSearchProgressVisible] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedHideSearchProgress = useCallback(
    _.debounce(() => {
      setSearchProgressVisible(false)
    }, 5000),
    [],
  )

  useEffect(() => {
    if (showSearchProgress) {
      setSearchProgressVisible(true)
    }
    debouncedHideSearchProgress()
  }, [showSearchProgress, searchNumber, debouncedHideSearchProgress])

  useEffect(() => {
    setMinPrice(minPriceProp !== undefined ? String(minPriceProp) : '')
  }, [minPriceProp])
  useEffect(() => {
    setMaxPrice(maxPriceProp !== undefined ? String(maxPriceProp) : '')
  }, [maxPriceProp])

  return (
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
      borderRightColor={useColorModeValue('#e5e8eb', '#151b22')}
      borderBottomColor={useColorModeValue('#e5e8eb', '#151b22')}
      borderBottomRightRadius="lg"
      color={useColorModeValue('black', 'white')}
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
            active={filters.status}
            onChange={(status) => onApplyFilters({ ...filters, status })}
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
              onApplyFilters({
                ...filters,
                highestRarity: e.target.value as FiltersType['highestRarity'],
              })
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
        <VStack
          spacing="3"
          alignItems="flex-start"
          divider={
            <Divider
              borderColor={useColorModeValue('gray.300', 'whiteAlpha.200')}
            />
          }
          width="100%"
        >
          <Text fontWeight="500">Price</Text>
          <VStack spacing="3" alignItems="flex-start">
            <HStack spacing="3" alignItems="flex-end">
              <FormControl maxWidth="100px">
                <FormLabel fontSize="sm">
                  <EthereumIcon /> Min
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
                  <EthereumIcon /> Max
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
              <Button
                onClick={() => {
                  onApplyFilters({
                    ...filters,
                    priceRange: [
                      minPrice ? +minPrice : undefined,
                      maxPrice ? +maxPrice : undefined,
                    ],
                  })
                }}
              >
                Apply
              </Button>
            </HStack>
          </VStack>
        </VStack>
        <VStack
          spacing="3"
          alignItems="flex-start"
          divider={
            <Divider
              borderColor={useColorModeValue('gray.300', 'whiteAlpha.200')}
            />
          }
          width="100%"
        >
          <Text fontWeight="500">Traits</Text>
          <TraitSelect
            traits={allTraits}
            onChange={(traits) => {
              onApplyFilters({
                ...filters,
                traits: traits,
              })
            }}
            value={filters.traits}
          />
        </VStack>
      </VStack>
      <Logo
        flipped
        width="100px"
        height="100px"
        opacity={useColorModeValue(0.25, 0.15)}
        position="absolute"
        bottom="8px"
        right="8px"
      />
      <motion.div
        style={{
          display: showSearchProgress ? 'block' : 'none',
          position: 'absolute',
          bottom: 0,
          left: 0,
        }}
        animate={{
          y: searchProgressVisible ? 0 : 10,
          opacity: searchProgressVisible ? 1 : 0,
        }}
        transition={{
          y: {
            type: 'spring',
            stiffness: 400,
            damping: 15,
          },
          default: { duration: 0.1 },
        }}
        initial={false}
      >
        <Box
          bg={useColorModeValue('blackAlpha.200', 'whiteAlpha.200')}
          m="2"
          px="2"
          py="1"
          borderRadius="md"
        >
          <Text fontSize="sm">
            <Spinner
              color={useColorModeValue('blackAlpha.500', 'whiteAlpha.500')}
              width="12px"
              height="12px"
              mr="2px"
              verticalAlign="middle"
              position="relative"
              top="-1px"
            />{' '}
            Searching top {searchNumber}
          </Text>
        </Box>
      </motion.div>
    </Box>
  )
}

export default Filters
