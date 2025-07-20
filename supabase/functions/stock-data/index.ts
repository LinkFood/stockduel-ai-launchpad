// @ts-ignore
const { serve } = Deno

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StockDataRequest {
  symbols: string[]
  type?: 'current' | 'historical'
  interval?: '1m' | '5m' | '15m' | '1h' | '1d' | '1wk'
  range?: string
}

interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  high: number
  low: number
  open: number
  previousClose: number
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { symbols, type = 'current', interval = '1d', range = '1d' }: StockDataRequest = await req.json()

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: 'symbols array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Fetching ${type} data for symbols:`, symbols)

    const results: Record<string, MarketData | null> = {}

    // Fetch data for each symbol
    for (const symbol of symbols) {
      try {
        const data = await fetchStockData(symbol, type, interval, range)
        results[symbol] = data
        console.log(`Successfully fetched data for ${symbol}:`, data?.price)
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error)
        results[symbol] = null
      }
    }

    return new Response(
      JSON.stringify({ data: results }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in stock-data function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function fetchStockData(
  symbol: string, 
  type: string, 
  interval: string, 
  range: string
): Promise<MarketData | null> {
  try {
    // Using Yahoo Finance API from backend (no CORS issues)
    const baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart'
    const url = `${baseUrl}/${symbol}?interval=${interval}&range=${range}`
    
    console.log(`Fetching from URL: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      console.error(`HTTP error for ${symbol}! status: ${response.status}`)
      return null
    }
    
    const data = await response.json()
    return parseYahooData(symbol, data)
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error)
    return null
  }
}

function parseYahooData(symbol: string, yahooResponse: any): MarketData | null {
  try {
    const result = yahooResponse.chart?.result?.[0]
    if (!result) {
      console.error(`No chart result for ${symbol}`)
      return null
    }

    const meta = result.meta
    const quotes = result.indicators?.quote?.[0]
    
    if (!meta || !quotes) {
      console.error(`Missing meta or quotes data for ${symbol}`)
      return null
    }

    // Get the latest values
    const timestamps = result.timestamp || []
    const lastIndex = timestamps.length - 1
    
    if (lastIndex < 0) {
      console.error(`No timestamp data for ${symbol}`)
      return null
    }

    const close = quotes.close
    const open = quotes.open
    const high = quotes.high
    const low = quotes.low
    const volume = quotes.volume

    const currentPrice = meta.regularMarketPrice || close[lastIndex] || 0
    const previousClose = meta.previousClose || close[lastIndex - 1] || currentPrice
    const change = currentPrice - previousClose
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0

    const stockData: MarketData = {
      symbol: symbol.toUpperCase(),
      price: Number(currentPrice.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume: meta.regularMarketVolume || volume[lastIndex] || 0,
      high: meta.regularMarketDayHigh || Math.max(...high.filter((h: any) => h !== null)) || currentPrice,
      low: meta.regularMarketDayLow || Math.min(...low.filter((l: any) => l !== null)) || currentPrice,
      open: meta.regularMarketOpen || open[0] || currentPrice,
      previousClose: previousClose
    }

    console.log(`Parsed data for ${symbol}:`, stockData)
    return stockData

  } catch (error) {
    console.error(`Error parsing Yahoo data for ${symbol}:`, error)
    return null
  }
}