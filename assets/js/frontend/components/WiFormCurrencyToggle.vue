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
  <div class="wi_currency-toggle">
    <input
      type="radio"
      name="currency"
      value="USD"
      id="currency-usd"
      :checked="currency === 'USD'"
      @change="onCurrencyChange"
    />
    <label for="currency-usd">USD</label>

    <input
      type="radio"
      name="currency"
      value="UZS"
      id="currency-uzs"
      :checked="currency === 'UZS'"
      @change="onCurrencyChange"
    />
    <label for="currency-uzs">UZS</label>
  </div>
</template>
