<script setup>
import { reactive, ref } from 'vue';
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

const formState = reactive({
  mode: null, // no default; user must select company or private
  rows: [{ id: 'row-1', classes: 1, searchEnabled: false, accelEnabled: false, trademarkType: '' }],
  currency: 'USD',
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

function handleNext() {
  // perform calculation and move to result step
  results.value = calculateTotals(props.config || {}, formState.rows, formState.mode);
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
    const dataUrl = await toPng(shellEl.value, {
      pixelRatio: 3,
      backgroundColor: '#ffffff',
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
          :config="config"
          :currency="formState.currency"
          :managerView="isManagerView"
          @update:mode="handleMode"
          @update:rows="handleRows"
          @update:currency="handleCurrency"
          @next="handleNext"
        />
      </div>

      <div v-else class="wi_section">
        <!-- <h2 class="wi_section__heading">Results</h2> -->
        <ResultStep
          :results="results"
          :config="config"
          :currency="formState.currency"
          :redirectUrl="config?.redirectUrl"
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
      <button class="wi_btn wi_btn--secondary wi_btn-to-back" type="button" @click="handleBack">{{ config.labels?.back || '← Back' }}</button>
      <button
        class="wi_btn wi_btn--secondary wi_btn-to-download"
        type="button"
        :disabled="isDownloading"
        @click="handleDownloadPng"
      >{{ isDownloading ? 'Preparing…' : 'Download PNG' }}</button>
    </div>
  </div>
</template>

