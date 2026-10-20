<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 28 })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <rect x="3" y="3" width="58" height="58" rx="14" fill="#0a0a0c" stroke="#c6ff3d" stroke-width="4" />
    <circle cx="17" cy="17" r="4.5" fill="#c6ff3d" />
    <circle cx="47" cy="17" r="4.5" fill="#c6ff3d" />
    <circle cx="17" cy="47" r="4.5" fill="#c6ff3d" />
    <circle cx="47" cy="47" r="4.5" fill="#c6ff3d" />
    <circle cx="32" cy="32" r="11" fill="#c6ff3d" />
    <circle cx="32" cy="32" r="8" fill="none" stroke="#0a0a0c" stroke-width="1.2" stroke-opacity="0.45" />
    <circle cx="32" cy="32" r="4.5" fill="#ff3d8b" />
    <circle cx="32" cy="32" r="1.3" fill="#0a0a0c" />
  </svg>
</template>
