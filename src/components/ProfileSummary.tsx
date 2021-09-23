import { useEffect, useState } from 'react'
import {
  Box,
  Text,
  Flex,
  Spinner,
  HStack,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  Progress,
  useColorModeValue,
} from '@chakra-ui/react'
import Logo from './Logo'
import { fetchAllAssetsForUser, fetchFloorPrice, Floor } from '../utils/api'
import EthereumIcon from './EthereumIcon'

const ProfileSummary = ({
  userName,
  ensName,
  address,
}: {
  userName?: string
  ensName?: string
  address?: string
}) => {
  const [progress, setProgress] = useState<{
    total: number
    numLoaded: number
    complete: boolean
  }>({ total: 0, numLoaded: 0, complete: false })
  const [floorTotal, setFloorTotal] = useState(0)

  useEffect(() => {
    fetchAllAssetsForUser({
      userName,
      ensName,
      address,
      onPageFetched: async (assetsPage, totalCount) => {
        const floors = await Promise.all(
          assetsPage
            .filter(Boolean)
            .map(async ({ assetContract: { address } }) =>
              fetchFloorPrice(address),
            ),
        )
        setFloorTotal(
          (floorTotal) =>
            (floorTotal += (floors.filter(Boolean) as Floor[]).reduce(
              (acc, { price }) => acc + price,
              0,
            )),
        )
        setProgress(({ numLoaded }) => ({
          total: totalCount,
          numLoaded: numLoaded + assetsPage.length,
          complete: numLoaded + assetsPage.length >= totalCount,
        }))
      },
    })
  }, [userName, ensName, address])

  return (
    <Box px={3} width="100vw" maxWidth="480px">
      <Flex
        bg={useColorModeValue('gray.50', 'gray.700')}
        color={useColorModeValue('gray.700', 'white')}
        width="100%"
        borderRadius="md"
        border="1px solid"
        borderColor={useColorModeValue('gray.200', 'transparent')}
        my="4"
        py="4"
        px="7"
        pr="120px"
        alignItems="center"
        position="relative"
        overflow="hidden"
      >
        <Logo
          position="absolute"
          opacity={0.35}
          width="120px"
          height="120px"
          top="50%"
          right="-16px"
          transform="translateY(-50%)"
        />
        <Progress
          bg="transparent"
          position="absolute"
          width="100%"
          size="xs"
          top={0}
          m={0}
          left={0}
          isIndeterminate={progress.numLoaded === 0}
          value={(progress.numLoaded / progress.total) * 100}
          transition="opacity 250ms 100ms ease"
          opacity={progress.complete ? 0 : 1}
          sx={{
            '> div': {
              transition: 'width 250ms ease',
            },
          }}
        />
        <HStack spacing="8">
          <Stat minWidth="150px">
            <StatLabel whiteSpace="nowrap" opacity="0.75" mb="1px">
              Total Floor Value
            </StatLabel>
            <StatNumber
              m={0}
              whiteSpace="nowrap"
              display="flex"
              minHeight="35px"
              alignItems="center"
            >
              <EthereumIcon mt="-3px" />
              <Text>
                {progress.numLoaded ? Math.round(floorTotal * 100) / 100 : null}
              </Text>
              {!progress.complete ? (
                <Spinner size="sm" mx="2" mt="-3px" />
              ) : null}
            </StatNumber>
          </Stat>
          <Stat minWidth="150px">
            <StatLabel whiteSpace="nowrap" opacity="0.75" mb="1px">
              Average Item Floor
            </StatLabel>
            <StatNumber
              m={0}
              whiteSpace="nowrap"
              display="flex"
              minHeight="35px"
              alignItems="center"
            >
              <EthereumIcon mt="-3px" />
              <Text>
                {progress.numLoaded
                  ? Math.round((floorTotal / progress.numLoaded) * 100) / 100
                  : null}
              </Text>
              {!progress.complete ? (
                <Spinner size="sm" mx="2" mt="-3px" />
              ) : null}
            </StatNumber>
          </Stat>
        </HStack>
      </Flex>
    </Box>
  )
}

export default ProfileSummary
