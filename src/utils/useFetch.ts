import fetch from 'node-fetch'

async function useFetch(url?: string, method: string = 'GET', body?: object) {
  const response = await fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data?.error || response.status === 500) throw new Error(data.error || 'There was a problem with our server. Try again later.');

  return data;
}

export default useFetch
