/**
 * Mixin to manage hover states for menu items
 * within an actions list.
 */
export default {
    data: () => ({
        hoverItem: null,
    }),
    methods: {
        setHoverItem( item ) {
            this.hoverItem = item;
        }
    }
};
