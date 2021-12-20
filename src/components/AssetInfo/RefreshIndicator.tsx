import { Tag, useColorModeValue, Spinner, Text } from '@chakra-ui/react'
import { CheckIcon, CloseIcon } from '@chakra-ui/icons'
import { motion } from 'framer-motion'

export type RefreshState = 'IDLE' | 'QUEUING' | 'QUEUED' | 'FAILED'

const RefreshIndicator = ({ state = 'IDLE' }: { state: RefreshState }) => {
  const spinnerColor = useColorModeValue('gray.500', 'white')
  const backgroundColors = useColorModeValue(
    {
      IDLE: 'gray.100',
      QUEUING: 'gray.100',
      QUEUED: 'green.400',
      FAILED: 'red.400',
    },
    {
      IDLE: 'gray.500',
      QUEUING: 'gray.500',
      QUEUED: 'green.500',
      FAILED: 'red.500',
    },
  )
  const isCompletedState = state === 'QUEUED' || state === 'FAILED'
  return (
    <motion.div
      style={{ pointerEvents: 'none' }}
      animate={{
        y: state === 'QUEUING' ? 0 : 10,
        opacity: state === 'QUEUING' ? 1 : 0,
      }}
      transition={{
        y: {
          type: 'spring',
          stiffness: 400,
          damping: 15,
          delay: isCompletedState ? 0.75 : 0,
        },
        default: { duration: 0.1, delay: isCompletedState ? 0.8 : 0 },
      }}
      initial={false}
    >
      <motion.div
        animate={{
          y: isCompletedState ? [0, -2, 0] : 0,
        }}
        transition={{ duration: 0.15 }}
        initial={false}
      >
        <Tag
          size="sm"
          minWidth="74px"
          bg={backgroundColors[state]}
          fontSize="11px"
          boxShadow={useColorModeValue(
            '0 1px 2px rgba(0, 0, 0, 0.05)',
            '0 1px 2px rgba(0, 0, 0, 0.075)',
          )}
        >
          {state === 'QUEUING' && (
            <Text>
              <Spinner
                color={spinnerColor}
                width="8px"
                height="8px"
                mr="5px"
                verticalAlign="middle"
                position="relative"
                top="-1px"
              />
              Queuing
            </Text>
          )}
          {state === 'QUEUED' && (
            <Text color="white">
              <CheckIcon
                color="white"
                width="8px"
                height="auto"
                mr="5px"
                position="relative"
                top="-1px"
              />
              Queued
            </Text>
          )}
          {state === 'FAILED' && (
            <Text color="white">
              <CloseIcon
                color="white"
                width="8px"
                height="auto"
                mr="5px"
                position="relative"
                top="-1px"
              />
              Failed
            </Text>
          )}
        </Tag>
      </motion.div>
    </motion.div>
  )
}

export default RefreshIndicator
