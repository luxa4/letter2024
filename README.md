# Письма

### Новый рисунок
Рисунок для конверта подкгружается из /components/SvgImg.
1) Взять новый рисунок и открыть его в шаблоне для нужного конверта(чтобы выставить среди снежинок).
2) Получившийся рисунок из п.1. необходимо открыть в шаблоне SVG
3) Создать новый js файл в SvgImg и создать export const fixeC5
4) Поменять размеры SVG с mm на pt.


### Кастомные шрифты для pdf:
1) открыть node_modules/pdfmake/
2) создать 2 папки examples/fonts
3) добавить туда нужные шрифты
4) К командной строке перейти в папку node_modules/pdfmake/
5) Выполнить команду **node build-vfs.js "./examples/fonts"**
