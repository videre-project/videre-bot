/**
 * Formats an array of items/embed properties/embeds or decklist into an embed with navigable pages.
 */
export const formatListAsPages = (items, message, length = 10, mode) => {
  // Deal with inconsistent handling of object arrays
  if (!Array.isArray(items) && length > 1) items = [items];
  // Format items into pages of 'length'
  const pages = items.reduce((output, item, index) => {
    const pageIndex = Math.trunc(index / length) || 0;
    switch (typeof item) {
      case 'string':
        if (output[pageIndex]) output[pageIndex] += line;
        else output[pageIndex] = message?.description
          ? `${message.description}${line}`
          : line;
        break;
      default:
        if (output[pageIndex]) output[pageIndex].push(item);
        else output[pageIndex] = [item];
        break;
    }
    return output;
  }, []);

  if (mode == 'embeds') {
    return pages.map(embeds => ({ embeds }));
  }

  return pages.map((page, i) => {

    let embeds = [];
    if (mode == 'embeds') {
      embeds = page?.embeds || page;
    } else {
      if (mode) message[mode] = page;
      let pageMessage = {
        ...message,
        footer: { text: `Page ${i + 1} of ${pages.length}` },
      };
      let pageProps = {};
      // if (typeof(items[0]) == 'object' && mode == 'embed') {
      //   if (!Array.isArray(items[0])) {
      //     Object.getOwnPropertyNames(page[0]).forEach((prop) => {
      //       pageProps[prop] = page[0][prop];
      //     });
      //   } else pageProps = page[0];
      // }
      embeds = [{ ...pageProps, ...pageMessage }];
    };

    return {
      embeds,
      ...(page?.files)
        ? { files: page?.files }
        : null
    };
  })
};

/**
 * Formats a list of items into an embed with navigable pages.
 */
export const createPagesInteractive = async ( pages, page = 0, labels ) => {
  // Return a message with updated props
  const updateMessage = typeof pages[page] == 'function'
    ? pages[page]
    : () => pages[page];

  if (!labels) {
    labels = {
      button1: '<<',
      button2: '← Back',
      button3: 'Next →',
      button4: '>>'
    }
  }
  
  const buttons = await Promise.all(
    [
      {
        label: pages?.length > 2
          ? labels?.button1
          : null,
        update: () => (page = 0),
      },
      {
        label: labels?.button2,
        update: () => page > 0 && page--,
      },
      {
        label: labels?.button3,
        update: () => page < pages.length - 1 && page++,
      },
      {
        label: pages?.length > 2
          ? labels?.button4
          : null,
        update: () => (page = pages.length - 1),
      },
    ].filter(({ label }) => label)
    .map(async ({ label, update }) => ({
      label,
      onClick: async () => {
        update();
        return await updateMessage();
      },
    }))
  );

  // Format message buttons with pages
  return {
    ...(await updateMessage()),
    buttons: pages.length > 1 && buttons,
  };
};