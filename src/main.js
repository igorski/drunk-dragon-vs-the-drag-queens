import Vue from 'vue';
import RPG from './rpg.vue';
import './registerServiceWorker';
import store from './store';

Vue.config.productionTip = false;

new Vue({
    store,
    render: h => h(RPG)
}).$mount('#app');
