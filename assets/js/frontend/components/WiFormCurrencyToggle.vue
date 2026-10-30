<script setup>
defineProps({
  currency: { type: String, default: 'USD' },
});

const emit = defineEmits(['update:currency']);

function onCurrencyChange(e) {
  emit('update:currency', e.target.value);
}
</script>

<template>
  <div class="wi_inputs__radio-group wi_inputs__radio-group--inline wi_currency-toggle">
    <label class="wi_inputs__radio-label">
      <input
        type="radio"
        name="currency"
        value="USD"
        :checked="currency === 'USD'"
        @change="onCurrencyChange"
      />
      <span>USD</span>
    </label>

    <label class="wi_inputs__radio-label">
      <input
        type="radio"
        name="currency"
        value="UZS"
        :checked="currency === 'UZS'"
        @change="onCurrencyChange"
      />
      <span>UZS</span>
    </label>
  </div>
</template>
