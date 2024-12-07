<script setup>
import pdfFonts from '@/fonts';
import pdfMake from 'pdfmake/build/pdfmake';

import JSZip from 'jszip';
import Papa from 'papaparse';

import { ref, computed, useTemplateRef, watch } from 'vue';
import { UploadFilled } from '@element-plus/icons-vue';
import { ElUpload, ElIcon, ElProgress, ElButton } from 'element-plus';

import {
  convertToUtf8, countTotalDetails,
  getAddressObject,
  // getAztecCode,
  getDocDefinition,
  getOrderDetails,
  getPicture
} from '@/hepers/additionalFunctions.js';

import { FONTS } from '@/constants/fonts.js';
import { ENVELOPE_PARAMS } from '@/constants/envelopeParams.js';

let pdfBlobs = {};


const zip = new JSZip();

const uploader = useTemplateRef('uploader');
const showProgress = ref(false);
const readyEnvelope = ref(0);
const orders = ref([]);
const ordersCount = ref(0);
const file = ref(null);
const isBtnDisabled = ref(false);
const isLoaderDisabled = ref(false);
const currentOrder = ref(null);
const data = ref([]);
const errors = ref([]);

const percent = computed(() => Math.round(readyEnvelope.value * 100 / ordersCount.value));

watch(file, (value) => isLoaderDisabled.value = !!value);

const startProcessing = () => {
  if (!file.value) {
    return;
  }

  let reader = new FileReader();

  reader.readAsArrayBuffer(file.value);

  reader.onload = async function(event) {
    isBtnDisabled.value = true;

    const arrayBuffer = event.target.result;

    const csvData = convertToUtf8(arrayBuffer);


    Papa.parse(csvData, {
      complete: (results) => {
        // Выводим результат
        data.value = results.data.filter(i => {
          const isEmpty = i.length <= 1;
          const hasEnvelope = i[10] && !i[10]?.includes('Внешний конверт');

          return !isEmpty && hasEnvelope;
        });
      },
      header: false
    });

    const headers = data.value[0];

    // Находим индекс колонки "товары"
    const productIndex = headers.indexOf('Товары');
    const addressIndex = headers.indexOf('Адрес доставки');
    const orderIndex = headers.indexOf('Номер заказа');

    if (productIndex === -1 || addressIndex === -1 || orderIndex === -1) {
      alert('Колонка "Товары" или "Адрес доставки" или "Номер заказа" не найдены.');
      return;
    }

    orders.value = data.value.slice(1).reduce((acc, row) => {
      const columns = row;

      try {
        const orderId = columns[orderIndex];
        const address = getAddressObject(columns[addressIndex], orderId);
        const details = getOrderDetails(columns[productIndex], orderId);

        acc.push({
          orderId,
          address,
          details
        });
      } catch (error) {
        errors.value.push(error);
        console.error(error);
      }

      return acc;
    }, []);

    ordersCount.value = orders.value.length;
    showProgress.value = true;
    await createEnvelope(orders.value);
    await createZIP(orders.value);

    clearLoader();
    isBtnDisabled.value = false;
  };
};

const onChangeUpload = async (uploadedFile) => {
  if (file.value) {
    clearLoader();
  }

  file.value = uploadedFile.raw;
};

async function createEnvelope(orders) {
  if (!orders?.length) {
    console.error('[createEnvelope] не найдено заказов');
    return;
  }

  ordersCount.value = countTotalDetails(orders);

  for (let i = 0; i < orders.length; i++) {
    currentOrder.value = orders[i].orderId;
    // const aztecCode = getAztecCode(orders[i].orderId);

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
      const envelope = await drawEnvelope(envelopeType, orderInfo);

      const blobFile = await new Promise(resolve => {
        setTimeout(() => {
          envelope.getBlob((blob) => {
            resolve(blob);
          });
        },0);
      });

      // Переводим в blob
      if (pdfBlobs[i]) {
        pdfBlobs[i].push(blobFile);
      } else {
        pdfBlobs[i] = [blobFile];
      }

      readyEnvelope.value++;
    }
  }
}

async function drawEnvelope(envelopeType, order) {
  const parameters = ENVELOPE_PARAMS[envelopeType];

  if (pdfMake.vfs == undefined) {
    pdfMake.vfs = pdfFonts;
  }

  pdfMake.fonts = FONTS;

  const picture = await getPicture(order.picture, parameters.pageSize);

  const docDefinition = getDocDefinition(parameters, order, picture);

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

    for (let k = 0; k < orders[i].details.length; k++) {
      const envelopeType = orders[i].details[k].envelopeType;

      zip.file(`${orderId}_${k}_${envelopeType}_${i + 1}.pdf`, pdfBlobs[i][k]);
    }
  }

  // Создаем ZIP
  zip.generateAsync( { type: 'blob' } )
    .then((blob) => {
      // this.status = '';
      saveAs(blob, `orders${1}.zip`);
    });
}

const clearLoader = () => {
  file.value = null;
  uploader.value.clearFiles();
  // orders.value = [];
  readyEnvelope.value = 0;
  currentOrder.value = 0;
};

</script>

<template>
  <main :class="$style.main">
    <div :class="$style.body">
      <el-upload
          ref="uploader"
          class="upload-demo"
          drag
          :disabled="isLoaderDisabled"
          :limit="1"
          :auto-upload="false"
          :onChange="onChangeUpload"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          Перенесите файл с заказами или <em>кликните для загрузки</em>
        </div>
      </el-upload>

      <div :class="$style.btns">
        <el-button :disabled="isBtnDisabled" type="success" round @click="startProcessing">Обработать заказы</el-button>
        <el-button :disabled="!file || isBtnDisabled" type="warning" round @click="clearLoader">Очистить</el-button>
      </div>

      <div v-if="showProgress" :class="$style.stat">
           <div>{{ `Найдено ${orders.length} заказ(ов), из них ${ordersCount} писем(а)` }}</div>
           <div v-if="currentOrder">{{ `Обрабатывается заказ #${currentOrder}` }}</div>
      </div>

      <div v-if="showProgress" :class="$style.progress" class="demo-progress">
        <el-progress type="circle" :percentage="percent"/>
      </div>

      <div v-if="errors.length" :class="$style.errors">
        <div :class="$style.label">НЕОБРАБОТАННЫЕ ЗАКАЗЫ</div>
        <div v-for="(item, id) in errors">
          {{ id + 1 }}. {{ item }}
        </div>
      </div>

      <canvas style="display: none" id="mycanvas"></canvas>
    </div>
  </main>
</template>

<style module>
.main {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  background-color: #fff;
}

.body {
  width: 450px;
}

.btns {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 25px;
}

.stat {
  margin-top: 25px;
  text-align: center;
  color: var(--el-text-color-regular);

  div + div {
    font-weight: 500;
  }
}

.progress {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 25px;
}

.errors {
  margin-top: 25px;
  width: 100%;
  color: #c45656;
  word-break: break-word;
}

.label {
  margin-bottom: 15px;
  text-align: center;
  font-weight: 500;
}

</style>
