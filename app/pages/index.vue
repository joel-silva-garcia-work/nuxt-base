<template>
  <main class="home">
    <section>
      <p class="eyebrow">Nuxt + TypeScript</p>
      <h1>Nuxt Base</h1>
      <p>Entorno inicial del proyecto. La funcionalidad se incorporara en las siguientes subfases.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
defineOptions({ name: 'HomePage' })
</script>

<style scoped>
.home {
  display: grid;
  min-height: 100vh;
  padding: 2rem;
  place-items: center;
  background: #f8fafc;
  color: #172033;
  font-family: system-ui, sans-serif;
}

section {
  max-width: 42rem;
}

.eyebrow {
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 0.5rem 0 1rem;
  font-size: clamp(2.5rem, 8vw, 4rem);
}

section > p:last-child {
  color: #475569;
  font-size: 1.125rem;
  line-height: 1.6;
}
</style>
