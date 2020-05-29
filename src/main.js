import Vue from 'vue';
import VueI18n from 'vue-i18n'
import RPG from './rpg.vue';
import './registerServiceWorker';
import store from './store';

Vue.use(VueI18n);
Vue.config.productionTip = false;

new Vue({
    store,
    render: h => h(RPG)
}).$mount('#app');
