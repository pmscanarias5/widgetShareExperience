import { fetchShortLink } from '../src/runtime/components/short-link'

describe('fetchShortLink', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

  it('uses custom shortener service url and parses {url}', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      text: async () => JSON.stringify({ url: 'https://mi.dom/inio' })
    })
    global.fetch = fetchMock as any

    const longUrl = 'https://example.com/experience/1/'
    const endpoint = 'https://mi-dominio.com/shortener.php'
    const shortUrl = await fetchShortLink(longUrl, endpoint)

    expect(shortUrl).toBe('https://mi.dom/inio')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain(endpoint)
    expect(fetchMock.mock.calls[0][0]).toContain('longUrl=https%3A%2F%2Fexample.com%2Fexperience%2F1%2F')
  })

  it('supports plain text responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      text: async () => 'https://corta.ly/abc123\n'
    }) as any

    const shortUrl = await fetchShortLink('https://example.com/experience/2/', 'https://mi-dominio.com/shortener.php')
    expect(shortUrl).toBe('https://corta.ly/abc123')
  })
})
