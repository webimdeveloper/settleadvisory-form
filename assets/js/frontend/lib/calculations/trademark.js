// A discount is active only while enabled, has a positive percent, and (if a
// validity date is set) today has not passed it yet.
function resolveDiscount(discountCfg = {}) {
  const percent = Math.max(0, Math.min(100, Number(discountCfg.percent) || 0));
  const validUntil = discountCfg.valid_until || '';
  let active = !!discountCfg.enabled && percent > 0;

  if (active && validUntil) {
    const end = new Date(`${validUntil}T23:59:59`);
    if (!Number.isNaN(end.getTime()) && new Date() > end) {
      active = false;
    }
  }

  return { active, percent, validUntil };
}

export function calculateTotals(configRoot = {}, rows = [], mode = 'company') {
  const cfg = configRoot?.[mode] || {};
  const bucUzs = Number(configRoot?.buc_uzs) || 412000;
  const usdToUzs = Number(configRoot?.usd_to_uzs) || 12000;
  const optionsCfg = configRoot?.options || {};
  const searchCfg = optionsCfg?.search || {};
  const accelCfg = optionsCfg?.accel || {};
  const vatRate = Number(optionsCfg?.vat_rate);
  const safeVatRate = Number.isFinite(vatRate) ? vatRate : 0.12;
  // Prevent division by zero if rate is missing
  const exchangeRate = usdToUzs > 0 ? usdToUzs : 12000;

  let totalSubmitBUC = 0;
  let totalCertBUC = 0;
  let searchUZS = 0;
  let accelUZS = 0;
  let classes = 0;

  const safeRows = Array.isArray(rows) && rows.length ? rows : [{ id: 'row-1', classes: 1 }];
  const classCounts = [];
  
  safeRows.forEach((row) => {
    const value = Number(row.classes);
    const clamped = Number.isFinite(value) && value >= 1 ? value : 1;
    classCounts.push(clamped);
    classes += clamped;

    const extra = Math.max(clamped - 1, 0);
    const submitBUC = Number(cfg.submit_first || 0) + Number(cfg.submit_additional || 0) * extra;
    const certBUC = Number(cfg.cert_first || 0) + Number(cfg.cert_additional || 0) * extra;
    const tmType = ['word', 'fig', 'combined'].includes(row.trademarkType) ? row.trademarkType : null;
    
    totalSubmitBUC += submitBUC;
    totalCertBUC += certBUC;

    if (row.searchEnabled && tmType) {
      const searchTypeCfg = searchCfg?.[tmType] || {};
      const base = Number(searchTypeCfg?.base) || 0;
      const extraCost = Number(searchTypeCfg?.extra) || 0;
      searchUZS += base + extra * extraCost;
    }

    if (row.accelEnabled && tmType) {
      const stateBase = Number(accelCfg?.state_base_buc?.[tmType]) || 0;
      const stateExtra = Number(accelCfg?.state_extra_buc) || 0;
      const serviceFixed = Number(accelCfg?.service_uzs) || 0;
      const stateWithVat = ((stateBase + extra * stateExtra) * bucUzs) * (1 + safeVatRate);
      accelUZS += stateWithVat + serviceFixed;
    }
  });

  // Calculate Base State Duties in UZS
  const stateDutySubmitUZS = totalSubmitBUC * bucUzs;
  const stateDutyCertUZS = totalCertBUC * bucUzs;
  const stateDutyUZS = stateDutySubmitUZS + stateDutyCertUZS;

  // Calculate Service Fee in UZS
  const servicePerTmUZS = Number(cfg.service_fee_uzs) || 0;
  const serviceUZS = servicePerTmUZS * safeRows.length;

  // Discount applies only to the Service fee and the Trademark Search fee —
  // never to official state fees or Priority Examination.
  const discount = resolveDiscount(configRoot?.discount);
  const discountFactor = discount.active ? 1 - discount.percent / 100 : 1;
  const serviceDiscountedUZS = serviceUZS * discountFactor;
  const searchDiscountedUZS = searchUZS * discountFactor;

  const totalUZS = stateDutyUZS + serviceDiscountedUZS + searchDiscountedUZS + accelUZS;

  // Convert to USD and round
  const stateDutySubmitUSD = Math.round(stateDutySubmitUZS / exchangeRate);
  const stateDutyCertUSD = Math.round(stateDutyCertUZS / exchangeRate);
  const stateDutyUSD = stateDutySubmitUSD + stateDutyCertUSD;
  const serviceUSD = Math.round(serviceUZS / exchangeRate);
  const serviceDiscountedUSD = Math.round(serviceDiscountedUZS / exchangeRate);
  const searchUSD = Math.round(searchUZS / exchangeRate);
  const searchDiscountedUSD = Math.round(searchDiscountedUZS / exchangeRate);
  const accelUSD = Math.round(accelUZS / exchangeRate);
  const totalUSD = Math.round(totalUZS / exchangeRate);

  return {
    mode,
    trademarks: safeRows.length,
    classes,
    classCounts,
    discount,
    totals: {
      // Primary USD values for display
      stateDutySubmitUSD,
      stateDutyCertUSD,
      stateDutyUSD,
      serviceUSD,
      serviceDiscountedUSD,
      searchUSD,
      searchDiscountedUSD,
      accelUSD,
      totalUSD,
      // Optional: Pass UZS values if needed for debugging/display
      stateDutySubmitUZS,
      stateDutyCertUZS,
      stateDutyUZS,
      serviceUZS,
      serviceDiscountedUZS,
      searchUZS,
      searchDiscountedUZS,
      accelUZS,
      totalUZS,
    },
  };
}

export default calculateTotals;
