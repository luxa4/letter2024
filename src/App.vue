<script setup>
import { UploadFilled } from '@element-plus/icons-vue'
import { ElUpload } from 'element-plus'
import convertToUtf8 from '@/hepers/convertToUtf.js';

import { ENVELOPE_PARAMS } from '@/constants/envelopeParams.js';

const onChangeUpload = (uploadedFile) => {
  console.log(`uploadedFile`, uploadedFile);

  const file = uploadedFile.raw;

  let reader = new FileReader();

  reader.onload = function(event) {
    const arrayBuffer = event.target.result;

    const csvData = convertToUtf8(arrayBuffer)

    const rows = csvData.split('\n');
    const headers = rows[0].split(';');

    console.log(`headers`, headers);
    console.log(`rows`, rows);

    // Находим индекс колонки "товары"
    const productIndex = headers.indexOf('Товары');
    const addressIndex = headers.indexOf('Адрес доставки');

    if (productIndex === -1 || addressIndex === -1) {
      alert('Колонка "Товары" или "Адрес доставки" не найдена.');
      return;
    }

    const addresses = rows.slice(1).map(row => {
      const columns = row.split(';');
      return columns[addressIndex];
    }); // Убираем пустые строки

    // Извлекаем все значения из колонки "товары"
    const products = rows.slice(1).map(row => {
      const columns = row.split(';');
      return columns[productIndex];
    }).filter(product => product); // Убираем пустые строки



    // Выводим результат
    console.log(`addresses`, addresses);
    console.log(`products`, products);

  };

  reader.readAsArrayBuffer(file);
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
