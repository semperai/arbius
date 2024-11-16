export async function fetchArbiusData() {
  const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=AIUS`;

  const apiKey = process.env.NEXT_PUBLIC_COINT_MARKET_API_KEY;
  
  if (!apiKey) {
    console.error('CoinMarketCap API key is not configured');
    return {};
  }

  const headers = new Headers();
  headers.append('X-CMC_PRO_API_KEY', apiKey);
  headers.append('Accept', '*/*');

  const requestOptions = {
    method: 'GET',
    headers,
    redirect: 'follow' as 'follow' | 'error' | 'manual', // hack to fix TS error
    next: { revalidate: 0 },
  };

  try {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      console.error(response);
      throw new Error(`Error fetching Airbus data: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (e: any) {
    console.error('Fetch error', e);
    return {};
  }
}
