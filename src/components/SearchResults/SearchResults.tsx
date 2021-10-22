import { Box, SimpleGrid, HStack, Text } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import {
  fetchCollectionAddress,
  fetchRarities,
  Rarities,
} from '../../utils/api'
import SearchAsset from './SearchAsset'

const SearchResults = ({ collectionSlug }: { collectionSlug: string }) => {
  const [tokens, setTokens] = useState<Rarities['tokens'] | null | undefined>()
  const [address, setAddress] = useState<string | null>(null)
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

  return (
    <HStack width="100%" alignItems="flex-start">
      <Box
        width="340px"
        flex="0 0 340px"
        height="2500px"
        p="4"
        background="#303339"
        borderColor="transparent"
        borderWidth="1px"
        borderColorRight="#151b22"
      >
        <Text>Filters</Text>
      </Box>
      <SimpleGrid minChildWidth="175px" spacing="4" px="4" py="4" width="100%">
        {(tokens && address ? tokens : [])
          ?.slice(0, 60)
          .map(({ iteratorID }) => {
            return (
              <SearchAsset
                key={iteratorID}
                address={address!}
                tokenId={String(iteratorID)}
              />
            )
          })}
      </SimpleGrid>
    </HStack>
  )
}

export default SearchResults
