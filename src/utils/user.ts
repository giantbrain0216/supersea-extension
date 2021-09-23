import React, { useContext } from 'react'

export type User = {
  isMember: boolean
}

const userContext = React.createContext<User | null>(null)
export const useUser = () => {
  return useContext(userContext)
}

export const UserProvider = userContext.Provider
