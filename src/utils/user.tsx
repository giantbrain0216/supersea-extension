import React, { useContext, useState, useEffect } from 'react'
import { getUser } from '../utils/api'

export const SUBSCRIBER_ROLES = ['SUBSCRIBER', 'MEMBER', 'ADMIN']
export const FOUNDER_ROLES = ['MEMBER', 'ADMIN']

export type User = {
  isSubscriber: boolean
  isFounder: boolean
  role: 'FREE' | 'MEMBER' | 'SUBSCRIBER' | 'ADMIN'
}

const userContext = React.createContext<User | null>(null)
export const useUser = () => {
  return useContext(userContext)
}

export const UserProvider = ({
  children,
  allowNullUser = false,
  mockUser,
  loadFromBackgroundScript = false,
}: React.PropsWithChildren<{
  mockUser?: { role: User['role'] }
  allowNullUser?: boolean
  loadFromBackgroundScript?: boolean
}>) => {
  const { Provider } = userContext
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    ;(async () => {
      const user = await (() => {
        if (mockUser) {
          return new Promise<typeof mockUser>((resolve) =>
            setTimeout(() => resolve(mockUser), 250),
          )
        }
        if (loadFromBackgroundScript) {
          return new Promise<{ role: User['role'] }>((resolve) => {
            chrome.runtime.sendMessage({ method: 'getUser' }, (user) =>
              resolve(user),
            )
          })
        }
        return getUser()
      })()
      const role = user?.role || 'FREE'

      setUser({
        isSubscriber: isSubscriber(role),
        isFounder: isFounder(role),
        role,
      })
    })()
  }, [mockUser, loadFromBackgroundScript])

  if (!user && !allowNullUser) return null

  return <Provider value={user}>{children}</Provider>
}

export const isSubscriber = (role: User['role']) =>
  Boolean(SUBSCRIBER_ROLES.includes(role))

export const isFounder = (role: User['role']) =>
  Boolean(FOUNDER_ROLES.includes(role))
