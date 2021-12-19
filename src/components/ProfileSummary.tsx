import { useEffect, useState } from 'react'
import {
  Box,
  Text,
  Flex,
  Spinner,
  HStack,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  Progress,
  useColorModeValue,
} from '@chakra-ui/react'
import Logo from './Logo'
import { fetchAllCollectionsForUser, fetchFloorPrice } from '../utils/api'
import EthereumIcon from './EthereumIcon'

const ProfileSummary = ({ shortenedAddress }: { shortenedAddress: string }) => {
  const [active, setActive] = useState(false)
  const [progress, setProgress] = useState<{
    total: number
    numLoaded: number
    complete: boolean
  }>({ total: 0, numLoaded: 0, complete: false })
  const [floorTotal, setFloorTotal] = useState(0)

  useEffect(() => {
    if (!active) return
    ;(async () => {
      const serverRender = await fetch(
        window.location.href.split(/[?#]/)[0],
      ).then((res) => res.text())
      const address = (serverRender.match(
        new RegExp(`${shortenedAddress.replace('...', '[a-z0-9]+?')}`, 'i'),
      ) || [])[0]
      if (!address) return

      const collections = await fetchAllCollectionsForUser(address)
      await Promise.all(
        collections.map(async ({ slug, ownedCount }) => {
          const floor = await fetchFloorPrice(slug)
          setFloorTotal((total) => total + floor.price * ownedCount)
          setProgress(({ numLoaded }) => ({
            total: collections.length,
            numLoaded: numLoaded + 1,
            complete: numLoaded + 1 >= collections.length,
          }))
        }),
      )
    })()
  }, [shortenedAddress, active])

  return (
    <Box px={3} width="100vw" maxWidth="480px">
      <Flex
        bg={useColorModeValue('gray.50', 'gray.700')}
        color={useColorModeValue('gray.700', 'white')}
        width="100%"
        borderRadius="md"
        border="1px solid"
        minHeight="90px"
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
          flipped
          position="absolute"
          opacity={0.35}
          width="60px"
          height="60px"
          top="50%"
          right="8px"
          transform="translateY(-50%)"
        />
        {active ? (
          <>
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
                    {progress.numLoaded
                      ? Math.round(floorTotal * 100) / 100
                      : null}
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
                      ? Math.round((floorTotal / progress.numLoaded) * 100) /
                        100
                      : null}
                  </Text>
                  {!progress.complete ? (
                    <Spinner size="sm" mx="2" mt="-3px" />
                  ) : null}
                </StatNumber>
              </Stat>
            </HStack>
          </>
        ) : (
          <Button onClick={() => setActive(true)} variant="outline">
            Calculate Collection Value
          </Button>
        )}
      </Flex>
    </Box>
  )
}

export default ProfileSummary
