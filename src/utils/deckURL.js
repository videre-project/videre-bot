export const extractURL = (msg) => {
  const url = msg.match(/(https?:\/\/[^\s]+)/g)[0]
    if (
      (url.includes('magic.wizards.com/en/articles/archive/mtgo-standings/') && url.includes('#')) ||
      url.includes('mtggoldfish.com/deck/') ||
      (url.includes('scryfall.com/') && url.includes('/decks/')) ||
      url.includes('tappedout.net/mtg-decks/')
    ) return url;
  };