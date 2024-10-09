<script setup>
import pdfFonts from '@/fonts';
import pdfMake from 'pdfmake/build/pdfmake';

import JSZip from 'jszip';

import { ref, computed } from 'vue';
import { UploadFilled } from '@element-plus/icons-vue';
import { ElUpload, ElIcon, ElProgress } from 'element-plus';

import {
  convertToUtf8, countTotalDetails,
  getAddressObject,
  getAztecCode, getDocDefinition,
  getOrderDetails, getPicture
} from '@/hepers/additionalFunctions.js';

import { FONTS } from '@/constants/fonts.js';
import { ENVELOPE_PARAMS } from '@/constants/envelopeParams.js';

let pdfArray = [];
let pdfBlobs = [];

const zip = new JSZip();

const showProgress = ref(false);
const readyEnvelope = ref(0);
const ordersCount = ref(0);

const percent = computed(() => Math.round(readyEnvelope.value * 100 / ordersCount.value));

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
      alert('Колонка "Товары" или "Адрес доставки" или "Номер заказа" не найдены.');
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

    ordersCount.value = orders.length;
    showProgress.value = true;
    await createEnvelope(orders);
    await createZIP(orders);
  };

  reader.readAsArrayBuffer(file);
};

async function createEnvelope(orders) {
  if (!orders?.length) {
    console.error('[createEnvelope] не найдено заказов');
    return;
  }

  ordersCount.value = countTotalDetails(orders);

  for (let i = 0; i < orders.length; i++) {
    const aztecCode = getAztecCode(orders[i].orderId);

    for (let k = 0; k < orders[i].details.length; k++) {
      const envelopeType = orders[i].details[k].envelopeType;

      const orderInfo = {
        orderId: orders[i].orderId,
        picture: orders[i].details[k].picture,
        recipient: orders[i].details[k].recipient,
        postalCode: orders[i].address.postalCode,
        street: orders[i].address.street,
        city: orders[i].address.city,
        region: orders[i].address.region
      };

      // Получаем готовый конверт
      pdfArray.push(await drawEnvelope(envelopeType, aztecCode, orderInfo));

      // Переводим в blob
      pdfBlobs.push(await new Promise(resolve => {
        setTimeout(() => {
          pdfArray[pdfArray.length - 1].getBlob((blob) => {
            resolve(blob);
          });
        },0);
      }));

      readyEnvelope.value++;
    }
  }
}

async function drawEnvelope(envelopeType, aztecCode, order) {
  const parameters = ENVELOPE_PARAMS[envelopeType];

  if (pdfMake.vfs == undefined) {
    pdfMake.vfs = pdfFonts;
  }

  pdfMake.fonts = FONTS;

  const picture = await getPicture(order.picture, parameters.pageSize);

  const docDefinition = getDocDefinition(parameters, order, aztecCode, picture.pic);

  // Раскомментировать если нужно открыть PDF
  // pdfMake.createPdf(docDefinition).open();

  return pdfMake.createPdf(docDefinition);
}

function createZIP(orders) {
  if (!orders?.length) {
    console.error('[createZIP] не найдено заказов');
    return;
  }

  // Добавляем конверты в ZIP
  for (let i = 0; i < orders.length; i++) {
    const orderId = orders[i].orderId;
    let index = 0;

    for (let k = 0; k < orders[i].details.length; k++) {
      const envelopeType = orders[i].details[k].envelopeType;

      zip.file(`${i + 1}_${envelopeType}_${orderId}.pdf`, pdfBlobs[index]);

      index++;
    }
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

    <div v-if="showProgress" class="demo-progress">
      <el-progress type="circle" :percentage="percent"/>
    </div>
    <canvas style="display: none" id="mycanvas"></canvas>
  </main>
</template>

<style module>
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
