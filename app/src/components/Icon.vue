<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'home'">
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.8 20v-5.5h4.4V20" />
    </template>
    <template v-else-if="name === 'grid'">
      <rect x="3.8" y="3.8" width="6.9" height="6.9" rx="0.8" />
      <rect x="13.3" y="3.8" width="6.9" height="6.9" rx="0.8" />
      <rect x="3.8" y="13.3" width="6.9" height="6.9" rx="0.8" />
      <rect x="13.3" y="13.3" width="6.9" height="6.9" rx="0.8" />
    </template>
    <template v-else-if="name === 'music'">
      <path d="M9.5 17.5V6.8l9.5-2v10.9" />
      <circle cx="7.2" cy="17.5" r="2.3" />
      <circle cx="16.7" cy="15.7" r="2.3" />
    </template>
    <template v-else-if="name === 'guitar'">
      <circle cx="12" cy="15.8" r="5.2" />
      <circle cx="12" cy="15.8" r="1.5" />
      <path d="M12 10.6V5" />
      <path d="M9.6 5h4.8" />
      <path d="M10.6 4.1h2.8" />
    </template>
    <template v-else-if="name === 'user'">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c0-3.9 3.3-6.2 7.5-6.2s7.5 2.3 7.5 6.2" />
    </template>
    <template v-else-if="name === 'metronome'">
      <circle cx="12" cy="12" r="8.3" />
      <path d="M12 7.8V12l3.4 1.9" />
    </template>
    <template v-else-if="name === 'tuner'">
      <circle cx="12" cy="12" r="8.3" />
      <path d="M12 12l5.6-5.6" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'sliders'">
      <path d="M4 7.5h9" />
      <path d="M17.5 7.5H20" />
      <path d="M4 16.5h3.5" />
      <path d="M12 16.5h8" />
      <circle cx="15.5" cy="7.5" r="2" />
      <circle cx="9.5" cy="16.5" r="2" />
    </template>
    <template v-else-if="name === 'bell'">
      <path d="M12 4.2a5.8 5.8 0 0 1 5.8 5.8c0 4.6 1.7 5.8 1.7 5.8H4.5s1.7-1.2 1.7-5.8A5.8 5.8 0 0 1 12 4.2Z" />
      <path d="M10.3 19.2a1.9 1.9 0 0 0 3.4 0" />
    </template>
    <template v-else-if="name === 'chevron-left'">
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </template>
    <template v-else-if="name === 'calendar'">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3.5M16 3v3.5" />
    </template>
    <template v-else-if="name === 'chart'">
      <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
    </template>
    <template v-else-if="name === 'book'">
      <path d="M12 6.5C10.5 5 8.5 4.5 4.5 4.5v13c4 0 6 .5 7.5 2 1.5-1.5 3.5-2 7.5-2v-13c-4 0-6 .5-7.5 2Z" />
      <path d="M12 6.5v13" />
    </template>
    <template v-else-if="name === 'circle'">
      <circle cx="12" cy="12" r="8.5" />
    </template>
    <template v-else-if="name === 'check-circle'">
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.2 12.3 2.6 2.6 5-5.4" />
    </template>
  </svg>
</template>
