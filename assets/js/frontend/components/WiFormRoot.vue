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

</script>

<template>
  <div class="wi_root wi_shell" :class="{ 'wi_root--manager': isManagerView }" :data-instance-id="instanceId">
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
</template>

