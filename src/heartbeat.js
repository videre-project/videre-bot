import chalk from 'chalk';

import { setDelay } from '@videre/database';

import getCardPreviews from 'utils/card-previews';

/**
 * Update bot status on startup & heartbeat time-out.
 */
let status;
async function updateStatus(client, i) {
  function setStatus() {
    client.user.setPresence({
      status: 'online',
      activities: [
        {
          name: 'feedback • /help',
          type: 'LISTENING',
        }
      ]
    });
  };
  function getStatus(check=true) {
    const activities = client.user?.presence?.activities;
    // Check for status update
    const _status = activities?.length
      ? 'connected'
      : 'disconnected';
    if (_status == status) return;
    else status = _status;

    // Log network change
    console.log(
      ...(activities?.length
        ? [chalk.green('[Network]'),'Reconnected at']
        : [chalk.red('[Network]'),'Disconnected at']),
      (new Date())
        .toLocaleString()
        .replace(' at', ' on ')
        .replace(', ', ' at ')
    );

    // Attempt heartbeat update.
    if (check && !activities) getStatus(false);
    return activities;
  };
  
  // Update activities cache on initialization
  if (i === 0) {
    setStatus();
    status = 'connected';
    return client.user?.presence?.activities;
  } else if (i >= 1) {
    // Check Discord status for heartbeat disconnect
    getStatus();
  }
};
 
 /**
  * Update Discord w/ set spoilers
  */
async function cardPreviews(client) {
  const channel = await client.channels.fetch('968810337208000552');
  const messages = await channel.messages.fetch({ limit: 100 });

  const revealedCards = messages
    .map(({ author: { id }, embeds }) => {
      if (id !== '467098288093528064') return;
      return embeds.map(({ footer }) => footer.text);
    })
    .filter(Boolean)
    .reverse()
    .flat(1);
  if (!revealedCards?.length) return;

  const previews = await getCardPreviews(client, revealedCards);
  if (!previews?.length) return;

  // return await channel.send(previews.slice(-1)[0])
  //   .then(msg => msg.crosspost());

  for (let i = 0; i < previews.length; i++) {
    await channel.send(previews[i])
      .then(msg => msg.crosspost());
    // Allow up to 10 requests / second for Discord rate limits
    await setDelay(1000/(50 - 40));
  };
};
 
/**
* Handle heartbeat sync tasks
*/
function syncHeartbeat(client, i=0) {
  setTimeout(async () => {
    // Run every 10 seconds after 30 seconds
    await updateStatus(client, i);
    // Run every 5 minutes
    if (i == 30) {
      // await cardPreviews(client);
      i = 1;
    } else i++;
    // Loop every 10 seconds
    syncHeartbeat(client, i);
  }, 10 * 1000);
}

export default syncHeartbeat;