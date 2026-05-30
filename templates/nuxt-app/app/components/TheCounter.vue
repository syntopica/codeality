<script setup lang="ts">
const { count, increment } = useCounter()
</script>

<template>
  <section aria-label="Counter" class="flex flex-col items-center gap-2">
    <p data-testid="count">
      {{ count }}
    </p>
    <button
      class="rounded bg-blue-600 px-3 py-1 text-white"
      data-testid="increment"
      type="button"
      @click="increment"
    >
      Increment
    </button>
  </section>
</template>
