<template functional>
    <span>
        <a
            :href="props.href"
            :title="props.title"
            target="_blank"
            rel="noopener noreferrer"
        >
            {{ props.title }}
        </a> {{ parent.$t('by') }} <span class="author">{{ props.author }}</span>
    </span>
</template>

<script>
export default {
    props: {
        title: {
            type: String,
            required: true
        },
        author: {
            type: String,
            required: true
        },
        href: {
            type: String,
            required: true
        }
    }
};
</script>

<style scoped>
.author {
    font-style: italic;
}
</style>
