/* eslint-env node */
module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  'rules': {
    indent: ['error', 2], // отступы в файлах JS
    'vue/script-indent': ['error', 2, { // Отступы в VUE файлах
      switchCase: 1
    }],
    'no-var': ['error'], // заменяет var на let, const
    'object-curly-spacing': ['error', 'always'], // отступы от curly
    'comma-dangle': ['error', 'never'], // запрет запятых после пустых элементов
    'quotes': ['error', 'single'], // замена двойных кавычек на одинарные
    'semi': ['error', 'always'], // ставит ; в конце строки
    'max-len': ["error", { "code": 120 }] // максимальное количество кода в строке
  },
  'overrides': [
    {
      "files": ["*.vue"], // отключаем правило indent, если это Vue файл
      "rules": {
        "indent": "off"
      }
    }
  ]
}
