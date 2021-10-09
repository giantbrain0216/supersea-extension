import React, { useContext } from 'react'

export const MEMBER_ROLES = ['SUBSCRIBER', 'MEMBER', 'ADMIN']

export type User = {
  isMember: boolean
}

const userContext = React.createContext<User | null>(null)
export const useUser = () => {
  return useContext(userContext)
}

export const UserProvider = userContext.Provider
