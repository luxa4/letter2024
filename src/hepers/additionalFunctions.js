import bwipjs from 'bwip-js';

const picArray = {
  A4: [],
  A5: [],
  C5: []
};

export function convertToUtf8(arrayBuffer) {
// Декодируем содержимое файла
  const decoder = new TextDecoder('windows-1251'); // Исходная кодировка
  const text = decoder.decode(arrayBuffer);

  // Кодируем в новую кодировку (например, UTF-8)
  const encoder = new TextEncoder();
  const utf8Array = encoder.encode(text);

  // Преобразуем обратно в строку для отображения
  return  new TextDecoder('utf-8').decode(utf8Array);
}

export function getAddressObject(address) {
  if (!address) {
    return;
  }

  // Используем регулярное выражение для извлечения данных
  const regex = /(\d{6}),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*(.*)/;
  const match = address?.match(regex);

  if (match) {
    const postalCode = match[1]; // Индекс
    const region = match[3]; // Регион
    const city = match[4];   // Город
    const street = match[5].trim(); // Все что идет после города

    return {
      postalCode,
      region,
      city,
      street
    };
  } else {
    console.error(`Не удалось извлечь данные из адреса ${address}.`);
  }
}

export function getOrderDetails(orderString) {
  if (!orderString) {
    return;
  }

  const regex = /\[(.*?)\]/g;
  let matches;
  const orders = [];
  const details = [];

  // Используем цикл для извлечения всех совпадений
  while ((matches = regex.exec(orderString)) !== null) {
    // matches[1] содержит текст между скобками
    orders.push(matches[1]);
  }

  for (let i = 0; i < orders.length; i++) {
    // Регулярное выражение для извлечения подстроки после "кому?" и до двух запятых
    const recipientPattern = /\(кому\?\):\s*([^,]*),,\s*([^,]*),?/;
    // Регулярное выражение для извлечения подстроки после "Рисунок на конверте:" и до двух запятых
    const picturePattern = /Рисунок на конверте:\s*([^,]*),,\s*([^,]*),?/;

    const recipientMatch = orders[i].match(recipientPattern);
    const pictureMatch = orders[i].match(picturePattern);

    const recipient = recipientMatch ? recipientMatch[1].trim() : null;
    const picture = pictureMatch ? pictureMatch[1].trim() : null;
    const envelopeType = getEnvelopeSize(orders[i]);

    details.push({ recipient, picture, envelopeType });
  }

  return details;
}

function getEnvelopeSize(inputString) {
  if (inputString.includes('Большое письмо')) {
    return 'A4';
  } else if (inputString.includes('белой тушью')) {
    return 'A4';
  } else if (inputString.includes('Сюжетное письмо')) {
    return 'A4';
  } else if (inputString.includes('Крафтовый конверт С5')) {
    return 'C5';
  } else if (inputString.includes('Конверт с белым листом С5')) {
    return 'C5';
  }else {
    return null; // Если ни одна подстрока не найдена
  }
}

export function getAztecCode(order) {
  let aztecCanvas = bwipjs.toCanvas('mycanvas', {
    bcid:        'azteccode',
    text:        `ORDER-${order}`,
    scale:       1,
    width:       14,
    height:      14,
    includetext: false,
    textxalign:  'center'
  });

  return aztecCanvas.toDataURL('image/png');
}

export function getDocDefinition(parameters, orderInfo, aztecCode, picture) {
  return {
    content: [
      // Picture
      {
        svg: picture,
        margin: parameters.marginPicture
      },
      {
        text: 'От кого',
        italics: true,
        fontSize: 14,
        font: 'Arial',
        color: '#2b2a29',
        margin: parameters.marginTextFromWho
      },
      {
        text: 'Откуда',
        italics: true,
        fontSize: 14,
        font: 'Arial',
        color: '#2b2a29',
        margin: parameters.marginTextFrom
      },
      {
        canvas: [
          {
            type: 'line',
            x1: parameters.lineTop1[0], y1: parameters.lineTop1[1],
            x2: parameters.lineTop1[2], y2: parameters.lineTop1[3],
            lineWidth: 1,
            color: '#2b2a29'
          },
          {
            type: 'line',
            x1: parameters.lineTop2[0], y1: parameters.lineTop2[1],
            x2: parameters.lineTop2[2], y2: parameters.lineTop2[3],
            lineWidth: 1,
            color: '#2b2a29'
          },
          {
            type: 'line',
            x1: parameters.lineTop3[0], y1: parameters.lineTop3[1],
            x2: parameters.lineTop3[2], y2: parameters.lineTop3[3],
            lineWidth: 1,
            color: '#2b2a29'
          },
          {
            type: 'line',
            x1: parameters.lineTop4[0], y1: parameters.lineTop4[1],
            x2: parameters.lineTop4[2], y2: parameters.lineTop4[3],
            lineWidth: 1,
            color: '#2b2a29'
          }
        ]
      },
      {
        text: 'Дедушки Мороза',
        fontSize: 26,
        color: '#323d85',
        margin: parameters.marginTextDedMoroz
      },
      {
        text: 'Дворец Деда Мороза',
        fontSize: 26,
        color: '#323d85',
        margin: parameters.marginTextDvorec
      },
      {
        text: 'г.Великий Устюг',
        fontSize: 26,
        color: '#323d85',
        margin: parameters.marginTextCity
      },
      {
        text: 'Вологодская область, Россия',
        fontSize: 26,
        color: '#323d85',
        margin: parameters.marginTextRegion
      },

      {
        text: orderInfo.orderId.slice(-4),
        fontSize: 10,
        color: '#323d85',
        margin: parameters.marginOrderId
      },

      // PostalCode
      {
        svg: '<svg width="173mm" height="74mm" version="1.1" viewBox="0 0 61.76 26.462" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n' +
            ' <g transform="translate(-72.686 -83.531)" clip-rule="evenodd" shape-rendering="geometricPrecision">\n' +
            '  <rect class="fil0 str0" x="73.038" y="83.884" width="61.054" height="18.647" fill="none" image-rendering="optimizeQuality" stroke="#5b5b5b" stroke-dasharray="1.4112, 2.1168" stroke-miterlimit="22.926" stroke-width=".7056"/>\n' +
            '  <polygon class="fil3" transform="matrix(.01 0 0 .01 61.533 -79.28)" points="1132.6 18527 1132.6 18727 1832.6 18727 1832.6 18527" fill="#2b2a29" image-rendering="optimizeQuality"/>\n' +
            '  <polygon class="fil3" transform="matrix(.01 0 0 .01 61.533 -79.28)" points="1132.6 18827 1132.6 18927 1832.6 18927 1832.6 18827" fill="#2b2a29" image-rendering="optimizeQuality"/>\n' +
            ' </g>\n' +
            '</svg>',
        margin: parameters.marginPostalPic
      },
      {
        text: orderInfo.postalCode,
        font: 'Pechkin',
        fontSize: 34,
        color: '#2b2a29',
        margin: parameters.marginPostal
      },
      {
        image: aztecCode,
        margin: parameters.marginAztec
      },
      {
        text: 'Кому',
        italics: true,
        fontSize: 14,
        font: 'Arial',
        color: '#2b2a29',
        margin: parameters.marginTextWho
      },
      {
        text: 'Куда',
        italics: true,
        fontSize: 14,
        font: 'Arial',
        color: '#2b2a29',
        margin: parameters.marginTextWhere
      },
      {
        canvas: [
          {
            type: 'line',
            x1: parameters.lineDown1[0], y1: parameters.lineDown1[1],
            x2: parameters.lineDown1[2], y2: parameters.lineDown1[3],
            lineWidth: 1,
            color: '#2b2a29'
          },
          {
            type: 'line',
            x1: parameters.lineDown2[0], y1: parameters.lineDown2[1],
            x2: parameters.lineDown2[2], y2: parameters.lineDown2[3],
            lineWidth: 1,
            color: '#2b2a29'
          },
          {
            type: 'line',
            x1: parameters.lineDown3[0], y1: parameters.lineDown3[1],
            x2: parameters.lineDown3[2], y2: parameters.lineDown3[3],
            lineWidth: 1,
            color: '#2b2a29'
          },
          {
            type: 'line',
            x1: parameters.lineDown4[0], y1: parameters.lineDown4[1],
            x2: parameters.lineDown4[2], y2: parameters.lineDown4[3],
            lineWidth: 1,
            color: '#2b2a29'
          },
          {
            type: 'line',
            x1: parameters.lineDown5[0], y1: parameters.lineDown5[1],
            x2: parameters.lineDown5[2], y2: parameters.lineDown5[3],
            lineWidth: 1,
            color: '#2b2a29'
          }
        ]
      },
      {
        text: orderInfo.recipient,
        fontSize: 26,
        color: '#323d85',
        margin: parameters.marginPerson
      },
      {
        text: orderInfo.street,
        fontSize: 26,
        color: '#323d85',
        margin: parameters.marginStreet
      },
      {
        text: orderInfo.city,
        fontSize: 26,
        color: '#323d85',
        margin: parameters.marginCity
      },
      {
        text: orderInfo.region,
        fontSize: 26,
        color: '#323d85',
        margin: parameters.marginRegion
      }
    ],

    pageSize: parameters.pageSize,
    pageOrientation: 'landscape',
    pageMargins: [0, 0, 0, 0],
    defaultStyle: {
      font: 'Andantino'
    }
  };
}

export async function getPicture(picture, envelope_type) {

  if (picArray[envelope_type][picture[0]]) {
    return picArray[envelope_type][picture[0]];
  }

  let url;

  if (envelope_type === 'A4') {
    if (picture.startsWith('1')) url = '/svg/A4/clockA4.svg';
    if (picture.startsWith('2')) url = '/svg/A4/mouseA4.svg';
    if (picture.startsWith('3')) url = '/svg/A4/carA4.svg';
    if (picture.startsWith('4')) url = '/svg/A4/tigrA4.svg';
    if (picture.startsWith('5')) url = '/svg/A4/snakeA4.svg';
    if (picture.startsWith('6')) url = '/svg/A4/zayacA4.svg';
    if (picture.startsWith('7')) url = '/svg/A4/grandA4.svg';
    if (picture.startsWith('8')) url = '/svg/A4/writeLetterA4.svg';
    if (picture.startsWith('9')) url = '/svg/A4/troykaA4.svg';
  }

  if (envelope_type === 'A5') {
    if (picture.startsWith('1')) url ='/svg/A5/clockA5.svg';
    if (picture.startsWith('2')) url ='/svg/A5/mouseA5.svg';
    if (picture.startsWith('3')) url ='/svg/A5/carA5.svg';
    if (picture.startsWith('4')) url ='/svg/A5/tigrA5.svg';
    if (picture.startsWith('5')) url ='/svg/A5/snakeA45svg';
    if (picture.startsWith('6')) url ='/svg/A5/zayacA5.svg';
    if (picture.startsWith('7')) url ='/svg/A5/grandA5.svg';
    if (picture.startsWith('8')) url ='/svg/A5/writeLetterA5.svg';
    if (picture.startsWith('9')) url ='/svg/A5/troykaA5.svg';
  }

  if (envelope_type === 'C5') {
    if (picture.startsWith('1')) url = '/svg/C5/clockC5.svg';
    if (picture.startsWith('2')) url = '/svg/C5/mouseC5.svg';
    if (picture.startsWith('3')) url = '/svg/C5/carC5.svg';
    if (picture.startsWith('4')) url = '/svg/C5/tigrC5.svg';
    if (picture.startsWith('5')) url = '/svg/C5/snakeC5.svg';
    if (picture.startsWith('6')) url = '/svg/C5/zayacC5.svg';
    if (picture.startsWith('7')) url = '/svg/C5/grandC5.svg';
    if (picture.startsWith('8')) url = '/svg/C5/writeLetterC5.svg';
    if (picture.startsWith('9')) url = '/svg/C5/troykaC5.svg';
  }

  return await fetch(url).then(async res => {
    const pic = await res.text();

    picArray[envelope_type][picture[0]] = pic;

    return pic;
  });
}

export function countTotalDetails(orders) {
  let totalCount = 0;

  // Проходим по каждому заказу и суммируем количество деталей
  orders.forEach(order => {
    if (Array.isArray(order.details)) {
      totalCount += order.details.length;
    }
  });

  return totalCount;
}


