import fetch from 'node-fetch';

import { manamoji } from './magic';

import { setDelay, toPascalCase } from '@videre/database';

async function mapCardEmbeds(client, data) {
  return await Promise.all(
    data
      .map(async data => {
        const cardTitle = !data?.card_faces
          ? manamoji(
            client,//.guilds.resolve(config.emojiGuild),
            `${data.name} ${data.mana_cost}`
          ) : manamoji(
            client,//.guilds.resolve(config.emojiGuild),
            [
              `${data.card_faces[0].name} ${data.card_faces[0].mana_cost}`,
              `${data.card_faces[1].name} ${data.card_faces[1].mana_cost}`
            ].join(' // ')
          );

        const cardText = [...(data?.card_faces || [data])]
          .map((
            {
              name,
              mana_cost,
              type_line,
              oracle_text,
              flavor_text,
              power,
              toughness,
              loyalty
            }) =>
              manamoji(
                client,//.guilds.resolve(config.emojiGuild),
                [
                  (data?.card_faces)
                    && `**${name}** ${mana_cost}\n`,
                  [type_line, oracle_text?.replace(/\*/g, '\\*')]
                    .join('\n')
                    .replace(/(\([^)]+\))/g, '*$1*')
                ].join('') 
              ) + [
                (flavor_text)
                  && `\n*${flavor_text.replace(/\*/g, '')}*`,
                (power && toughness)
                  && `\n${power.replace(/\*/g, '\\*')}/${toughness.replace(/\*/g, '\\*')}`,
                (loyalty)
                  && `\nLoyalty: ${loyalty.replace(/\*/g, '\\*')}`
              ].join('')
          ).join("\n---------\n");

        const thumbnailImage = !data?.card_faces
          ? data?.image_uris?.png || []
          : (!data.card_faces[0]?.image_uris
            ? data.image_uris.png
            : data.card_faces[0].image_uris.png);
        
        const footerText = [
          // Artist
          `🖌 ${data.artist}`,
          // Set
          `${data.set.toUpperCase()} (${data.lang.toUpperCase()}) #${data.collector_number}`,
          // Rarity
          data.rarity.replace(/^\w/, (c) => c.toUpperCase()),
        ].join(' • ');

        const embedColor = [
          // LIGHT_GREY, colorless
          !data?.colors?.length
            && '#BCC0C0',
          // GOLD, multicolor
          data?.colors?.length > 1
            && '#F1C40F', 
          // *CUSTOM, white
          data?.colors?.includes('W')
            && 'FFFCB0',
          // BLUE, blue
          data?.colors?.includes('U')
            && '#3498DB',
          // *CUSTOM, black
          data?.colors?.includes('B')
            && '#281330',
          // RED, red
          data?.colors?.includes('R')
            && '#E74C3C',
          // GREEN, green
          data?.colors?.includes('G')
            && '#2ECC71'
        ].filter(Boolean);

        const embed = {
          author: {
            // name: `${set_name} • Source: ${data.preview.source}`,
            name: `Source: ${data.preview.source}`,
            url: data.preview.source_uri,
            // icon_url: icon_svg_uri,
            iconURL: 'https://cdn.discordapp.com/emojis/968873246915166218.webp?size=240&quality=lossless',
          },
          title: cardTitle,
          url: data.scryfall_uri.replace(/\?utm_source.*$/,''),
          description: cardText,
          thumbnail: { url: thumbnailImage },
          timestamp: new Date(),
          footer: { text: footerText },
          color: embedColor[0]
        };

        return embed;
      })
  );
};

export default async function getCardPreviews(client, existing) {
  let data = await fetch(`https://api.scryfall.com/cards/search?q=(not:arenaid%20not:mtgoid)&unique=cards&order=spoiled&page=1`)
    .then(res => res.json())
    .then(json =>
      json.data
        // Get 100 latest previewed cards
        .filter(({ preview }) => preview?.previewed_at)
        .sort((_a,_b) => {
          const a = new Date(_a.preview.previewed_at).getTime();
          const b = new Date(_b.preview.previewed_at).getTime();
          return a > b ? -1 : 1;
        }).slice(0, 100)
        // Invert sort to order spoiled
        /**.sort((_a,_b) => {
          const a = new Date(_a).getTime();
          const b = new Date(_b).getTime();
          return a < b ? -1 : 1;
        })*/
        .reverse()
    );

  // Filter out already spoiled cards.
  const _footerMocks = data
    .map(({ artist, set, lang, collector_number, rarity }) => {
      return [
        // Artist
        `🖌 ${artist}`,
        // Set
        `${set.toUpperCase()} (${lang.toUpperCase()}) #${collector_number}`,
        // Rarity
        rarity.replace(/^\w/, (c) => c.toUpperCase()),
      ].join(' • ');
    });
  const cutIdx = _footerMocks
    .indexOf((existing || []).slice(-1)?.[0]);

  // By default, all cards are free to be spoiled
  if (cutIdx > 0) {
    // Remove any spoiled cards if any new ones exist
    if (data?.length - 1 > cutIdx + 1) {
      data = data.slice(cutIdx + 1, -1);
    } else {
      // Get last card if only 1 new card is left
      if (_footerMocks?.slice(-1)?.[0] !== existing?.slice(-1)?.[0]) {
        data = data.slice(-1);
      } else {
        // Otherwise no new cards are to be spoiled
        return;
      }
    };
  };

  // Get array of unique dates & sets for spoiled cards
  const dates = data
    .map(({ preview: { previewed_at } }) => previewed_at)
    .filter((v, i, a) => a.indexOf(v) === i);

  const sets = data
    .map(({ set }) => set)
    .filter((v, i, a) => a.indexOf(v) === i);

  let messages = [];
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];

    for (let i = 0; i < sets.length; i++) {
      const set = sets[i];
      const setGroup = data
        .filter(({ preview: { previewed_at }, set: _set }) =>
          previewed_at === date
          && _set == set
        );
      if (!setGroup?.length) continue;

      const _data = setGroup
        .map((e, i) => i % 10 === 0 && setGroup.slice(i, i + 10))
        .filter(e => typeof(e) !== 'boolean');

      let embeds = await mapCardEmbeds(client, _data[0]);

      const {
        name: set_name,
        scryfall_uri,
        released_at,
        // card_count,
        set_type,
        // icon_svg_uri: icon_uri,
      } = await fetch(`https://api.scryfall.com/sets/${set}`)
        .then(res => res.json());

      // Handles SLD drops
      const _released_at = _data[0]
        .map(({ released_at }) => released_at)
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort((_a,_b) => {
          const a = new Date(_a).getTime();
          const b = new Date(_b).getTime();
          return a > b ? -1 : 1;
        })?.[0];

      const _set_type = set_type
        .split(/[-_]+/)
        .map(toPascalCase)
        .join(' ');
    
      messages.push({
        content: [
            /**'<:external_link_2:968873246915166218>  '
            + */`**${set_name} (${set.toUpperCase()})**`,
            `${_set_type} Set • Releases ${_released_at ?? released_at}`,
            `*(See more at <${scryfall_uri}>)*`,
            '**',
            `${setGroup.length} new ${embeds.length === 1 ? 'card' : 'cards'} revealed`
            + ':**'
          ].join('\n'),
        embeds
      });

      if (_data?.length > 1) {
        for (let i = 1; i < _data.length; i++) {
          embeds = await mapCardEmbeds(client, _data[i]);
          messages.push({ embeds });
        };
      };

      // Set 50 ms timeout for Scryfall
      await setDelay(500);
    }
  };

  // let _i = 1;
  // messages.forEach(m => {
  //   if (m?.content) console.log(m.content);
  //   m.embeds.forEach((e, i) => {
  //     console.log(_i, e.title.replaceAll(/ <.*/g, ''));
  //     _i++;
  //   })
  // });

  return messages;
};