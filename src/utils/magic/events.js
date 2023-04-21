import { getNumberWithOrdinal } from '@videre/database';

/**
 * Formats MTGO Event urls to prettified event name.
 */
export const formatEvent = function(url, uid, date) {
  return `${
    url.toLowerCase()
      .split("https://magic.wizards.com/en/articles/archive/mtgo-standings/")[1]
      .replace(/[0-9]/g, '')
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
      .join(' ')
      .replace(/\s\s+/g, ' ')
      .trim()
    } #${uid} (${
        (new Date(date
          .split('/')
          .map((s) => parseInt(s))
          .join('/')
        )).toDateString()
          .split(' ')
          .slice(0, -1)
          .map((s) => isNaN(s) ? s : getNumberWithOrdinal(parseInt(s)))
          .join(', ')
          .replace(/, ([^,]*)$/, ' $1')
    })`;
};