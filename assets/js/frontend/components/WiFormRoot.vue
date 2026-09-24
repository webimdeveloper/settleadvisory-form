<script setup>
import { computed, reactive, ref } from 'vue';
import { calculateTotals } from '../lib/calculations/trademark';
import FormStep from './steps/FormStep.vue';
import ResultStep from './steps/ResultStep.vue';

const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
  instanceId: {
    type: String,
    default: '',
  },
});

// Set only by the manager quote shortcode's config (never by the public
// calculator) — switches to a higher-contrast palette (wi_root--manager in
// variables.css) for screenshotting the result screen into a proposal.
const isManagerView = !!props.config?.managerView;

// Manager view only: config.labelsByLang holds every active Polylang
// language's label set (PHP resolves them all up front via
// pll_translate_string, see get_manager_language_data), so switching here
// is instant and doesn't reload the page and lose whatever's been typed.
const currentLangSlug = ref(props.config?.currentLang || props.config?.languages?.[0]?.slug || '');

const activeConfig = computed(() => {
  const byLang = props.config?.labelsByLang;
  if (!byLang || !byLang[currentLangSlug.value]) return props.config;
  return { ...props.config, labels: byLang[currentLangSlug.value] };
});

function handleLanguage(slug) {
  currentLangSlug.value = slug;
}

// YYYY-MM-DD for the discount field's default — tomorrow, not blank, so
// the manager sees a real date immediately rather than an empty picker.
function getTomorrowISODate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const formState = reactive({
  mode: null, // no default; user must select company or private
  rows: [{ id: 'row-1', classes: 1, searchEnabled: false, accelEnabled: false, trademarkType: '' }],
  currency: 'USD',
  // Manager view only, entered on the form step instead of a URL param —
  // see discountFieldsEnabled (config.discountFieldsEnabled, PHP-gated on
  // the wi_code secret).
  discountPercent: 0,
  discountValidUntil: getTomorrowISODate(),
});

const currentStep = ref(0); // 0 = form, 1 = result
const results = ref(null);
const shellEl = ref(null);
const isDownloading = ref(false);

function handleMode(nextMode) {
  formState.mode = nextMode;
}

function handleRows(nextRows) {
  formState.rows = nextRows;
}

function handleCurrency(nextCurrency) {
  formState.currency = nextCurrency;
}

function handleDiscountPercent(nextPercent) {
  formState.discountPercent = nextPercent;
}

function handleDiscountValidUntil(nextDate) {
  formState.discountValidUntil = nextDate;
}

function handleNext() {
  // Discount is built from the form fields here, client-side — nothing
  // server-provided to merge, unlike the rest of the config. Requires
  // both a percent and a date; a half-filled pair is treated as no
  // discount rather than guessing what the manager meant.
  let configForCalc = props.config || {};
  if (isManagerView && formState.discountPercent > 0 && formState.discountValidUntil) {
    configForCalc = {
      ...configForCalc,
      discount: {
        enabled: true,
        percent: formState.discountPercent,
        valid_until: formState.discountValidUntil,
      },
    };
  }

  results.value = calculateTotals(configForCalc, formState.rows, formState.mode);
  currentStep.value = 1;
}

function handleBack() {
  currentStep.value = 0;
}

// Dynamic import here doesn't defer network loading — this bundle builds
// as a single IIFE (vite.config.js), so Rollup inlines html-to-image into
// it regardless. Kept dynamic anyway since it's free and correct if the
// build format ever changes to something that can code-split.
async function handleDownloadPng() {
  if (!shellEl.value || isDownloading.value) return;
  isDownloading.value = true;
  try {
    const { toPng } = await import('html-to-image');
    // The exported PNG gets pasted into a Word proposal at roughly half page
    // width next to ~10px Arial body text, so on-screen sizing reads too
    // small once shrunk that far. `style` is copied onto an offscreen clone
    // before rendering (html-to-image's apply-style.js), never onto the live
    // DOM, so applying zoom there doesn't touch the manager's on-screen view
    // — but html-to-image sizes its output canvas from the *live* node's
    // current dimensions before the clone's zoom is applied, so without
    // scaling width/height by the same factor the zoomed content just
    // overflows that canvas and gets cropped. Both must move together.
    const exportScale = 1.4;
    const rect = shellEl.value.getBoundingClientRect();
    const dataUrl = await toPng(shellEl.value, {
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      width: rect.width * exportScale,
      height: rect.height * exportScale,
      style: { zoom: String(exportScale) },
    });
    const link = document.createElement('a');
    link.download = `trademark-quote-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  } catch (e) {
    console.error('WiForm: PNG export failed', e);
  } finally {
    isDownloading.value = false;
  }
}
</script>

<template>
  <!-- .wi_root is the real outer scope every .wi_root .wi_btn / component
       style keys off of (see buttons.css). .wi_shell is just the bordered
       box — kept separate so the manager-view Back/Download controls below
       can sit outside the box (and out of its PNG export) while still
       inheriting the plugin's own styling instead of the browser default. -->
  <div class="wi_root" :class="{ 'wi_root--manager': isManagerView }" :data-instance-id="instanceId">
    <div ref="shellEl" class="wi_shell">
      <div v-if="currentStep === 0" class="wi_section">
        <!--<h2 class="wi_section__heading">Select applicant type below:</h2>-->
        <FormStep
          :formState="formState"
          :config="activeConfig"
          :currency="formState.currency"
          :managerView="isManagerView"
          :languages="config.languages"
          :currentLang="currentLangSlug"
          :discountFieldsEnabled="!!config.discountFieldsEnabled"
          :discountPercent="formState.discountPercent"
          :discountValidUntil="formState.discountValidUntil"
          @update:mode="handleMode"
          @update:rows="handleRows"
          @update:currency="handleCurrency"
          @update:language="handleLanguage"
          @update:discountPercent="handleDiscountPercent"
          @update:discountValidUntil="handleDiscountValidUntil"
          @next="handleNext"
        />
      </div>

      <div v-else class="wi_section">
        <!-- <h2 class="wi_section__heading">Results</h2> -->
        <ResultStep
          :results="results"
          :config="activeConfig"
          :currency="formState.currency"
          :redirectUrl="activeConfig?.redirectUrl"
          :managerView="isManagerView"
          @back="handleBack"
          @update:currency="handleCurrency"
        />
      </div>
    </div>

    <!-- Manager quote view: Back/Download live outside the bordered box on
         purpose, so a PNG export of the box never includes them, but a
         manager can still fix a typo without reloading and losing input. -->
    <div v-if="isManagerView && currentStep === 1" class="wi_manager-back-wrap">
      <button class="wi_btn wi_btn--secondary wi_btn-to-back" type="button" @click="handleBack">{{ activeConfig.labels?.back || '← Back' }}</button>
      <button
        class="wi_btn wi_btn--secondary wi_btn-to-download"
        type="button"
        :disabled="isDownloading"
        @click="handleDownloadPng"
      >{{ isDownloading ? 'Preparing…' : 'Download PNG' }}</button>
    </div>
  </div>
</template>

