<script setup>
import pdfFonts from '@/fonts';
import pdfMake from 'pdfmake/build/pdfmake';


import JSZip from 'jszip';

import { UploadFilled } from '@element-plus/icons-vue';
import { ElUpload, ElIcon } from 'element-plus';

import {
  convertToUtf8,
  getAddressObject,
  getAztecCode, getDocDefinition,
  getOrderDetails, getPicture
} from '@/hepers/additionalFunctions.js';

import { FONTS } from '@/constants/fonts.js';
import { ENVELOPE_PARAMS } from '@/constants/envelopeParams.js';

let pdfArray = [];
let pdfBlobs = [];

const zip = new JSZip();

const onChangeUpload = async (uploadedFile) => {
  const file = uploadedFile.raw;

  let reader = new FileReader();

  reader.onload = async function(event) {
    const arrayBuffer = event.target.result;

    const csvData = convertToUtf8(arrayBuffer);

    const rows = csvData.split('\n');
    const headers = rows[0].split(';');

    // Находим индекс колонки "товары"
    const productIndex = headers.indexOf('Товары');
    const addressIndex = headers.indexOf('Адрес доставки');
    const orderIndex = headers.indexOf('Номер заказа');

    if (productIndex === -1 || addressIndex === -1 || orderIndex === -1) {
      alert('Колонка "Товары" или "Адрес доставки" или "Номер зазака" не найдены.');
      return;
    }

    const orders = rows.slice(1).map(row => {
      const columns = row.split(';');

      const address = getAddressObject(columns[addressIndex]);
      const details = getOrderDetails(columns[productIndex]);
      const orderId = columns[orderIndex];

      return {
        orderId,
        address,
        details
      };
    }).filter(({ orderId }) => orderId);

    console.log('orders', orders);

    await createEnvelope([orders[0]]);
    await createZIP([orders[0]]);
  };

  reader.readAsArrayBuffer(file);
};

async function createEnvelope(orders) {
  if (!orders?.length) {
    console.error('[createEnvelope] не найдено заказов');
    return;
  }

  for (let i = 0; i < orders.length; i++) {
    const envelopeType = orders[i].details.envelopeType;
    const aztecCode = getAztecCode(orders[i].orderId);

    // Получаем готовый конверт
    pdfArray[i] = await drawEnvelope(envelopeType, aztecCode, orders[i]);

    // Переводим в blob
    pdfBlobs[i] = await new Promise(resolve => {
      setTimeout(() => {
        pdfArray[i].getBlob((blob) => {
          resolve(blob);
        });
      },0);
    });
  }
}

async function drawEnvelope(envelopeType, aztecCode, order) {
  const parameters = ENVELOPE_PARAMS[envelopeType];

  if (pdfMake.vfs == undefined) {
    pdfMake.vfs = pdfFonts;
  }

  pdfMake.fonts = FONTS;

  const picture = await getPicture(order.details.picture, parameters.pageSize);

  const docDefinition = getDocDefinition(parameters, order, aztecCode, picture.pic);

  // Раскомментировать если нужно открыть PDF
  pdfMake.createPdf(docDefinition).open();

  return pdfMake.createPdf(docDefinition);
}

function createZIP(orders) {
  if (!orders?.length) {
    console.error('[createZIP] не найдено заказов');
    return;
  }

  // Добавляем конверты в ZIP
  for (let i = 0; i < orders.length; i++) {
    const envelopeType = orders[i].details.envelopeType;
    const orderId = orders[i].orderId;

    zip.file(`${i + 1}_${envelopeType}_${orderId}.pdf`, pdfBlobs[i]);
  }

  // Создаем ZIP
  zip.generateAsync( { type: 'blob' } )
    .then((blob) => {
      // this.status = '';
      saveAs(blob, `orders${1}.zip`);
    });
}

</script>

<template>
  <main>
    <el-upload
        class="upload-demo"
        drag
        :limit="1"
        :auto-upload="false"
        :onChange="onChangeUpload"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        Перенесите файл с заказами или <em>кликните для загрузки</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          csv файл
        </div>
      </template>
    </el-upload>
    <canvas style="display: none" id="mycanvas"></canvas>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
