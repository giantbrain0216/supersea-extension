import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Text,
  Flex,
  Icon,
  IconButton,
  Heading,
  Link,
  VStack,
  Divider,
  Skeleton,
  useToast,
} from '@chakra-ui/react'
import queryString from 'query-string'

import { FaGithub } from 'react-icons/fa'
import { ReactComponent as DiscordSvg } from '../../assets/discord.svg'
import { ReactComponent as OpenSeaSvg } from '../../assets/opensea.svg'
import { ReactComponent as EtherscanSvg } from '../../assets/etherscan.svg'
import { ReactComponent as LogoSvg } from '../../assets/logo.svg'
import QuickBuyToggle from './QuickBuyToggle'
import GlobalToggle from './GlobalToggle'
import { useExtensionConfig } from '../../utils/extensionConfig'
import { useUser } from '../../utils/user'

const Popup = () => {
  const [isChanged, setIsChanged] = useState(false)
  const [extensionConfig, setExtensionConfig] = useExtensionConfig()
  const user = useUser()
  const quickBuyToggleRef = useRef<HTMLInputElement | null>(null)
  const toast = useToast()
  useEffect(() => {
    if (!extensionConfig) return
    const query = queryString.parse(window.location.search)
    if (query.action === 'activateQuickBuy') {
      quickBuyToggleRef.current?.focus()
      quickBuyToggleRef.current?.scrollIntoView({
        behavior: 'smooth',
      })
    }
  }, [extensionConfig])

  useEffect(() => {
    if (isChanged) {
      toast({
        duration: 2500,
        position: 'bottom',
        render: () => (
          <Box bg={'blue.600'} borderRadius="md" px="3" py="3" mx="2">
            <Text color="white" fontWeight="600">
              Saved! Refresh any active OpenSea tabs to apply changes.
            </Text>
          </Box>
        ),
      })
    }
  }, [isChanged, toast])

  return (
    <Box
      width="400px"
      fontSize="16px"
      maxHeight="550px"
      overflow="auto"
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '24px',
        },
      }}
    >
      <Box px="4">
        <Box
          borderRadius="full"
          background="white"
          width="60px"
          height="60px"
          borderWidth="5px"
          borderColor="blue.500"
          position="relative"
          my="4"
        >
          <Icon
            as={LogoSvg}
            position="absolute"
            top="-5px"
            left="-5px"
            color="blue.500"
            width="60px"
            height="60px"
          />
        </Box>
        <Text pr="5" opacity={0.9}>
          SuperSea improves OpenSea by injecting extra components into the
          website. Look for the whale logo to see what we've added!
        </Text>

        <VStack
          spacing="4"
          divider={<Divider borderColor="gray.600" />}
          alignItems="flex-start"
        >
          <Box mt="6">
            <Heading as="h2" size="lg">
              Settings
            </Heading>
          </Box>
          {extensionConfig && user
            ? [
                <GlobalToggle
                  key="globalToggle"
                  isChecked={extensionConfig.enabled}
                  onChange={(enabled) => {
                    setIsChanged(true)
                    setExtensionConfig({
                      ...extensionConfig,
                      enabled,
                    })
                  }}
                />,
                <QuickBuyToggle
                  key="quickBuyToggle"
                  user={user}
                  isDisabled={!extensionConfig.enabled}
                  isChecked={extensionConfig.quickBuyEnabled}
                  switchRef={quickBuyToggleRef}
                  onChange={(quickBuyEnabled) => {
                    setIsChanged(true)
                    setExtensionConfig({
                      ...extensionConfig,
                      quickBuyEnabled,
                    })
                  }}
                />,
              ]
            : ['80px', '40px', '120px'].map((height, i) => (
                <Skeleton key={i} height={height} width="100%" />
              ))}
        </VStack>
      </Box>
      <Flex
        alignItems="center"
        justifyContent="space-between"
        mt="8"
        bg="gray.900"
        py="1"
        px="4"
      >
        <Link
          href="https://nonfungible.tools"
          target="_blank"
          fontSize="14px"
          fontWeight="500"
          opacity={0.9}
        >
          Non Fungible Tools
        </Link>
        <Flex>
          <IconButton
            as="a"
            target="_blank"
            href="https://discord.gg/MR2Cn929wQ"
            icon={<Icon as={DiscordSvg} width="24px" height="24px" />}
            aria-label="Join Discord"
            p="2"
            bg="transparent"
            opacity={0.7}
            _hover={{ opacity: 1 }}
          />
          <IconButton
            as="a"
            target="_blank"
            href="https://opensea.io/collection/non-fungible-tools-membership"
            icon={<Icon as={OpenSeaSvg as any} width="24px" height="24px" />}
            aria-label="OpenSea Membership Collection"
            p="2"
            bg="transparent"
            opacity={0.7}
            _hover={{ opacity: 1 }}
          />{' '}
          <IconButton
            as="a"
            target="_blank"
            href="https://etherscan.io/address/0x24E047001f0Ac15f72689D3F5cD0B0f52b1abdF9"
            icon={<Icon as={EtherscanSvg as any} width="24px" height="24px" />}
            aria-label="Contract on Etherscan"
            p="2"
            bg="transparent"
            opacity={0.7}
            _hover={{ opacity: 1 }}
          />
          <IconButton
            as="a"
            target="_blank"
            href="https://github.com/minmax-gg/supersea"
            icon={<Icon as={FaGithub} width="24px" height="24px" />}
            aria-label="GitHub Source Code"
            p="2"
            bg="transparent"
            opacity={0.7}
            _hover={{ opacity: 1 }}
          />
        </Flex>
      </Flex>
    </Box>
  )
}

export default Popup
