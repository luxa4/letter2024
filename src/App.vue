<script setup>
import { ref } from 'vue';
import { UploadFilled } from '@element-plus/icons-vue';
import { ElUpload, ElIcon } from 'element-plus';
import {
  convertToUtf8,
  getAddressObject,
  getAztecCode, getDocDefinition,
  getOrderDetails
} from '@/hepers/additionalFunctions.js';
import { FONTS } from '@/constants/fonts.js';
import { ENVELOPE_PARAMS } from '@/constants/envelopeParams.js';

// import { ENVELOPE_PARAMS } from '@/constants/envelopeParams.js';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';



// let zipLib = require('jszip-sync/dist/jszip.min.js');
// const zip = ref(new zipLib());

const onChangeUpload = (uploadedFile) => {
  const file = uploadedFile.raw;

  let reader = new FileReader();

  reader.onload = function(event) {
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
    });


    createEnvelope(orders[0]);
    // Выводим результат
    console.log('orders', orders);
  };

  reader.readAsArrayBuffer(file);
};

function createEnvelope(orderObject) {
  const envelopeType = orderObject.details.envelopeType;
  const aztecCode = getAztecCode(orderObject.orderId);

  drawEnvelope(envelopeType, aztecCode, orderObject);
}

function drawEnvelope(envelopeType, aztecCode, orderObject) {
  const parameters = ENVELOPE_PARAMS[envelopeType];

  if (pdfMake.vfs == undefined) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  }

  pdfMake.fonts = FONTS;

  const docDefinition = getDocDefinition(parameters, orderObject, aztecCode);

  // return pdfMake.createPdf(docDefinition);
  pdfMake.createPdf(docDefinition).open();


  //
  // const worker = new Worker('worker.js',{ type: 'module' });
  //
  // // Обработка сообщения от worker'а
  // worker.onmessage = function(event) {
  //   const blob = event.data;
  //   const url = URL.createObjectURL(blob);
  //
  //   // Создаем ссылку для скачивания
  //   const downloadLink = document.getElementById('downloadLink');
  //   downloadLink.href = url;
  //   downloadLink.download = 'file.txt'; // Укажите имя файла
  //   downloadLink.style.display = 'block';
  //   downloadLink.textContent = 'Скачать файл';
  // };
  //
  // worker.postMessage({ });
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
