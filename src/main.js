import Vue  from 'vue';
import Vuex from 'vuex';
import RPG  from './rpg.vue';
import store from './store';
import './registerServiceWorker';

Vue.config.productionTip = false;
Vue.use( Vuex );

new Vue({
    store: new Vuex.Store( store ),
    render: h => h( RPG )
}).$mount('#app');
