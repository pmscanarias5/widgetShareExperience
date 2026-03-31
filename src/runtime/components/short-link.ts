import { urlUtils } from 'jimu-core'
import { ErrorInfo } from '../../config'

export const DEFAULT_SHORTENER_SERVICE_URL = 'https://arcg.is/prod/shorten'

const getShortLinkFromPayload = (payload: any): string => {
  const shortLink = payload?.urlCorta ?? payload?.data?.url ?? payload?.url ?? payload?.shortUrl ?? payload?.short_url ?? ''
  return typeof shortLink === 'string' ? shortLink.trim() : ''
}

export async function fetchShortLink (href: string, shortenerServiceUrl?: string): Promise<any> {
  const DEBUG = false
  const URL_MAX_LENGTH = 1980
  const serviceUrl = shortenerServiceUrl || DEFAULT_SHORTENER_SERVICE_URL

  const promise = new Promise((resolve, reject) => {
    let uri = href// location.href;
    uri = uri.replace(/\/$/, '')
    //uri = encodeURIComponent(uri) // can't encode url again
    uri = urlUtils.updateQueryStringParameter(serviceUrl, 'url', uri) // DO NOT encode BITLY_URL+param
    uri = urlUtils.updateQueryStringParameter(uri, 'f', 'json')
    // uri = 'https://10.67.33.52/php/acortador.php?url=https://elpais.com'
    fetch(uri).then(async response => await response.text())
      .then(responseText => {
        let payload: any = responseText

        try {
          payload = JSON.parse(responseText)
        } catch (error) {
          payload = responseText
        }

        const shortLink = typeof payload === 'string' ? payload.trim() : getShortLinkFromPayload(payload)
        if (DEBUG) {
          console.log('Response payload:', payload)
          console.log('A:long_url==>' + payload?.data?.long_url)
          console.log('B:s_url==>' + shortLink)
        }

        if (shortLink === '' && (payload?.data?.hash?.includes('maximum allowed'))) {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject({ href, reason: ErrorInfo.UrlIsTooLong })
        } else {
          // Successfully fetch shortLink
          resolve(shortLink)
        }
      })
      .catch(error => {
        console.log('Share: short-link, Fetch Error: ', error)

        let reason = ErrorInfo.NetworkFailed
        if (error.message === 'Failed to fetch' && href.length > URL_MAX_LENGTH) {
          reason = ErrorInfo.UrlIsTooLong
        }

        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject({ href, reason })
      })
  })
  return promise
}
