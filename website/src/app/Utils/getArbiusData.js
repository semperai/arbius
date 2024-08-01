export async function fetchArbiusData() {

    const apiKey = process.env.NEXT_PUBLIC_COINT_MARKET_API_KEY;
    console.log(apiKey);

    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=AIUS`;

    const myHeaders = new Headers();
    myHeaders.append('X-CMC_PRO_API_KEY', apiKey);
    myHeaders.append('Accept', '*/*');


    const requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow',
        next: { revalidate: 60 },
    };


    const response = await fetch(url, requestOptions);
    if (!response.ok) {
        throw new Error(`Error fetching Airbus data: ${response.statusText}`);

    }
    const data = await response.json();
    return data;
}