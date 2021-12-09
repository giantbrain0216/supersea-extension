import { HStack, Box, Flex, Text, Image } from '@chakra-ui/react'
import { useRef, useState } from 'react'
import { readableEthValue } from '../../utils/ethereum'
import AssetInfo, { LIST_HEIGHT, LIST_WIDTH } from '../AssetInfo'
import TimeAgo from 'react-timeago'
import EthereumIcon from '../EthereumIcon'

export type MatchedAsset = {
  listingId: string
  tokenId: string
  contractAddress: string
  name: string
  image: string
  price: string
  currency: string
  timestamp: string
}

const MatchedAssetListing = ({ asset }: { asset: MatchedAsset }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  return (
    <HStack
      spacing="2"
      ref={(refContainer) => {
        if (!container && refContainer) {
          setContainer(refContainer)
        }
      }}
      width="100%"
      pr="8"
    >
      {container ? (
        <AssetInfo
          address={asset.contractAddress!}
          tokenId={asset.tokenId}
          type="list"
          chain="ethereum"
          container={containerRef.current!}
        />
      ) : (
        <Box height={LIST_HEIGHT} width={LIST_WIDTH} />
      )}
      <HStack flex="1 1 auto" spacing="3">
        <Image src={asset.image} width="48px" height="48px" borderRadius="md" />
        <Box>
          <Text my="0" fontSize="sm" fontWeight="500">
            {asset.name}
          </Text>
          <Box fontSize="sm" opacity="0.5">
            <TimeAgo date={new Date(`${asset.timestamp}Z`)} />
          </Box>
        </Box>
      </HStack>
      <Flex alignItems="center">
        <EthereumIcon mx="0.5em" wrapped={asset.currency === 'WETH'} />
        <Text fontWeight="600">{readableEthValue(+asset.price)}</Text>
      </Flex>
    </HStack>
  )
}

export default MatchedAssetListing
