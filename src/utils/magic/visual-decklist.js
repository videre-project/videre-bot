import { createCanvas, loadImage } from 'canvas';
const companion_image = __dirname.replace('src/utils/magic', 'assets/Companion Frame.png');

/**
 * Draw visual decklist from decklist object.
 */
export const drawDeck = async (
  decklist,
  flex_width = 7,
  override_width,
  show_quantities = true,
  thumbnail
) => {
  const mainboardArray = decklist
    .filter(card =>
      !(card.display_type === 'Companion'
        || card.display_type === 'Sideboard')
    );
  const sideboardArray = decklist
    .filter(card =>
      (card.display_type === 'Companion'
        || card.display_type === 'Sideboard')
    );

  // const util = require('util');
  // console.log(util.inspect(decklist, false, null, true));

  // Total number of cards mainboard
  const mainboard_length = override_width
    ? flex_width
    : mainboardArray.length;

  const numCols = mainboardArray.length >= flex_width
    ? flex_width
    : mainboard_length;
  const numRows = Math.ceil(mainboardArray.length / flex_width);

  const width = (
    // Horizontal padding
    (50 * 2) +
    // Total width of cards
    ((numCols
      + Math.ceil(sideboardArray.length / numRows)
    ) * 223) +
    // Total gutter between cards
    (((numCols - 1)
      + (sideboardArray.length
        ? (Math.ceil(sideboardArray.length / numRows) - 1)
        : 0)
      ) * 20)
    // Gutter between mainboard and sideboard
    + (sideboardArray.length ? 100 : 0)
  );

  const height = (
    // Vertical padding
    (50 * 2) +
    // Total height of cards
    (numRows * 311) +
    // Total gutter between cards
    ((numRows - 1) * 25)
  );

  // Get canvas context
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');//, { alpha: false });

  // Speed optimizations
  context.quality = 'fast';
  context.textDrawingMode = 'glyph';

  // Draw background
  context.fillStyle = '#292B2F';
  context.fillRect(0, 0, width, height);

  // Fill background with thumbnail image.
  if (thumbnail) {
    context.globalAlpha = 0.25;//0.125;
    thumbnail = await loadImage(thumbnail);

    const _scale = width / thumbnail.width;
    const _height = thumbnail.height * _scale;

    context.drawImage(thumbnail, 0, 0, width, _height);
    context.globalAlpha = 1;

    // Quick and dirty blur effect.
    Array(10).fill().forEach(() => {
      context.drawImage(canvas, 0, 0, canvas.width / 2, canvas.height / 2);
      context.drawImage(canvas, 0, 0, canvas.width / 2, canvas.height / 2, 0, 0, canvas.width, canvas.height);
    });
    
  };

  // Calculate total width of mainboard w/ padding
  const _mainboardWidth = (numCols * 223) + ((numCols - 1) * 20);

  // Draw rectangle under sideboard cards
  if (mainboardArray?.length && sideboardArray?.length) {
    context.globalAlpha = 0.45;
    context.fillRect(
      100 + _mainboardWidth,
      0,
      width - _mainboardWidth - 100,
      height
    );
    context.globalAlpha = 1;
  };

  /**
   * Fills rectangle with rounded corners.
   */
  function roundRect(context, x, y, w, h, r) {
    // Handle radius rescaling
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    // Draw box path
    context.beginPath();
    context.moveTo(x+r, y);
    context.arcTo(x+w, y,   x+w, y+h, r);
    context.arcTo(x+w, y+h, x,   y+h, r);
    context.arcTo(x,   y+h, x,   y,   r);
    context.arcTo(x,   y,   x+w, y,   r);
    context.closePath();
    // Fill path
    context.fillStyle = 'rgba(30, 30, 30, 0.8)';//'#1E1E1E';
    context.fill();
  }

  // Draw mainboard and sideboard image grid with qty labels
  await Promise.all(
    [...mainboardArray, ...sideboardArray]
      .map(async (card, i) => {
        // Reset index to 0 for sideboard cards
        const _i = (i > mainboardArray.length - 1)
          ? i - mainboardArray.length
          : i;
        // Recalculates numCols for mainboard/sideboard
        const _numCols = (i > mainboardArray.length - 1)
          ? Math.ceil(sideboardArray.length / numRows)
          : flex_width;

        let x_offset = 50
          // Total width of cards
          + ((_i % _numCols) * 223)
          // Total gutter between cards
          + (((_i % _numCols) > 0)
            ? ((_i % _numCols) * 20)
            : 0)
          // Offset for drawing sideboard
          + ((i > mainboardArray.length - 1)
            ? 100 + _mainboardWidth
            : 0);

        const y_offset = (50 + 5)
          // Total height of cards
          + (Math.floor(_i / _numCols) * 331);

        // Draw card image
        const cardImage = await loadImage(card.image);
        context.drawImage(cardImage, x_offset, y_offset, 223, 311);
        

        // Draw companion border
        if (card.display_type == 'Companion') {
          const _cardImage = await loadImage(companion_image);
          context.drawImage(_cardImage, x_offset, y_offset, 223, 311);
        }

        if (show_quantities) {
          const text = !isNaN(card.qty)
            ? `×${ card.qty }`
            : card.qty;

          // Get font offset based on font width
          let font_offset = 5
            + (text.length > 2
              ? (text.length - 2) * 17
              : 0);

          // Account for fitting non-numeric text
          if (isNaN(card.qty)) {
            x_offset -= 5;
            font_offset += 10;
          }

          // Draw rounded rectangle
          roundRect(
            context,
            x_offset + 150 - font_offset,
            y_offset + 41,
            50 + font_offset, // height
            50,               // width
            8                 // radius
          );
          
          // Draw text
          context.fillStyle = '#FFFFFF';
          context.font = 'bold 25px Verdana';
          context.fillText(text, x_offset + 156 - font_offset, y_offset + 74);
        }
      })
  );
  
  // Call canvas to JS buffer
  const buffer = canvas.toBuffer('image/png');

  // Rescale dimensions to below max size for thumbnail rendering
  const max_dim = 1080 * 2;
  if (width > max_dim || height > max_dim) {
    const _width = width > max_dim
      ? max_dim
      : width / (height / max_dim);
    let _height = height > max_dim
      ? max_dim
      : height / (width / max_dim);
    if (width > max_dim && height > max_dim) {
      _height = height / (width / max_dim);
    }

    // Create new canvas for rescaling image
    const _canvas = createCanvas(_width, _height);
    const _context = _canvas.getContext('2d', { alpha: false });

    _context.fillStyle = '#2F3136';
    _context.fillRect(0, 0, _width, _height);

    // Redraw canvas at new resolution
    const image = await loadImage(buffer);
    _context.drawImage(image, 0, 0, _width, _height);

    // Return new canvas as buffer
    return _canvas.toBuffer('image/png');
  }

  return buffer;
}