import { jsx, jsxs, Fragment } from "react/jsx-runtime";
const plnFmt = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const plnFmt0 = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
const formatPLN = (v, decimals = 2) => (decimals === 0 ? plnFmt0 : plnFmt).format(v);
const formatPct = (v, d = 2) => `${v.toFixed(d)}%`;
const formatDate = (d) => dateFmt.format(d);
const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / 864e5);
const resolveWibor = (d, data) => {
  var _a;
  const s = toDateStr(d);
  let b = ((_a = data[0]) == null ? void 0 : _a.rate) ?? 0;
  for (const e of data) {
    if (e.date <= s) b = e.rate;
    else break;
  }
  return b;
};
const payDate = (start, off, day) => {
  const m = start.getMonth() + off, ty = start.getFullYear() + Math.floor(m / 12), tm = (m % 12 + 12) % 12;
  return new Date(ty, tm, Math.min(day, new Date(ty, tm + 1, 0).getDate()));
};
const ann = (b, r, m) => {
  if (r <= 0 || m <= 0) return m > 0 ? b / m : b;
  const rm = r / 100 / 12, f = Math.pow(1 + rm, m);
  return b * (rm * f) / (f - 1);
};
const int = (b, p, d, base = 360) => b * (p / 100) * d / base;
function parseStooqCSV(text) {
  return text.trim().split("\n").reduce((acc, line) => {
    const p = line.split(",");
    if (p.length >= 5 && /^\d{4}-\d{2}-\d{2}$/.test(p[0])) {
      const r = parseFloat(p[4]);
      if (!isNaN(r)) acc.push({ date: p[0], rate: r });
    }
    return acc;
  }, []).sort((a, b) => a.date.localeCompare(b.date));
}
const WIBOR_TENORS = [{ value: "3M", label: "WIBOR 3M" }, { value: "6M", label: "WIBOR 6M" }, { value: "1M", label: "WIBOR 1M" }];
const TENOR_RESET = { "1M": 1, "3M": 3, "6M": 6 };
const REPAYMENT_TYPES = [{ value: "annuity", label: "Raty równe" }, { value: "decreasing", label: "Raty malejące" }];
function calculateLoan(input) {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const wd = input.wiborData || [];
  const base = input.interestBase || 360;
  if (!wd.length) return null;
  const resetMonths = TENOR_RESET[input.wiborTenor] || 3;
  const isDecreasing = input.repaymentType === "decreasing";
  const schedule = [];
  let bal = input.loanAmount, balNW = input.loanAmount, balNR = input.loanAmount, prev = new Date(input.startDate);
  let wibor = resolveWibor(input.startDate, wd), inst = 0, instNW = 0, reset = 0;
  const a = { pastTotal: 0, pastPr: 0, pastInt: 0, pastIntW: 0, pastIntM: 0, pastIntB: 0, pastN: 0, futTotal: 0, futInt: 0, futIntW: 0, futIntM: 0, futN: 0, pastNoWibor: 0, pastIntNW: 0, pastPrNW: 0, futNoWibor: 0, futIntNW: 0, curInst: 0, curNW: 0, pastNoRate: 0, futNoRate: 0, curNR: 0 };
  for (let i = 1; i <= input.loanPeriodMonths; i++) {
    const pd = payDate(input.startDate, i, input.paymentDay), days = daysBetween(prev, pd), rem = input.loanPeriodMonths - i + 1, last = i === input.loanPeriodMonths;
    const bridge = input.bridgeEndDate && pd <= input.bridgeEndDate ? input.bridgeMargin : 0;
    reset++;
    if (reset >= resetMonths || i === 1) {
      if (i > 1) wibor = resolveWibor(pd, wd);
      reset = 0;
      inst = ann(bal, wibor + input.margin + bridge, rem);
      instNW = ann(balNW, input.margin + bridge, rem);
    }
    const iW = int(bal, wibor, days, base), iM = int(bal, input.margin, days, base), iB = int(bal, bridge, days, base), iT = iW + iM + iB;
    let pr = isDecreasing ? bal / rem : Math.max(inst - iT, 0);
    if (last || pr > bal) pr = bal;
    const isPast = pd <= today;
    schedule.push({ number: i, date: pd, days, wiborRate: wibor, installment: pr + iT, principal: pr, interestTotal: iT, interestWibor: iW, interestMargin: iM, interestBridge: iB, remainingBalance: bal - pr, isPast });
    bal = Math.max(bal - pr, 0);
    const iNW = int(balNW, input.margin + bridge, days, base);
    let pNW = isDecreasing ? balNW / rem : Math.max(instNW - iNW, 0);
    if (last || pNW > balNW) pNW = balNW;
    const nwInst = pNW + iNW, nrInst = rem > 0 ? balNR / rem : balNR, pNR = Math.min(nrInst, balNR);
    if (isPast) {
      a.pastTotal += pr + iT;
      a.pastPr += pr;
      a.pastInt += iT;
      a.pastIntW += iW;
      a.pastIntM += iM;
      a.pastIntB += iB;
      a.pastN++;
      a.pastNoWibor += nwInst;
      a.pastIntNW += iNW;
      a.pastPrNW += pNW;
      a.pastNoRate += nrInst;
    } else {
      if (a.futN === 0) {
        a.curInst = pr + iT;
        a.curNW = nwInst;
        a.curNR = nrInst;
      }
      a.futTotal += pr + iT;
      a.futInt += iT;
      a.futIntW += iW;
      a.futIntM += iM;
      a.futN++;
      a.futNoWibor += nwInst;
      a.futIntNW += iNW;
      a.futNoRate += nrInst;
    }
    balNW = Math.max(balNW - pNW, 0);
    balNR = Math.max(balNR - pNR, 0);
    prev = pd;
  }
  return { schedule, repaymentType: isDecreasing ? "decreasing" : "annuity", pastTotalPaid: a.pastTotal, pastPrincipalPaid: a.pastPr, pastInterestTotal: a.pastInt, pastInterestWibor: a.pastIntW, pastInterestMargin: a.pastIntM, pastInterestBridge: a.pastIntB, pastInstallmentsCount: a.pastN, futureTotalToPay: a.futTotal, futureInterestTotal: a.futInt, futureInterestWibor: a.futIntW, futureInterestMargin: a.futIntM, futureInstallmentsCount: a.futN, pastTotalPaidNoWibor: a.pastNoWibor, pastInterestNoWibor: a.pastIntNW, pastPrincipalNoWibor: a.pastPrNW, futureTotalNoWibor: a.futNoWibor, futureInterestNoWibor: a.futIntNW, overpaidInterest: a.pastInt - a.pastIntNW, futureSavings: a.futTotal - a.futNoWibor, currentInstallment: a.curInst, installmentNoWibor: a.curNW, pastTotalPaidNoRate: a.pastNoRate, futureTotalNoRate: a.futNoRate, installmentNoRate: a.curNR, overpaidWithMargin: a.pastTotal - a.pastNoRate, futureSavingsWithMargin: a.futTotal - a.futNoRate };
}
const scheduleColumns = [
  { key: "number", header: "#" },
  { key: "date", header: "Data" },
  { key: "installment", header: "Rata", align: "right" },
  { key: "principal", header: "Kapitał", align: "right" },
  { key: "interest", header: "Odsetki", align: "right" },
  { key: "wibor", header: "WIBOR%", align: "right" },
  { key: "balance", header: "Saldo", align: "right" }
];
const tabs = [
  { id: "summary", label: "Podsumowanie" },
  { id: "schedule", label: "Harmonogram" },
  { id: "compare", label: "Porównanie" }
];
const plugin = ({ React, store, ui, icons, sdk }) => {
  const { useState, useEffect } = React;
  const useRatesForTenor = (tenor) => {
    var _a, _b;
    const sets = store.usePosts("wibor-rate-set");
    const tenorId = `wibor-${tenor.toLowerCase()}`;
    return ((_b = (_a = sets.find((s) => s.data.tenorId === tenorId)) == null ? void 0 : _a.data) == null ? void 0 : _b.entries) || [];
  };
  const useCalcStore = sdk.create(() => ({ result: null }));
  const setResult = (r) => useCalcStore.setState({ result: r });
  const useResult = () => useCalcStore((s) => s.result);
  const KV = (label, value, color) => /* @__PURE__ */ jsxs(ui.Row, { justify: "between", children: [
    /* @__PURE__ */ jsx(ui.Text, { muted: true, children: label }),
    /* @__PURE__ */ jsx(ui.Value, { size: "sm", bold: !!color, color, children: value })
  ] });
  const KVCard = ({ title, rows }) => /* @__PURE__ */ jsx(ui.Card, { title, children: /* @__PURE__ */ jsx(ui.Stack, { children: rows.map(([l, v, c], i) => KV(l, v, c)) }) });
  function Left() {
    const { form, bind, set } = sdk.useForm({ loanAmount: 3e5, margin: 2, loanPeriodMonths: 360, startDate: "2018-01-01", paymentDay: 15, bridgeMargin: 0, bridgeEndDate: "", wiborTenor: "3M", manualRate: "", interestMethod: "360", repaymentType: "annuity" });
    const rates = useRatesForTenor(form.wiborTenor);
    const calculate = () => {
      const wd = rates.length ? rates : form.manualRate ? [{ date: "2000-01-01", rate: Number(form.manualRate) }] : null;
      if (!wd) {
        sdk.log("Podaj stawkę WIBOR ręcznie lub zaimportuj dane", "error");
        return;
      }
      const r = calculateLoan({ ...form, startDate: new Date(form.startDate), bridgeEndDate: form.bridgeEndDate ? new Date(form.bridgeEndDate) : null, wiborData: wd, interestBase: Number(form.interestMethod) || 360 });
      if (r) setResult(r);
    };
    const F = (label, key, type) => /* @__PURE__ */ jsx(ui.Field, { label, children: /* @__PURE__ */ jsx(ui.Input, { type: type === "n" ? "number" : type === "d" ? "date" : void 0, ...bind(key, type === "n" ? Number : void 0) }) });
    return /* @__PURE__ */ jsx(ui.Stack, { children: /* @__PURE__ */ jsx(
      ui.Box,
      {
        header: /* @__PURE__ */ jsx(ui.Cell, { label: true, children: "Parametry kredytu" }),
        body: /* @__PURE__ */ jsxs(ui.Stack, { children: [
          F("Kwota kredytu (PLN)", "loanAmount", "n"),
          F("Marża (%)", "margin", "n"),
          F("Okres (miesiące)", "loanPeriodMonths", "n"),
          /* @__PURE__ */ jsx(ui.Field, { label: "WIBOR", children: /* @__PURE__ */ jsx(ui.Select, { ...bind("wiborTenor"), options: WIBOR_TENORS }) }),
          /* @__PURE__ */ jsx(ui.Field, { label: "Rodzaj rat", children: /* @__PURE__ */ jsx(ui.Select, { ...bind("repaymentType"), options: REPAYMENT_TYPES }) }),
          F("Data rozpoczęcia", "startDate", "d"),
          F("Dzień spłaty", "paymentDay", "n"),
          F("Marża pomostowa (%)", "bridgeMargin", "n"),
          form.bridgeMargin > 0 && /* @__PURE__ */ jsx(ui.Field, { label: "Koniec pomostowej", children: /* @__PURE__ */ jsx(ui.Input, { type: "date", ...bind("bridgeEndDate") }) }),
          !rates.length && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(ui.Field, { label: "Stawka WIBOR (%)", children: /* @__PURE__ */ jsx(ui.Input, { type: "number", ...bind("manualRate"), placeholder: "np. 5.85" }) }),
            /* @__PURE__ */ jsx(ui.Card, { color: "warning", children: /* @__PURE__ */ jsx(ui.Text, { muted: true, children: "Stała stawka — obliczenie zakłada niezmienną wartość WIBOR przez cały okres kredytu. Aby uwzględnić historyczne zmiany stawek, zaimportuj dane CSV." }) })
          ] }),
          /* @__PURE__ */ jsx(ui.Button, { onClick: calculate, block: true, color: "primary", children: "Oblicz" })
        ] }),
        grow: true
      }
    ) });
  }
  function Center() {
    const result = useResult(), [tab, setTab] = useState("summary");
    if (!result) return /* @__PURE__ */ jsx(ui.Placeholder, { text: "Wprowadź dane i kliknij Oblicz" });
    return /* @__PURE__ */ jsxs(ui.Page, { children: [
      /* @__PURE__ */ jsx(ui.Tabs, { tabs, active: tab, onChange: setTab }),
      tab === "summary" && /* @__PURE__ */ jsx(Summary, { r: result }),
      tab === "schedule" && /* @__PURE__ */ jsx(Schedule, { r: result }),
      tab === "compare" && /* @__PURE__ */ jsx(Compare, { r: result })
    ] });
  }
  function Summary({ r }) {
    return /* @__PURE__ */ jsxs(ui.Stack, { children: [
      /* @__PURE__ */ jsxs(ui.Stats, { children: [
        /* @__PURE__ */ jsx(ui.Stat, { title: "Korzyść całkowita", value: formatPLN(r.overpaidInterest + r.futureSavings), color: "success" }),
        /* @__PURE__ */ jsx(ui.Stat, { title: "Rata aktualna", value: formatPLN(r.currentInstallment) }),
        /* @__PURE__ */ jsx(ui.Stat, { title: "Rata bez WIBOR", value: formatPLN(r.installmentNoWibor), color: "info" })
      ] }),
      /* @__PURE__ */ jsx(KVCard, { title: "Dotychczasowe", rows: [["Zapłacono łącznie", formatPLN(r.pastTotalPaid)], ["Kapitał", formatPLN(r.pastPrincipalPaid)], ["Odsetki", formatPLN(r.pastInterestTotal)], ["w tym WIBOR", formatPLN(r.pastInterestWibor), "warning"], ["Rat zapłaconych", String(r.pastInstallmentsCount)]] }),
      /* @__PURE__ */ jsx(KVCard, { title: "Przyszłe", rows: [["Do zapłaty", formatPLN(r.futureTotalToPay)], ["Odsetki przyszłe", formatPLN(r.futureInterestTotal)], ["Rat pozostałych", String(r.futureInstallmentsCount)]] })
    ] });
  }
  function Schedule({ r }) {
    const [filter, setFilter] = useState("all");
    const filtered = filter === "past" ? r.schedule.filter((x) => x.isPast) : filter === "future" ? r.schedule.filter((x) => !x.isPast) : r.schedule;
    const tableRows = filtered.map((x) => ({ number: x.number, date: formatDate(x.date), installment: formatPLN(x.installment), principal: formatPLN(x.principal), interest: formatPLN(x.interestTotal), wibor: formatPct(x.wiborRate), balance: formatPLN(x.remainingBalance) }));
    const filterTabs = [{ id: "all", label: `Wszystkie (${r.schedule.length})` }, { id: "past", label: "Przeszłe" }, { id: "future", label: "Przyszłe" }];
    return /* @__PURE__ */ jsxs(ui.Stack, { children: [
      /* @__PURE__ */ jsx(ui.Tabs, { tabs: filterTabs, active: filter, onChange: setFilter, variant: "lift" }),
      /* @__PURE__ */ jsx(ui.Table, { columns: scheduleColumns, rows: tableRows, pageSize: 24, empty: "Brak rat dla wybranego filtra" })
    ] });
  }
  function Compare({ r }) {
    return /* @__PURE__ */ jsxs(ui.Stack, { children: [
      /* @__PURE__ */ jsxs(ui.Stats, { children: [
        /* @__PURE__ */ jsx(ui.Stat, { title: "Nadpłacone odsetki", value: formatPLN(r.overpaidInterest), color: "error" }),
        /* @__PURE__ */ jsx(ui.Stat, { title: "Przyszłe oszczędności", value: formatPLN(r.futureSavings), color: "success" })
      ] }),
      /* @__PURE__ */ jsx(KVCard, { title: "Przeszłość", rows: [["Zapłacone z WIBOR", formatPLN(r.pastTotalPaid)], ["Zapłacone bez WIBOR", formatPLN(r.pastTotalPaidNoWibor)], ["Nadpłata (WIBOR)", formatPLN(r.overpaidInterest), "error"], ["Nadpłata (WIBOR + marża)", formatPLN(r.overpaidWithMargin), "error"]] }),
      /* @__PURE__ */ jsx(KVCard, { title: "Przyszłość", rows: [["Do zapłaty z WIBOR", formatPLN(r.futureTotalToPay)], ["Do zapłaty bez WIBOR", formatPLN(r.futureTotalNoWibor)], ["Oszczędność", formatPLN(r.futureSavings), "success"]] }),
      /* @__PURE__ */ jsx(KVCard, { title: "Porównanie rat", rows: [["Rata aktualna", formatPLN(r.currentInstallment)], ["Rata bez WIBOR", formatPLN(r.installmentNoWibor), "info"], ["Rata sam kapitał", formatPLN(r.installmentNoRate), "success"]] })
    ] });
  }
  function Footer() {
    return /* @__PURE__ */ jsx(ui.Text, { muted: true, children: "Kalkulator WIBOR" });
  }
  store.registerType("wibor-rate-set", [
    { key: "tenorId", label: "Tenor", required: true },
    { key: "entries", label: "Stawki" }
  ], "Stawki WIBOR");
  sdk.registerView("wiborCalc.left", { slot: "left", component: Left });
  sdk.registerView("wiborCalc.center", { slot: "center", component: Center });
  sdk.registerView("wiborCalc.footer", { slot: "footer", component: Footer });
  sdk.registerParser("wiborCalc.csv", {
    accept: ".csv",
    targetType: "wibor-rate-set",
    parse: (text) => {
      const entries = parseStooqCSV(text);
      return entries.length ? [{ tenorId: "wibor-3m", entries }] : [];
    }
  });
  return {
    id: "wibor-calc",
    label: "Kalkulator WIBOR",
    description: "Kalkulator kredytu hipotecznego WIBOR",
    version: "1.0.0",
    icon: icons.DollarSign
  };
};
export {
  plugin as default
};
