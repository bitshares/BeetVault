import { createApp } from 'vue';
import { createPinia } from 'pinia';
import mitt from 'mitt';

import './styles/globals.css';

import 'typeface-roboto';
import 'typeface-rajdhani';

import './css/style.css';
import './scss/beet.scss';

import {i18n} from './lib/i18n.js';
import Receipt from './components/receipt.vue';

window.onerror = function (msg, url, lineNo, columnNo, error) {
  console.log(error);
  return false;
};

const pinia = createPinia();
const emitter = mitt();
const app = createApp({});
app.use(pinia);
app.provide('emitter', emitter);

app.config.errorHandler = function (err, vm, info) {
  console.log("error:" + err);
};

app.component('Receipt', Receipt);
app.use(i18n);

window.t = (key, params) => {
    return i18n.global.t(key, params)
}

app.mount('#receipt');

emitter.on('i18n', (data) => {
    i18n.global.locale.value = data
});  