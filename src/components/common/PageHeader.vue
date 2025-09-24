<template>
  <div class="page-header">
    <div class="header-left">
      <h2>{{ title }}</h2>
      <p v-if="description" class="page-description">{{ description }}</p>
    </div>
    <div class="header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  description: '',
})

defineOptions({
  name: 'PageHeader',
})
</script>

<style scoped>
@import '@/styles/common.css';
</style>
