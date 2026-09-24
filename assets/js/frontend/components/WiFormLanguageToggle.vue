<script setup>
defineProps({
  languages: { type: Array, default: () => [] }, // [{ slug, name }]
  current: { type: String, default: '' },
});

const emit = defineEmits(['update:language']);

function onChange(e) {
  emit('update:language', e.target.value);
}
</script>

<template>
  <div class="wi_inputs__radio-group wi_inputs__radio-group--inline wi_language-toggle">
    <label class="wi_inputs__radio-label" v-for="lang in languages" :key="lang.slug">
      <input
        type="radio"
        name="wiform-language"
        :value="lang.slug"
        :checked="current === lang.slug"
        @change="onChange"
      />
      <span>{{ lang.name }}</span>
    </label>
  </div>
</template>
