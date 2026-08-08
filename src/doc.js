import { createApp, h } from 'vue';
import { createPinia } from 'pinia';
import mitt from 'mitt';

import './styles/globals.css';

import 'typeface-roboto';
import 'typeface-rajdhani';

import './css/style.css';
import './scss/beet.scss';

import { i18n } from './lib/i18n.js';
import Documentation from './components/documentation.vue';

window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.log(error);
    return false;
};

const pinia = createPinia();
const emitter = mitt();
const app = createApp({
    render() {
        return h('div', { class: 'main' }, [
            h(Documentation),
        ]);
    },
});
app.use(pinia);
app.provide('emitter', emitter);

app.config.errorHandler = function (err, vm, info) {
    console.log("error:" + err);
};

window.addEventListener("unhandledrejection", (e) => {
    window.electron?.sendError?.(e.reason?.stack || e.reason);
    e.preventDefault();
});

app.component('Documentation', Documentation);
app.component('documentation', Documentation);
app.use(i18n);

app.mount('#doc');

emitter.on('i18n', (data) => {
    i18n.global.locale.value = data;
});
