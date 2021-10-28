import React from 'react'
import { SimpleGrid, Button, useColorModeValue } from '@chakra-ui/react'

const ButtonOptions = <
  Options extends {
    name: string
    label: string
  }[]
>({
  options,
  active,
  onChange,
  ...rest
}: {
  options: Options
  active: Options[number]['name'][]
  onChange: (active: Options[number]['name'][]) => void
} & Omit<React.ComponentProps<typeof SimpleGrid>, 'onChange'>) => {
  const inactiveBg = useColorModeValue('gray.100', 'whiteAlpha.200')
  return (
    <SimpleGrid spacing="3" {...rest}>
      {options.map(({ name, label }) => {
        const isActive = active.includes(name)
        return (
          <Button
            key={name}
            fontWeight="400"
            color={isActive ? 'white' : undefined}
            bg={isActive ? 'blue.500' : inactiveBg}
            _hover={{ bg: isActive ? 'blue.400' : undefined }}
            _active={{ bg: isActive ? 'blue.300' : undefined }}
            onClick={() => {
              onChange(
                isActive
                  ? active.filter((_name) => _name !== name)
                  : active.concat([name]),
              )
            }}
          >
            {label}
          </Button>
        )
      })}
    </SimpleGrid>
  )
}

export default ButtonOptions
