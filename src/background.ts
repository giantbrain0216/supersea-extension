/* global chrome */
import { gql } from 'graphql-request'
import _ from 'lodash'
import queryString from 'query-string'

let savedOpenSeaHeaders: Record<string, string> = {}
const HEADERS_OF_INTEREST = [
  'Authorization',
  'X-API-KEY',
  'X-VIEWER-ADDRESS',
  'X-BUILD-ID',
]

// Capture API key headers from OpenSea for more favorable rate limits
// when performing custom graphql requests
chrome.webRequest.onBeforeSendHeaders.addListener(
  ({ requestHeaders, tabId }) => {
    if (requestHeaders && tabId) {
      const keyedHeaders = _.keyBy(requestHeaders, 'name')
      if (keyedHeaders['x-signed-query']?.value === 'SuperSea') {
        return {
          requestHeaders: requestHeaders.filter(
            ({ name }) => name !== 'x-signed-query',
          ),
        }
      }
      savedOpenSeaHeaders = HEADERS_OF_INTEREST.reduce<Record<string, string>>(
        (acc, header) => {
          acc[header] =
            keyedHeaders[header]?.value || savedOpenSeaHeaders[header]
          return acc
        },
        {},
      )
      chrome.storage.local.set({ openSeaHeaders: savedOpenSeaHeaders })
    }
  },
  { urls: ['https://api.opensea.io/*'] },
  ['requestHeaders'],
)

const refreshTokenMutation = gql`
  mutation RefreshToken {
    refreshToken {
      success
      accessToken
      account {
        role
      }
    }
  }
`

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.method === 'fetch') {
    fetch(request.params.url)
      .then((res) => res.json())
      .then((res) => {
        sendResponse(res)
      })
  } else if (request.method === 'ping') {
    sendResponse('pong')
  } else if (request.method === 'openPopup') {
    const createWindow = (params = {}) => {
      chrome.windows.create({
        url: `index.html?${queryString.stringify(request.params)}`,
        type: 'panel',
        width: 400,
        height: 550,
        ...params,
      })
    }
    chrome.windows
      .getLastFocused()
      .then((window) => {
        const top = window.top || 0
        const left = (window.left || 0) + (window.width || 400) - 400
        createWindow({ left, top })
      })
      .catch(() => {
        createWindow()
      })
  } else if (request.method === 'getUser') {
    // Can't use graphl-request because it depends on XMLHttpRequest,
    // which isn't available in backgtround scripts
    fetch('https://api.nonfungible.tools/graphql', {
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: refreshTokenMutation }),
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((json) => {
        const {
          refreshToken: { accessToken, account },
        } = json.data

        sendResponse({ accessToken, role: account?.role || 'FREE' })
      })
  }
  return true
})

chrome.webRequest.onResponseStarted.addListener(
  ({ responseHeaders }) => {
    const rateLimitHeader =
      responseHeaders &&
      responseHeaders.find(({ name }) => name === 'x-ratelimit-remaining')
    if (rateLimitHeader) {
      chrome.storage.local.set({
        openSeaRateLimitRemaining: +(rateLimitHeader.value || 0),
      })
    }
  },
  { urls: ['https://api.opensea.io/*'] },
  ['responseHeaders'],
)
