<script setup>
import { computed } from "vue";
import WiFormCurrencyToggle from './WiFormCurrencyToggle.vue';

const props = defineProps({
  summary: {
    type: Object,
    default: () => ({
      mode: "company",
      trademarks: 1,
      classes: 1,
      totals: {
        stateDutyUSD: 0,
        serviceUSD: 0,
        totalUSD: 0,
      },
    }),
  },
  currency: { type: String, default: 'USD' },

  rate: { type: Number, default: 12000 },
  config: { type: Object, default: () => ({}) },
  // Manager quote view picks currency on the form step instead — this
  // screen is a static snapshot meant for a screenshot/PDF.
  managerView: { type: Boolean, default: false },
});

const emit = defineEmits(['update:currency']);

function withColon(label = '') {
  return String(label || '').replace(/\s*:\s*$/, '') + ':';
}

const formatter = computed(() => {
  if (props.currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  // UZS use decimal
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
});

function getValue(usdValue) {
  if (props.currency === 'UZS') {
    return usdValue * props.rate;
  }
  return usdValue;
}

// Computed properties for each total
const formattedStateDutySubmit = computed(() => {
  const val = props.currency === 'UZS'
    ? (props.summary.totals.stateDutySubmitUZS ?? (props.summary.totals.stateDutySubmitUSD * props.rate))
    : props.summary.totals.stateDutySubmitUSD;
  return formatter.value.format(val);
});

const formattedStateDutyCert = computed(() => {
  const val = props.currency === 'UZS'
    ? (props.summary.totals.stateDutyCertUZS ?? (props.summary.totals.stateDutyCertUSD * props.rate))
    : props.summary.totals.stateDutyCertUSD;
  return formatter.value.format(val);
});

const discount = computed(() => props.summary.discount || { active: false });
const discountActive = computed(() => !!discount.value.active);

const formattedService = computed(() => {
  const val = props.currency === 'UZS'
    ? (props.summary.totals.serviceUZS ?? (props.summary.totals.serviceUSD * props.rate))
    : props.summary.totals.serviceUSD;
  return formatter.value.format(val);
});

const formattedServiceDiscounted = computed(() => {
  const val = props.currency === 'UZS'
    ? (props.summary.totals.serviceDiscountedUZS ?? (props.summary.totals.serviceDiscountedUSD * props.rate))
    : props.summary.totals.serviceDiscountedUSD;
  return formatter.value.format(val);
});

const formattedSearch = computed(() => {
  const val = props.currency === 'UZS'
    ? (props.summary.totals.searchUZS ?? (props.summary.totals.searchUSD * props.rate))
    : (props.summary.totals.searchUSD ?? 0);
  return formatter.value.format(val);
});

const formattedSearchDiscounted = computed(() => {
  const val = props.currency === 'UZS'
    ? (props.summary.totals.searchDiscountedUZS ?? (props.summary.totals.searchDiscountedUSD * props.rate))
    : (props.summary.totals.searchDiscountedUSD ?? 0);
  return formatter.value.format(val);
});

const formattedAccel = computed(() => {
  const val = props.currency === 'UZS'
    ? (props.summary.totals.accelUZS ?? (props.summary.totals.accelUSD * props.rate))
    : (props.summary.totals.accelUSD ?? 0);
  return formatter.value.format(val);
});

// Sum of the three mandatory rows (filing + certificate + service), using the
// discounted service fee once a discount is active.
const formattedSubtotal = computed(() => {
  const submit = props.currency === 'UZS'
    ? (props.summary.totals.stateDutySubmitUZS ?? (props.summary.totals.stateDutySubmitUSD * props.rate))
    : props.summary.totals.stateDutySubmitUSD;
  const cert = props.currency === 'UZS'
    ? (props.summary.totals.stateDutyCertUZS ?? (props.summary.totals.stateDutyCertUSD * props.rate))
    : props.summary.totals.stateDutyCertUSD;
  const service = discountActive.value
    ? (props.currency === 'UZS'
      ? (props.summary.totals.serviceDiscountedUZS ?? (props.summary.totals.serviceDiscountedUSD * props.rate))
      : props.summary.totals.serviceDiscountedUSD)
    : (props.currency === 'UZS'
      ? (props.summary.totals.serviceUZS ?? (props.summary.totals.serviceUSD * props.rate))
      : props.summary.totals.serviceUSD);
  return formatter.value.format(submit + cert + service);
});

const hasAdditionalServices = computed(() => {
  return !!(
    props.summary.totals.searchUZS || props.summary.totals.searchUSD ||
    props.summary.totals.accelUZS || props.summary.totals.accelUSD
  );
});

// Builds "The above discount is valid until September 30, 2026." from the
// configured valid_until date (parsed as local calendar date, not UTC, so
// the displayed day never shifts with the visitor's timezone).
const discountNoteText = computed(() => {
  if (!discountActive.value) return '';
  const validUntil = discount.value.validUntil;
  if (!validUntil) return '';

  const [year, month, day] = validUntil.split('-').map(Number);
  if (!year || !month || !day) return '';

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(year, month - 1, day));

  const template = props.config.labels?.discount_valid_until_note
    || 'The above discount is valid until {date}.';
  return template.replace('{date}', formattedDate);
});

const formattedClasses = computed(() => {
  const total = props.summary.classes;
  const counts = props.summary.classCounts || [];
  
  if (counts.length > 1) {
    const breakdown = counts.join(' + ');
    return `${total} <span class="wi_stat__breakdown">(${breakdown})</span>`;
  }
  return total;
});

</script>

<template>
  <div class="wi_summary">

    <WiFormCurrencyToggle
      v-if="!managerView"
      :currency="currency"
      @update:currency="emit('update:currency', $event)"
    />

    <div class="wi_card wi_card--totals">
      <div class="wi_group wi_group--selected">
        <div class="wi_stat">
          <span class="wi_stat__label">{{ config.labels?.applicant_type || 'Applicant type:' }}</span>
          <span class="wi_stat__value">{{
            summary.mode === "company"
              ? (config.labels?.legal_entity || "Legal entity")
              : (config.labels?.individual || "Individual")
          }}</span>
        </div>
        <div class="wi_stat">
          <span class="wi_stat__label">{{ config.labels?.trademarks || 'Trademarks:' }}</span>
          <span class="wi_stat__value">{{ summary.trademarks }}</span>
        </div>
        <div class="wi_stat">
          <span class="wi_stat__label">{{ config.labels?.total_classes || 'Total classes:' }}</span>
          <span class="wi_stat__value" v-html="formattedClasses"></span>
        </div>
      </div>
      <div class="wi_group wi_group--mandatory">
        <p class="wi_group__title">{{ config.labels?.standard_registration_costs || 'Standard Registration Costs' }}</p>
        <div class="wi_stat">
          <span class="wi_stat__label">{{ config.labels?.state_fee_filing || 'State fee for filing:' }}</span>
          <span class="wi_stat__value">{{ formattedStateDutySubmit }} {{ currency }}</span>
        </div>
        <div class="wi_stat">
          <span class="wi_stat__label">{{ config.labels?.state_fee_cert || 'State fee for TM certificate:' }}</span>
          <span class="wi_stat__value">{{ formattedStateDutyCert }} {{ currency }}</span>
        </div>
        <div class="wi_stat">
          <span class="wi_stat__label">{{ config.labels?.service || 'Service:' }}</span>
          <span class="wi_stat__value">
            <template v-if="discountActive">
              <span class="wi_price--original">{{ formattedService }} {{ currency }}</span>
              <span class="wi_price--discounted">{{ formattedServiceDiscounted }} {{ currency }}</span>
            </template>
            <template v-else>{{ formattedService }} {{ currency }}</template>
          </span>
        </div>
        <div class="wi_stat wi_stat--subtotal" v-if="hasAdditionalServices">
          <span class="wi_stat__label">{{ withColon(config.labels?.subtotal || 'Subtotal') }}</span>
          <span class="wi_stat__value">{{ formattedSubtotal }} {{ currency }}</span>
        </div>
      </div>

      <div class="wi_group wi_group--optional" v-if="hasAdditionalServices">
        <p class="wi_group__title">{{ config.labels?.additional_services || 'Additional Services' }}</p>
        <div class="wi_stat" v-if="(summary.totals.searchUZS || summary.totals.searchUSD)">
          <span class="wi_stat__label">{{ withColon(config.labels?.search_total || 'Trademark search') }}</span>
          <span class="wi_stat__value">
            <template v-if="discountActive">
              <span class="wi_price--original">{{ formattedSearch }} {{ currency }}</span>
              <span class="wi_price--discounted">{{ formattedSearchDiscounted }} {{ currency }}</span>
            </template>
            <template v-else>{{ formattedSearch }} {{ currency }}</template>
          </span>
        </div>
        <div class="wi_stat" v-if="(summary.totals.accelUZS || summary.totals.accelUSD)">
          <span class="wi_stat__label">{{ withColon(config.labels?.accelerated_total || 'Expedited registration') }}</span>
          <span class="wi_stat__value">{{ formattedAccel }} {{ currency }}</span>
        </div>
      </div>
    </div>
    <p class="wi_p-note">
      {{ config.labels?.note_text || 'The stated price is for reference only and does not guarantee the final cost.' }}
    </p>
    <p class="wi_p-note" v-if="discountNoteText">{{ discountNoteText }}</p>
  </div>
</template>
