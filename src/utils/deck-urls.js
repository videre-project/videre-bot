export const extractUrls = (text) => {
  const regex = /((\w+:\/\/\S+)|(\w+[\.:]\w+\S+))[^\s,\.]/ig;
  return text.match(regex);
}

export const matchDeckUrl = (msg) => {
  const url = msg?.match(/(https?:\/\/[^\s]+)/g)?.[0]
  if (!url) return;
  if (
    // (url.includes('magic.wizards.com/en/articles/archive/mtgo-standings/') && url.includes('#'))
    url.includes('mtggoldfish.com/deck/')
    || (url.includes('scryfall.com/') && url.includes('/decks/'))
    || url.includes('tappedout.net/mtg-decks/')
    || (url.includes('moxfield.com/') && url.includes('/decks/'))
  ) return url;
};

export default matchDeckUrl;