import React, { useState } from 'react'
import {
  Icon,
  IconButton,
  Tooltip,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import { FaShoppingCart } from 'react-icons/fa'
import Toast from './Toast'
import { useExtensionConfig } from '../utils/extensionConfig'
import { useUser } from '../utils/user'

export const BuyNowButtonUI = ({
  address,
  tokenId,
  active,
}: {
  address: string
  tokenId: string
  active: boolean
}) => {
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)

  return (
    <Tooltip
      label={active ? 'Quick Buy' : 'Activate Quick Buy'}
      fontSize="xs"
      hasArrow
      bg="gray.700"
      placement="top"
      color="white"
      px="2"
      py="1"
    >
      <IconButton
        icon={
          <Icon as={FaShoppingCart} color="white" width="14px" height="14px" />
        }
        width="32px"
        minWidth="auto"
        height="24px"
        borderRadius="lg"
        isLoading={isLoading}
        bg={useColorModeValue(
          active ? 'blue.500' : 'gray.500',
          active ? 'blue.400' : 'gray.500',
        )}
        _hover={{
          bg: useColorModeValue(
            active ? 'blue.400' : 'gray.400',
            active ? 'blue.300' : 'gray.400',
          ),
        }}
        _active={{
          bg: useColorModeValue(
            active ? 'blue.300' : 'gray.300',
            active ? 'blue.200' : 'gray.300',
          ),
        }}
        boxShadow={useColorModeValue(
          '0 1px 2px rgba(0, 0, 0, 0.1)',
          '0 1px 2px rgba(0, 0, 0, 0.15)',
        )}
        aria-label="Buy Now"
        onClick={() => {
          if (active) {
            setIsLoading(true)
            window.postMessage({
              method: 'SuperSea__Buy',
              params: { address, tokenId },
            })
            // Listen for errors, unsubscribe
            const messageListener = (event: any) => {
              if (
                event.data.method === 'SuperSea__Buy__Error' &&
                event.data.params.address === address &&
                event.data.params.tokenId === tokenId
              ) {
                if (!/user denied/i.test(event.data.params.error.message)) {
                  toast({
                    duration: 7500,
                    position: 'bottom-right',
                    render: () => (
                      <Toast
                        text={
                          "Unable to buy item. This is most likely because the item is no longer listed, or because there aren't enough funds in your wallet."
                        }
                        type="error"
                      />
                    ),
                  })
                }
                window.removeEventListener('message', messageListener)
                setIsLoading(false)
              } else if (
                event.data.method === 'SuperSea__Buy__Success' &&
                event.data.params.address === address &&
                event.data.params.tokenId === tokenId
              ) {
                window.removeEventListener('message', messageListener)
                setIsLoading(false)
              }
            }

            window.addEventListener('message', messageListener)
          } else {
            chrome.runtime.sendMessage({
              method: 'openPopup',
              params: { action: 'activateQuickBuy' },
            })
          }
        }}
      />
    </Tooltip>
  )
}

const BuyNowButton = (
  props: Omit<React.ComponentProps<typeof BuyNowButtonUI>, 'active'>,
) => {
  const [config] = useExtensionConfig()
  const user = useUser()
  if (config === null || user === null || !user.isFounder) return null
  return <BuyNowButtonUI {...props} active={config.quickBuyEnabled} />
}

export default BuyNowButton
