import React from 'react'
import { SimpleGrid, Button } from '@chakra-ui/react'

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
  return (
    <SimpleGrid spacing="3" {...rest}>
      {options.map(({ name, label }) => {
        const isActive = active.includes(name)
        return (
          <Button
            key={name}
            bg={isActive ? 'blue.500' : undefined}
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
