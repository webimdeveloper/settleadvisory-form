<script setup>
import { computed, defineProps, defineEmits, ref } from 'vue';
import WiFormInputs from '../WiFormInputs.vue';
import WiFormCurrencyToggle from '../WiFormCurrencyToggle.vue';
import WiFormLanguageToggle from '../WiFormLanguageToggle.vue';

const props = defineProps({
  formState: { type: Object, required: true },
  config: { type: Object, required: true },
  currency: { type: String, default: 'USD' },
  // Manager quote view picks currency here, before calculating — the result
  // screen there is a static snapshot for a screenshot/PDF, not interactive.
  managerView: { type: Boolean, default: false },
  languages: { type: Array, default: () => [] },
  currentLang: { type: String, default: '' },
  // PHP-gated on the wi_code secret (see render_trademark_manager_shortcode)
  // — false renders no discount fields at all, not just disabled ones, so
  // a visitor without the code never sees that the feature exists.
  discountFieldsEnabled: { type: Boolean, default: false },
  discountPercent: { type: [Number, String], default: 0 },
  discountValidUntil: { type: String, default: '' },
});

const emit = defineEmits([
  'update:mode',
  'update:rows',
  'update:currency',
  'update:language',
  'update:discountPercent',
  'update:discountValidUntil',
  'next',
]);
const showError = ref(false);
const dateInputEl = ref(null);

// discountValidUntil is stored/emitted as YYYY-MM-DD (what the calculator
// and the native <input type="date"> both expect); displayed as
// DD.MM.YYYY to match the rest of the app (see WiFormSummary.vue's own
// date formatting) instead of the browser's own locale-dependent text.
const formattedValidUntil = computed(() => {
  const [year, month, day] = (props.discountValidUntil || '').split('-');
  if (!year || !month || !day) return props.discountValidUntil || '';
  return `${day}.${month}.${year}`;
});

// min/max on the <input> only affect the spinner arrows and native form
// validation, not what you can actually type — clamps every keystroke to
// a whole 0-100 so "0.7" or "1002" can never reach formState.
function handleDiscountPercentInput(rawValue) {
  if (rawValue === '') {
    emit('update:discountPercent', 0);
    return;
  }
  const clamped = Math.min(100, Math.max(0, Math.round(Number(rawValue))));
  emit('update:discountPercent', clamped);
}

// The visible text is a plain span, not the native input itself (which
// can't be restyled to show DD.MM.YYYY reliably across browsers) — click
// it anywhere, not just the small calendar icon, to open the real picker
// underneath. showPicker() is Chrome/Edge 99+, Safari 16.4+; falls back
// to a normal focus (native browser behavior) elsewhere.
function openDatePicker() {
  const el = dateInputEl.value;
  if (!el) return;
  if (typeof el.showPicker === 'function') {
    el.showPicker();
  } else {
    el.focus();
  }
}

function handleMode(nextMode) {
  emit('update:mode', nextMode);
  // Clear error state as soon as a mode is selected
  showError.value = false;
}

function handleRows(nextRows) {
  emit('update:rows', nextRows);
}

function onNext() {
  // Validation: customer type must be selected
  if (!props.formState.mode || !['company', 'private'].includes(props.formState.mode)) {
    showError.value = true;
    console.warn('WiForm: customer type not selected');
    return; // do not emit next
  }

  // Reset error if customer type is now selected
  showError.value = false;

  // Validation: at least one trademark row with valid classes
  const rows = Array.isArray(props.formState.rows) ? props.formState.rows : [];
  if (rows.length === 0) {
    console.warn('WiForm: no trademark rows');
    return;
  }

  // Ensure all rows have valid class counts (>= 1)
  const allValid = rows.every((row) => {
    const classes = Number(row.classes);
    if (!Number.isFinite(classes) || classes < 1) return false;
    const hasOptional = Boolean(row.searchEnabled) || Boolean(row.accelEnabled);
    if (!hasOptional) return true;
    return ['word', 'fig', 'combined'].includes(row.trademarkType);
  });

  if (!allValid) {
    console.warn('WiForm: invalid trademark class count in one or more rows');
    return;
  }

  emit('next');
}
</script>

<template>
  <div class="wi_step wi_step--form">
    <WiFormCurrencyToggle
      v-if="managerView"
      :currency="currency"
      @update:currency="emit('update:currency', $event)"
    />

    <WiFormLanguageToggle
      v-if="managerView && languages.length > 1"
      :languages="languages"
      :current="currentLang"
      @update:language="emit('update:language', $event)"
    />

    <p class="wi_manager-discount" v-if="managerView && discountFieldsEnabled">
      {{ config.labels?.discount_prefix || 'Discount,' }}
      <input
        type="number"
        min="0"
        max="100"
        step="1"
        class="wi_manager-discount__percent"
        :value="discountPercent"
        @input="handleDiscountPercentInput($event.target.value)"
      />%. {{ config.labels?.discount_due_date_label || 'Due date:' }}
      <span class="wi_manager-discount__date" @click="openDatePicker">
        {{ formattedValidUntil }}
        <input
          ref="dateInputEl"
          type="date"
          class="wi_manager-discount__date-native"
          :value="discountValidUntil"
          @input="emit('update:discountValidUntil', $event.target.value)"
        />
      </span>
    </p>

    <WiFormInputs
      :mode="formState.mode"
      :rows="formState.rows"
      :config="config"
      :show-error="showError"
      @update:mode="handleMode"
      @update:rows="handleRows"
    >
      <template #secondary>
        <!-- Keep summary preview in the form if desired; parent may choose otherwise -->
      </template>
    </WiFormInputs>

    <div class="wi_step__actions">
      <button class="wi_btn wi_btn--primary wi_btn-prm-100" type="button" @click="onNext">{{ config.labels?.calculate || 'Calculate' }}</button>
    </div>
    <p v-if="showError" class="wi_form-error-note">Please choose applicant type above</p>
  </div>
</template>
