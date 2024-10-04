export default function convertToUtf8(arrayBuffer) {
// Декодируем содержимое файла
const decoder = new TextDecoder('windows-1251'); // Исходная кодировка
const text = decoder.decode(arrayBuffer);

// Кодируем в новую кодировку (например, UTF-8)
const encoder = new TextEncoder();
const utf8Array = encoder.encode(text);

// Преобразуем обратно в строку для отображения
return  new TextDecoder('utf-8').decode(utf8Array);
}
