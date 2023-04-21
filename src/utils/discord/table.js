// /**
//  * Formats a monospaced table
//  * @param {Array.<String|Number>} array 
//  * @param {Number} length 
//  * @param {Boolean} indexLabel 
//  * @returns {Array.<String>}
//  */
//  export const formatMonospaceTable = (array, length = 10, indexLabel = true) => {
//   // Enumerate pages.
//   let pages = [];
//   for (let i = 0; i < Math.ceil(array.length / length); i++) {
//     // Construct table array.
//     let _array = array.slice(i * length, (i + 1) * length);
//     if (indexLabel) {
//       let _array_ = [];
//       _array.forEach((obj, i) => {
//         if (obj instanceof Array) {
//           obj.forEach(({Archetype, ...rest}, _i) => {
//             _array_.push({
//               '#': _i === 0
//                 ? i+1
//                 : '----',//'..',
//               ...rest,
//               "Archetype": _i === 0
//                 ? Archetype
//                 : `${
//                   _i + 1 !== obj.length
//                     ? '├─'//─'
//                     : '└─'//─'
//                 }${Archetype}`,
//             });
//           });
//         } else {
//           _array_.push({'#': i+1, ...obj});
//         };
//       });
//       // Update array
//       _array = _array_;
//     };
//     const getColLength = (col) => [
//       '===“', col, ..._array.map(obj => obj[col]?.toString())
//     ].sort((a, b) => (a.toString().length < b.toString().length) ? 1 : -1)[0].length;

//     // Format table title.
//     let table = new Array(4 + length).fill('');
//     Object.keys(_array[0]).forEach(key => {
//       const divider = new Array(getColLength(key) + 1).join("=");
//       const title = [
//         key.charAt(0).toUpperCase() + key.slice(1),
//         new Array(getColLength(key) + 1 - key.toString().length).join(" ")
//       ].sort((a, b) => (
//         typeof(_array[0][key]) === 'string' &&
//         isNaN(_array[0][key]) &&
//         !/^\d+(\.\d+)?%$/.test(_array[0][key])
//       ) ? 1 : -1).join('');

//       // Create a table for each page.
//       [
//         divider, title, divider,
//         ..._array.map(obj => [
//             obj[key],
//             new Array(
//               getColLength(key) + 1 - obj[key]?.toString().length
//             ).join(' ')
//           ].sort(() => (typeof(_array[0][key]) === 'string'
//             && isNaN(_array[0][key])
//             && !/^\d+(\.\d+)?%$/.test(_array[0][key])
//           ) ? 1 : -1
//           ).join('')
//         ), divider
//       ].forEach((row,i) => {
//         table[i] = table?.[i] ? table?.[i] + '  ' + row : row
//       });
//     });

//     pages.push(table);
//   };

//   return pages;
// }


/**
 * Formats a monospaced table
 * @param {Array.<String|Number>} array 
 * @param {Number} length 
 * @param {Boolean} indexLabel 
 * @returns {Array.<String>}
 */
export const formatMonospaceTable = (array, length = 10, indexLabel = true) => {
  // Enumerate pages.
  let pages = [];
  for (let i = 0; i < Math.ceil(array.length / length); i++) {
    if (indexLabel) {
      let _array_ = [];
      array.forEach((obj, i) => {
        if (obj instanceof Array) {
          obj.forEach(({Archetype, ...rest}, _i) => {
            _array_.push({
              '#': _i === 0
                ? i+1
                : '----',//'..',
              ...rest,
              "Archetype": _i === 0
                ? Archetype
                : `${
                  _i + 1 !== obj.length
                    ? '├─'//─'
                    : '└─'//─'
                }${Archetype}`,
            });
          });
        } else {
          _array_.push({'#': i+1, ...obj});
        };
      });
      // Update array
      array = _array_;
    };
    // Construct table array.
    let _array = array.slice(i * length, (i + 1) * length);
    const getColLength = (col) => [
      '===“', col, ..._array.map(obj => obj[col]?.toString())
    ].sort((a, b) => (a.toString().length < b.toString().length) ? 1 : -1)[0].length;

    // Format table title.
    let table = new Array(4 + length).fill('');
    Object.keys(_array[0]).forEach(key => {
      const divider = new Array(getColLength(key) + 1).join("=");
      const title = [
        key.charAt(0).toUpperCase() + key.slice(1),
        new Array(getColLength(key) + 1 - key.toString().length).join(" ")
      ].sort((a, b) => (
        typeof(_array[0][key]) === 'string' &&
        isNaN(_array[0][key]) &&
        !/^\d+(\.\d+)?%$/.test(_array[0][key])
      ) ? 1 : -1).join('');

      // Create a table for each page.
      [
        divider, title, divider,
        ..._array.map(obj => [
            obj[key],
            new Array(
              getColLength(key) + 1 - obj[key]?.toString().length
            ).join(' ')
          ].sort(() => (typeof(_array[0][key]) === 'string'
            && isNaN(_array[0][key])
            && !/^\d+(\.\d+)?%$/.test(_array[0][key])
          ) ? 1 : -1
          ).join('')
        ), divider
      ].forEach((row,i) => {
        table[i] = table?.[i] ? table?.[i] + '  ' + row : row
      });
    });

    pages.push(table);
  }
  return pages;
}
