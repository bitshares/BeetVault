import { createApp, h } from 'vue';
import { RouterView } from 'vue-router';
import mitt from 'mitt';

import './styles/globals.css';

import 'typeface-roboto';
import 'typeface-rajdhani';

import './scss/beet.scss';

import router from './router/index.js';
import { pinia } from './stores/index.js';
import { useSettingsStore } from './stores/settingsStore.js';
import {i18n} from './lib/i18n.js';

window.onerror = function (msg, url, lineNo, columnNo, error) {
  console.log(error);
  return false;
};

const emitter = mitt();
const app = createApp({
  render() {
    return h('div', { class: 'main' }, [
      h(RouterView, { name: 'header' }),
      h(RouterView),
    ]);
  },
});
app.provide('emitter', emitter);

app.config.errorHandler = function (err, vm, info) {
  console.log(err);
};

// Forward uncaught renderer promise rejections to the main process so they
// are captured in crash reporting regardless of where they originate.
window.addEventListener("unhandledrejection", (e) => {
  window.electron?.sendError?.(e.reason?.stack || e.reason);
  e.preventDefault();
});

app.use(i18n);

window.t = (key, params) => {
    return i18n.global.t(key, params)
}

app.use(router);
app.use(pinia);
useSettingsStore().loadSettings();
app.mount('#app');

emitter.on('i18n', (data) => {
  i18n.global.locale.value = data
});
