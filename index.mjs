// ../obieg-zero-plugins/.shims/react.mjs
var R = globalThis.__obieg.React;
var { useState, useEffect, useCallback, useRef, useMemo, useReducer, useContext, createContext, createElement, Fragment, memo, forwardRef, useLayoutEffect, useId, useSyncExternalStore, useTransition, Component } = R;

// ../obieg-zero-plugins/wibor-calc/src/calc.ts
var plnFmt = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", minimumFractionDigits: 2, maximumFractionDigits: 2 });
var dateFmt = new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
var formatPLN = (n) => plnFmt.format(n);
var formatPct = (n, d = 2) => `${n.toFixed(d)}%`;
var formatDate = (d) => dateFmt.format(d);
var toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
var daysBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / 864e5);
var WIBOR_LAST_ACTUAL = "2024-12";
var WIBOR_3M = {
  "2015-01": 1.65,
  "2015-02": 1.65,
  "2015-03": 1.67,
  "2015-04": 1.67,
  "2015-05": 1.66,
  "2015-06": 1.67,
  "2015-07": 1.69,
  "2015-08": 1.7,
  "2015-09": 1.72,
  "2015-10": 1.73,
  "2015-11": 1.73,
  "2015-12": 1.73,
  "2016-01": 1.72,
  "2016-02": 1.7,
  "2016-03": 1.67,
  "2016-04": 1.67,
  "2016-05": 1.69,
  "2016-06": 1.71,
  "2016-07": 1.71,
  "2016-08": 1.73,
  "2016-09": 1.73,
  "2016-10": 1.73,
  "2016-11": 1.73,
  "2016-12": 1.73,
  "2017-01": 1.73,
  "2017-02": 1.73,
  "2017-03": 1.73,
  "2017-04": 1.73,
  "2017-05": 1.73,
  "2017-06": 1.73,
  "2017-07": 1.73,
  "2017-08": 1.73,
  "2017-09": 1.73,
  "2017-10": 1.73,
  "2017-11": 1.72,
  "2017-12": 1.72,
  "2018-01": 1.72,
  "2018-02": 1.72,
  "2018-03": 1.7,
  "2018-04": 1.7,
  "2018-05": 1.7,
  "2018-06": 1.71,
  "2018-07": 1.72,
  "2018-08": 1.72,
  "2018-09": 1.72,
  "2018-10": 1.72,
  "2018-11": 1.72,
  "2018-12": 1.72,
  "2019-01": 1.72,
  "2019-02": 1.72,
  "2019-03": 1.72,
  "2019-04": 1.72,
  "2019-05": 1.72,
  "2019-06": 1.72,
  "2019-07": 1.72,
  "2019-08": 1.72,
  "2019-09": 1.72,
  "2019-10": 1.72,
  "2019-11": 1.71,
  "2019-12": 1.71,
  "2020-01": 1.71,
  "2020-02": 1.69,
  "2020-03": 1.17,
  "2020-04": 0.7,
  "2020-05": 0.29,
  "2020-06": 0.27,
  "2020-07": 0.26,
  "2020-08": 0.25,
  "2020-09": 0.22,
  "2020-10": 0.22,
  "2020-11": 0.21,
  "2020-12": 0.21,
  "2021-01": 0.21,
  "2021-02": 0.21,
  "2021-03": 0.21,
  "2021-04": 0.21,
  "2021-05": 0.21,
  "2021-06": 0.21,
  "2021-07": 0.21,
  "2021-08": 0.22,
  "2021-09": 0.24,
  "2021-10": 0.64,
  "2021-11": 1.49,
  "2021-12": 2.35,
  "2022-01": 3.13,
  "2022-02": 3.57,
  "2022-03": 4.46,
  "2022-04": 5.65,
  "2022-05": 6.4,
  "2022-06": 6.82,
  "2022-07": 7.02,
  "2022-08": 7.08,
  "2022-09": 7.14,
  "2022-10": 7.19,
  "2022-11": 7.16,
  "2022-12": 7.06,
  "2023-01": 6.93,
  "2023-02": 6.9,
  "2023-03": 6.92,
  "2023-04": 6.93,
  "2023-05": 6.94,
  "2023-06": 6.93,
  "2023-07": 6.9,
  "2023-08": 6.85,
  "2023-09": 6.39,
  "2023-10": 5.85,
  "2023-11": 5.84,
  "2023-12": 5.86,
  "2024-01": 5.86,
  "2024-02": 5.86,
  "2024-03": 5.85,
  "2024-04": 5.86,
  "2024-05": 5.86,
  "2024-06": 5.86,
  "2024-07": 5.86,
  "2024-08": 5.86,
  "2024-09": 5.86,
  "2024-10": 5.85,
  "2024-11": 5.85,
  "2024-12": 5.79,
  "2025-01": 5.77,
  "2025-02": 5.59,
  "2025-03": 5.4,
  "2025-04": 5.2,
  "2025-05": 5.02,
  "2025-06": 4.83,
  "2025-07": 4.63,
  "2025-08": 4.5,
  "2025-09": 4.4,
  "2025-10": 4.3,
  "2025-11": 4.15,
  "2025-12": 4,
  "2026-01": 3.93,
  "2026-02": 3.86
};
var _defaultEntries = null;
function getDefaultWiborEntries() {
  if (!_defaultEntries) _defaultEntries = Object.entries(WIBOR_3M).map(([k, rate]) => ({ date: `${k}-01`, rate })).sort((a, b) => a.date.localeCompare(b.date));
  return _defaultEntries;
}
var resolveWibor = (d, data) => {
  const s = toDateStr(d);
  let b = data[0]?.rate ?? 0;
  for (const e of data) {
    if (e.date <= s) b = e.rate;
    else break;
  }
  return b;
};
var payDate = (start, off, day) => {
  const m = start.getMonth() + off, ty = start.getFullYear() + Math.floor(m / 12), tm = m % 12;
  return new Date(ty, tm, Math.min(day, new Date(ty, tm + 1, 0).getDate()));
};
var ann = (b, r, m) => {
  if (r <= 0 || m <= 0) return m > 0 ? b / m : b;
  const rm = r / 100 / 12, f = Math.pow(1 + rm, m);
  return b * (rm * f) / (f - 1);
};
var int = (b, p, d) => b * (p / 100) * d / 360;
function calculateLoan(input) {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const wd = input.wiborData || getDefaultWiborEntries();
  const schedule = [];
  let bal = input.loanAmount, balNW = input.loanAmount, prev = new Date(input.startDate);
  let wibor = resolveWibor(input.startDate, wd), inst = 0, instNW = 0, reset = 0;
  for (let i = 1; i <= input.loanPeriodMonths; i++) {
    const pd = payDate(input.startDate, i, input.paymentDay), days = daysBetween(prev, pd), rem = input.loanPeriodMonths - i + 1;
    const bridge = input.bridgeEndDate && pd <= input.bridgeEndDate ? input.bridgeMargin : 0;
    reset++;
    if (reset >= 3 || i === 1) {
      if (i > 1) wibor = resolveWibor(pd, wd);
      reset = 0;
      inst = ann(bal, wibor + input.margin + bridge, rem);
      instNW = ann(balNW, input.margin + bridge, rem);
    }
    const iW = int(bal, wibor, days), iM = int(bal, input.margin, days), iB = int(bal, bridge, days), iT = iW + iM + iB;
    let pr = Math.max(inst - iT, 0);
    if (i === input.loanPeriodMonths || pr > bal) pr = bal;
    schedule.push({ number: i, date: pd, days, wiborRate: wibor, installment: pr + iT, principal: pr, interestTotal: iT, interestWibor: iW, interestMargin: iM, interestBridge: iB, remainingBalance: bal - pr, isPast: pd <= today });
    bal = Math.max(bal - pr, 0);
    const iNW = int(balNW, input.margin + bridge, days);
    let pNW = Math.max(instNW - iNW, 0);
    if (i === input.loanPeriodMonths || pNW > balNW) pNW = balNW;
    balNW = Math.max(balNW - pNW, 0);
    prev = pd;
  }
  const a = { pTP: 0, pPr: 0, pIT: 0, pIW: 0, pIM: 0, pIB: 0, pC: 0, fTP: 0, fIT: 0, fIW: 0, fIM: 0, fC: 0, pTNW: 0, pINW: 0, pPNW: 0, fTNW: 0, fINW: 0, cI: 0, cNW: 0 };
  let bNW2 = input.loanAmount, instNW2 = 0, reset2 = 0, prev2 = new Date(input.startDate);
  for (let i = 0; i < schedule.length; i++) {
    const r = schedule[i];
    const days2 = daysBetween(prev2, r.date);
    const bridge2 = input.bridgeEndDate && r.date <= input.bridgeEndDate ? input.bridgeMargin : 0;
    reset2++;
    if (reset2 >= 3 || i === 0) {
      reset2 = 0;
      instNW2 = ann(bNW2, input.margin + bridge2, input.loanPeriodMonths - i);
    }
    const iNW2 = int(bNW2, input.margin + bridge2, days2);
    let pNW2 = Math.max(instNW2 - iNW2, 0);
    if (i === schedule.length - 1 || pNW2 > bNW2) pNW2 = bNW2;
    const nwInst = pNW2 + iNW2;
    if (r.isPast) {
      a.pTP += r.installment;
      a.pPr += r.principal;
      a.pIT += r.interestTotal;
      a.pIW += r.interestWibor;
      a.pIM += r.interestMargin;
      a.pIB += r.interestBridge;
      a.pC++;
      a.pTNW += nwInst;
      a.pINW += iNW2;
      a.pPNW += pNW2;
    } else {
      if (a.fC === 0) {
        a.cI = r.installment;
        a.cNW = nwInst;
      }
      a.fTP += r.installment;
      a.fIT += r.interestTotal;
      a.fIW += r.interestWibor;
      a.fIM += r.interestMargin;
      a.fC++;
      a.fTNW += nwInst;
      a.fINW += iNW2;
    }
    bNW2 = Math.max(bNW2 - pNW2, 0);
    prev2 = r.date;
  }
  return { schedule, pastTotalPaid: a.pTP, pastPrincipalPaid: a.pPr, pastInterestTotal: a.pIT, pastInterestWibor: a.pIW, pastInterestMargin: a.pIM, pastInterestBridge: a.pIB, pastInstallmentsCount: a.pC, futureTotalToPay: a.fTP, futureInterestTotal: a.fIT, futureInterestWibor: a.fIW, futureInterestMargin: a.fIM, futureInstallmentsCount: a.fC, pastTotalPaidNoWibor: a.pTNW, pastInterestNoWibor: a.pINW, pastPrincipalNoWibor: a.pPNW, futureTotalNoWibor: a.fTNW, futureInterestNoWibor: a.fINW, overpaidInterest: a.pIT - a.pINW, futureSavings: a.fTP - a.fTNW, currentInstallment: a.cI, installmentNoWibor: a.cNW };
}

// ../obieg-zero-plugins/wibor-calc/src/store.ts
var uiState = { currentCaseId: null, wiborData: getDefaultWiborEntries() };
var uiSubs = /* @__PURE__ */ new Set();
var emitUI = () => uiSubs.forEach((fn) => fn());
function setUI(p) {
  uiState = { ...uiState, ...p };
  emitUI();
}
var _posts;
function initStore(host) {
  _posts = host.posts;
  host.db.getSetting("wibor:cases").then(async (raw) => {
    if (!raw) return;
    try {
      const cases = JSON.parse(raw);
      for (const c of cases) {
        const input = c.input ? { ...c.input, startDate: toDateStr(c.input.startDate), bridgeEndDate: c.input.bridgeEndDate ? toDateStr(c.input.bridgeEndDate) : null } : null;
        await _posts.add("wibor-case", { name: c.name, input }, { id: c.id });
      }
      await host.db.deleteSetting("wibor:cases");
    } catch {
    }
  });
}
function postToCase(p) {
  const d = p.data;
  return {
    id: p.id,
    name: d.name,
    input: d.input ? { ...d.input, startDate: new Date(d.input.startDate), bridgeEndDate: d.input.bridgeEndDate ? new Date(d.input.bridgeEndDate) : null } : null
  };
}
function useStore() {
  const posts = _posts.usePosts("wibor-case");
  const cases = posts.map(postToCase);
  const ui = useSyncExternalStore((cb) => {
    uiSubs.add(cb);
    return () => uiSubs.delete(cb);
  }, () => uiState);
  const currentCaseId = ui.currentCaseId && cases.some((c) => c.id === ui.currentCaseId) ? ui.currentCaseId : cases[0]?.id ?? null;
  const current = cases.find((c) => c.id === currentCaseId);
  return {
    cases,
    currentCaseId,
    input: current?.input ?? null,
    wiborData: ui.wiborData,
    ready: true
  };
}
function createCase(name) {
  const id = crypto.randomUUID();
  _posts.add("wibor-case", { name, input: null }, { id });
  setUI({ currentCaseId: id });
}
function removeCase(id) {
  _posts.delete(id);
  if (uiState.currentCaseId === id) setUI({ currentCaseId: null });
}
function selectCase(id) {
  setUI({ currentCaseId: id });
}
function updateInput(input) {
  const id = uiState.currentCaseId;
  if (!id) return;
  const serialized = { ...input, startDate: toDateStr(input.startDate), bridgeEndDate: input.bridgeEndDate ? toDateStr(input.bridgeEndDate) : null };
  _posts.get(id).then((post) => {
    if (post) _posts.update(id, { ...post.data, input: serialized });
  });
}
function useCalc() {
  const { input, wiborData, currentCaseId, cases } = useStore();
  return {
    input,
    caseId: currentCaseId,
    caseName: cases.find((c) => c.id === currentCaseId)?.name ?? null,
    result: useMemo(() => input ? calculateLoan({ ...input, wiborData }) : null, [input, wiborData])
  };
}
function useCases() {
  const { cases, currentCaseId } = useStore();
  return { cases, current: currentCaseId, select: selectCase, create: createCase, remove: removeCase };
}

// ../obieg-zero-plugins/.shims/jsx-runtime.mjs
var J = globalThis.__obieg.jsxRuntime;
var { jsx, jsxs, Fragment: Fragment2 } = J;

// ../obieg-zero-plugins/wibor-calc/src/ui.tsx
var Ctx = createContext(null);
var useCtx = () => useContext(Ctx);
function createUI(ui, icons) {
  const { Box, Cell, Tabs, Field, ListItem, Card, SummaryRow, ProgressBar } = ui;
  const { Plus, X } = icons;
  function Left() {
    const { cases, currentCaseId, input, ready } = useStore();
    const [newName, setNewName] = useState("");
    const [f, setF] = useState({ amount: "300000", margin: "2.0", months: "360", start: "2018-01-01", day: "15", bridge: "0", bridgeEnd: "" });
    useEffect(() => {
      if (input) setF({ amount: String(input.loanAmount), margin: String(input.margin), months: String(input.loanPeriodMonths), start: toDateStr(input.startDate), day: String(input.paymentDay), bridge: String(input.bridgeMargin), bridgeEnd: input.bridgeEndDate ? toDateStr(input.bridgeEndDate) : "" });
      else setF({ amount: "300000", margin: "2.0", months: "360", start: "2018-01-01", day: "15", bridge: "0", bridgeEnd: "" });
    }, [currentCaseId]);
    const upd = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
    const handleCalc = () => updateInput({ loanAmount: parseFloat(f.amount) || 0, margin: parseFloat(f.margin) || 0, loanPeriodMonths: parseInt(f.months) || 360, startDate: new Date(f.start), paymentDay: parseInt(f.day) || 15, bridgeMargin: parseFloat(f.bridge) || 0, bridgeEndDate: f.bridgeEnd ? new Date(f.bridgeEnd) : null });
    if (!ready) return null;
    return /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx(Box, { header: /* @__PURE__ */ jsx(Cell, { label: true, children: "Sprawy" }), body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        cases.map((c) => /* @__PURE__ */ jsx(ListItem, { label: c.name, active: currentCaseId === c.id, onClick: () => selectCase(c.id), action: { icon: X, onClick: () => removeCase(c.id) } }, c.id)),
        /* @__PURE__ */ jsx(Field, { label: "", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx("input", { value: newName, onChange: (e) => setNewName(e.target.value), onKeyDown: (e) => {
            if (e.key === "Enter" && newName.trim()) {
              createCase(newName.trim());
              setNewName("");
            }
          }, placeholder: "nowa sprawa...", className: "input input-bordered input-sm text-xs flex-1" }),
          /* @__PURE__ */ jsx("button", { onClick: () => {
            if (newName.trim()) {
              createCase(newName.trim());
              setNewName("");
            }
          }, className: "btn btn-sm btn-primary", children: /* @__PURE__ */ jsx(Plus, { size: 14 }) })
        ] }) })
      ] }) }),
      currentCaseId && /* @__PURE__ */ jsx(Box, { header: /* @__PURE__ */ jsx(Cell, { label: true, children: "Parametry kredytu" }), body: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Field, { label: "Kwota (PLN)", children: /* @__PURE__ */ jsx("input", { type: "number", value: f.amount, onChange: (e) => upd("amount")(e.target.value), className: "input input-bordered input-sm w-full" }) }),
        /* @__PURE__ */ jsx(Field, { label: "Marza (%)", children: /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: f.margin, onChange: (e) => upd("margin")(e.target.value), className: "input input-bordered input-sm w-full" }) }),
        /* @__PURE__ */ jsx(Field, { label: "Okres (mies.)", children: /* @__PURE__ */ jsx("input", { type: "number", value: f.months, onChange: (e) => upd("months")(e.target.value), className: "input input-bordered input-sm w-full" }) }),
        /* @__PURE__ */ jsx(Field, { label: "Data uruchomienia", children: /* @__PURE__ */ jsx("input", { type: "date", value: f.start, onChange: (e) => upd("start")(e.target.value), className: "input input-bordered input-sm w-full" }) }),
        /* @__PURE__ */ jsx(Field, { label: "Dzien splaty", children: /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 31, value: f.day, onChange: (e) => upd("day")(e.target.value), className: "input input-bordered input-sm w-full" }) }),
        /* @__PURE__ */ jsx(Field, { label: "Marza pomostowa (%)", children: /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: f.bridge, onChange: (e) => upd("bridge")(e.target.value), className: "input input-bordered input-sm w-full" }) }),
        parseFloat(f.bridge) > 0 && /* @__PURE__ */ jsx(Field, { label: "Koniec pomostowej", children: /* @__PURE__ */ jsx("input", { type: "date", value: f.bridgeEnd, onChange: (e) => upd("bridgeEnd")(e.target.value), className: "input input-bordered input-sm w-full" }) }),
        /* @__PURE__ */ jsx("button", { onClick: handleCalc, className: "btn btn-primary btn-sm w-full", children: "Oblicz" }),
        /* @__PURE__ */ jsxs("div", { className: "text-2xs text-base-content/30 text-center", children: [
          "WIBOR 3M \xB7 prognozy od ",
          WIBOR_LAST_ACTUAL
        ] })
      ] }) })
    ] });
  }
  function SummaryTab() {
    const { result: r } = useCtx();
    return /* @__PURE__ */ jsxs("div", { className: "space-y-8 py-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsx(Card, { accent: true, label: "Laczna korzysc", value: formatPLN(r.overpaidInterest + r.futureSavings), sub: `nadplata ${formatPLN(r.overpaidInterest)} + oszczednosc ${formatPLN(r.futureSavings)}` }),
        /* @__PURE__ */ jsx(Card, { label: "Rata z WIBOR", value: formatPLN(r.currentInstallment), sub: "miesieczna" }),
        /* @__PURE__ */ jsx(Card, { label: "Rata bez WIBOR", value: formatPLN(r.installmentNoWibor), sub: `taniej o ${formatPLN(r.currentInstallment - r.installmentNoWibor)}/mies.` })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center py-3 mb-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 text-2xs uppercase tracking-wider font-semibold text-base-content/40", children: [
            "Dotychczasowe \xB7 ",
            r.pastInstallmentsCount,
            " rat"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-2xs uppercase tracking-wider text-base-content/30", children: "Z WIBOR" }),
          /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-2xs uppercase tracking-wider text-base-content/30", children: "Bez WIBOR" }),
          /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-2xs uppercase tracking-wider text-base-content/30", children: "Roznica" })
        ] }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Wplacono lacznie", columns: [formatPLN(r.pastTotalPaid), formatPLN(r.pastTotalPaidNoWibor)], diff: r.pastTotalPaid - r.pastTotalPaidNoWibor }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Splacony kapital", columns: [formatPLN(r.pastPrincipalPaid), formatPLN(r.pastPrincipalNoWibor)], diff: r.pastPrincipalPaid - r.pastPrincipalNoWibor }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Zaplacone odsetki", columns: [formatPLN(r.pastInterestTotal), formatPLN(r.pastInterestNoWibor)], diff: r.pastInterestTotal - r.pastInterestNoWibor })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center py-3 mb-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 text-2xs uppercase tracking-wider font-semibold text-base-content/40", children: [
            "Przyszle \xB7 ",
            r.futureInstallmentsCount,
            " rat"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-2xs uppercase tracking-wider text-base-content/30", children: "Z WIBOR" }),
          /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-2xs uppercase tracking-wider text-base-content/30", children: "Bez WIBOR" }),
          /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-2xs uppercase tracking-wider text-base-content/30", children: "Roznica" })
        ] }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Do splaty lacznie", columns: [formatPLN(r.futureTotalToPay), formatPLN(r.futureTotalNoWibor)], diff: r.futureTotalToPay - r.futureTotalNoWibor }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Przyszle odsetki", columns: [formatPLN(r.futureInterestTotal), formatPLN(r.futureInterestNoWibor)], diff: r.futureInterestTotal - r.futureInterestNoWibor })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-base-300 bg-base-200/50 p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1 text-sm font-semibold", children: "Calkowity koszt kredytu" }),
        /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-sm tabular-nums font-bold", children: formatPLN(r.pastTotalPaid + r.futureTotalToPay) }),
        /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-sm tabular-nums font-bold", children: formatPLN(r.pastTotalPaidNoWibor + r.futureTotalNoWibor) }),
        /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-sm tabular-nums font-bold text-success", children: formatPLN(r.pastTotalPaid + r.futureTotalToPay - r.pastTotalPaidNoWibor - r.futureTotalNoWibor) })
      ] }) })
    ] });
  }
  function ScheduleTab() {
    const { result: r } = useCtx();
    const [filter, setFilter] = useState("all");
    const [showAll, setShowAll] = useState(false);
    const filtered = useMemo(() => filter === "past" ? r.schedule.filter((x) => x.isPast) : filter === "future" ? r.schedule.filter((x) => !x.isPast) : r.schedule, [r.schedule, filter]);
    const displayed = showAll ? filtered : filtered.slice(0, 24);
    const pastCount = r.schedule.filter((x) => x.isPast).length;
    return /* @__PURE__ */ jsxs("div", { className: "space-y-8 py-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsx(Card, { label: "Liczba rat", value: String(r.schedule.length), sub: `splaconych ${pastCount} \xB7 pozostalych ${r.schedule.length - pastCount}` }),
        /* @__PURE__ */ jsx(Card, { label: "Najwyzsza rata", value: formatPLN(Math.max(...r.schedule.map((x) => x.installment))), sub: "w calym okresie" }),
        /* @__PURE__ */ jsx(Card, { label: "Aktualna rata", value: formatPLN(r.currentInstallment), sub: `WIBOR ${formatPct(r.schedule.find((x) => !x.isPast)?.wiborRate ?? 0)}` })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-4", children: ["all", "past", "future"].map((f) => /* @__PURE__ */ jsx("button", { onClick: () => {
          setFilter(f);
          setShowAll(false);
        }, className: `btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`, children: f === "all" ? `Wszystkie (${r.schedule.length})` : f === "past" ? `Splacone (${pastCount})` : `Przyszle (${r.schedule.length - pastCount})` }, f)) }),
        /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-base-300 overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "table table-sm", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-base-200/50", children: [
            /* @__PURE__ */ jsx("th", { className: "font-semibold", children: "Nr" }),
            /* @__PURE__ */ jsx("th", { className: "font-semibold", children: "Data" }),
            /* @__PURE__ */ jsx("th", { className: "text-right font-semibold", children: "Rata" }),
            /* @__PURE__ */ jsx("th", { className: "text-right font-semibold", children: "Kapital" }),
            /* @__PURE__ */ jsx("th", { className: "text-right font-semibold", children: "Ods. WIBOR" }),
            /* @__PURE__ */ jsx("th", { className: "text-right font-semibold", children: "Ods. marza" }),
            /* @__PURE__ */ jsx("th", { className: "text-right font-semibold", children: "WIBOR" }),
            /* @__PURE__ */ jsx("th", { className: "text-right font-semibold", children: "Saldo" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: displayed.map((row) => /* @__PURE__ */ jsxs("tr", { className: `border-b border-base-200 ${row.isPast ? "" : "text-base-content/40"}`, children: [
            /* @__PURE__ */ jsx("td", { className: "tabular-nums", children: row.number }),
            /* @__PURE__ */ jsx("td", { className: "tabular-nums", children: formatDate(row.date) }),
            /* @__PURE__ */ jsx("td", { className: "text-right tabular-nums font-medium", children: formatPLN(row.installment) }),
            /* @__PURE__ */ jsx("td", { className: "text-right tabular-nums", children: formatPLN(row.principal) }),
            /* @__PURE__ */ jsx("td", { className: "text-right tabular-nums text-error", children: formatPLN(row.interestWibor) }),
            /* @__PURE__ */ jsx("td", { className: "text-right tabular-nums text-primary", children: formatPLN(row.interestMargin) }),
            /* @__PURE__ */ jsx("td", { className: "text-right tabular-nums text-base-content/40", children: formatPct(row.wiborRate) }),
            /* @__PURE__ */ jsx("td", { className: "text-right tabular-nums font-medium", children: formatPLN(row.remainingBalance) })
          ] }, row.number)) })
        ] }) }),
        filtered.length > 24 && /* @__PURE__ */ jsx("button", { onClick: () => setShowAll(!showAll), className: "btn btn-ghost btn-sm w-full mt-3", children: showAll ? "Pokaz mniej" : `Pokaz wszystkie ${filtered.length} rat` })
      ] })
    ] });
  }
  function ComparisonTab() {
    const { result: r } = useCtx();
    return /* @__PURE__ */ jsxs("div", { className: "space-y-8 py-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsx(Card, { accent: true, label: "Nadplata dotychczasowa", value: formatPLN(r.overpaidInterest), sub: `w ${r.pastInstallmentsCount} ratach` }),
        /* @__PURE__ */ jsx(Card, { accent: true, label: "Oszczednosc przyszla", value: formatPLN(r.futureSavings), sub: `w ${r.futureInstallmentsCount} ratach` })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center py-3 mb-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 text-2xs uppercase tracking-wider font-semibold text-base-content/40", children: [
            "Dotychczasowe \xB7 ",
            r.pastInstallmentsCount,
            " rat"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-2xs uppercase tracking-wider text-base-content/30", children: "Z WIBOR" }),
          /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-2xs uppercase tracking-wider text-base-content/30", children: "Bez WIBOR" }),
          /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-2xs uppercase tracking-wider text-base-content/30", children: "Korzysc" })
        ] }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Wplacono lacznie", columns: [formatPLN(r.pastTotalPaid), formatPLN(r.pastTotalPaidNoWibor)], diff: r.pastTotalPaid - r.pastTotalPaidNoWibor }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Zaplacony kapital", columns: [formatPLN(r.pastPrincipalPaid), formatPLN(r.pastPrincipalNoWibor)], diff: r.pastPrincipalPaid - r.pastPrincipalNoWibor }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Zaplacone odsetki", columns: [formatPLN(r.pastInterestTotal), formatPLN(r.pastInterestNoWibor)], diff: r.pastInterestTotal - r.pastInterestNoWibor })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center py-3 mb-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 text-2xs uppercase tracking-wider font-semibold text-base-content/40", children: [
            "Przyszle \xB7 ",
            r.futureInstallmentsCount,
            " rat"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-2xs uppercase tracking-wider text-base-content/30", children: "Z WIBOR" }),
          /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-2xs uppercase tracking-wider text-base-content/30", children: "Bez WIBOR" }),
          /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-2xs uppercase tracking-wider text-base-content/30", children: "Korzysc" })
        ] }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Do splaty lacznie", columns: [formatPLN(r.futureTotalToPay), formatPLN(r.futureTotalNoWibor)], diff: r.futureTotalToPay - r.futureTotalNoWibor }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Przyszle odsetki", columns: [formatPLN(r.futureInterestTotal), formatPLN(r.futureInterestNoWibor)], diff: r.futureInterestTotal - r.futureInterestNoWibor }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Rata miesieczna", columns: [formatPLN(r.currentInstallment), formatPLN(r.installmentNoWibor)], diff: r.currentInstallment - r.installmentNoWibor })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-base-300 bg-base-200/50 p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1 text-sm font-semibold", children: "Calkowity koszt kredytu" }),
        /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-sm tabular-nums font-bold", children: formatPLN(r.pastTotalPaid + r.futureTotalToPay) }),
        /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-sm tabular-nums font-bold", children: formatPLN(r.pastTotalPaidNoWibor + r.futureTotalNoWibor) }),
        /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-sm tabular-nums font-bold text-success", children: formatPLN(r.pastTotalPaid + r.futureTotalToPay - r.pastTotalPaidNoWibor - r.futureTotalNoWibor) })
      ] }) })
    ] });
  }
  function BreakdownTab() {
    const { result: r } = useCtx();
    const tw = r.pastInterestWibor + r.futureInterestWibor, tm = r.pastInterestMargin + r.futureInterestMargin, tt = r.pastInterestTotal + r.futureInterestTotal;
    return /* @__PURE__ */ jsxs("div", { className: "space-y-8 py-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsx(Card, { label: "Odsetki WIBOR", value: formatPLN(tw), sub: `${formatPct(tt > 0 ? tw / tt * 100 : 0, 1)} calkowitych odsetek` }),
        /* @__PURE__ */ jsx(Card, { label: "Odsetki marza", value: formatPLN(tm), sub: `${formatPct(tt > 0 ? tm / tt * 100 : 0, 1)} calkowitych odsetek` }),
        /* @__PURE__ */ jsx(Card, { label: "Odsetki lacznie", value: formatPLN(tt), sub: "za caly okres kredytu" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-base-300 p-5 space-y-1", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xs uppercase tracking-wider font-semibold text-base-content/40 mb-3", children: "Zaplacone \xB7 do dzis" }),
        /* @__PURE__ */ jsx(ProgressBar, { label: "WIBOR", value: r.pastInterestWibor, total: r.pastInterestTotal, color: "bg-error" }),
        /* @__PURE__ */ jsx(ProgressBar, { label: "Marza", value: r.pastInterestMargin, total: r.pastInterestTotal, color: "bg-primary" }),
        r.pastInterestBridge > 0 && /* @__PURE__ */ jsx(ProgressBar, { label: "Pomostowa", value: r.pastInterestBridge, total: r.pastInterestTotal, color: "bg-warning" }),
        /* @__PURE__ */ jsxs("div", { className: "text-right text-xs text-base-content/40 pt-1", children: [
          "Lacznie: ",
          formatPLN(r.pastInterestTotal)
        ] })
      ] }),
      r.futureInterestTotal > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-base-300 p-5 space-y-1", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xs uppercase tracking-wider font-semibold text-base-content/40 mb-3", children: "Przyszle \xB7 prognoza" }),
        /* @__PURE__ */ jsx(ProgressBar, { label: "WIBOR", value: r.futureInterestWibor, total: r.futureInterestTotal, color: "bg-error" }),
        /* @__PURE__ */ jsx(ProgressBar, { label: "Marza", value: r.futureInterestMargin, total: r.futureInterestTotal, color: "bg-primary" }),
        /* @__PURE__ */ jsxs("div", { className: "text-right text-xs text-base-content/40 pt-1", children: [
          "Lacznie: ",
          formatPLN(r.futureInterestTotal)
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-base-300 bg-base-200/50 p-5 space-y-1", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xs uppercase tracking-wider font-semibold text-base-content/40 mb-3", children: "Caly okres kredytu" }),
        /* @__PURE__ */ jsx(ProgressBar, { label: "WIBOR", value: tw, total: tt, color: "bg-error" }),
        /* @__PURE__ */ jsx(ProgressBar, { label: "Marza", value: tm, total: tt, color: "bg-primary" }),
        /* @__PURE__ */ jsxs("div", { className: "text-right text-sm font-semibold text-base-content/60 pt-1", children: [
          "Lacznie: ",
          formatPLN(tt)
        ] })
      ] })
    ] });
  }
  function Center() {
    const { input, wiborData, currentCaseId, cases, ready } = useStore();
    const [tab, setTab] = useState("summary");
    const result = useMemo(() => input ? calculateLoan({ ...input, wiborData }) : null, [input, wiborData]);
    if (!ready) return null;
    if (!currentCaseId) return /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center space-y-3", children: [
      /* @__PURE__ */ jsx("div", { className: "text-2xl font-black text-primary tracking-tight", children: "KALKULATOR WIBOR" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-base-content/40", children: "Utworz sprawe w panelu po lewej" })
    ] }) });
    if (!result || !input) return /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold", children: [
        "Sprawa: ",
        cases.find((c) => c.id === currentCaseId)?.name
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-base-content/40", children: "Wypelnij parametry i kliknij Oblicz" })
    ] }) });
    return /* @__PURE__ */ jsx(Ctx.Provider, { value: { input, result }, children: /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 flex flex-col p-4 space-y-4", children: [
      /* @__PURE__ */ jsx(Tabs, { active: tab, onSelect: setTab, items: [{ id: "summary", label: "Podsumowanie" }, { id: "schedule", label: "Harmonogram" }, { id: "comparison", label: "Porownanie" }, { id: "breakdown", label: "Rozbicie" }] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 overflow-y-auto", children: [
        tab === "summary" && /* @__PURE__ */ jsx(SummaryTab, {}),
        tab === "schedule" && /* @__PURE__ */ jsx(ScheduleTab, {}),
        tab === "comparison" && /* @__PURE__ */ jsx(ComparisonTab, {}),
        tab === "breakdown" && /* @__PURE__ */ jsx(BreakdownTab, {})
      ] })
    ] }) });
  }
  function Footer() {
    const { input, wiborData, currentCaseId } = useStore();
    const result = useMemo(() => input ? calculateLoan({ ...input, wiborData }) : null, [input, wiborData]);
    if (!result || !currentCaseId) return null;
    return /* @__PURE__ */ jsx("div", { className: "flex items-center px-3 text-2xs text-base-content/30", children: "Kalkulator WIBOR \xB7 symulacja na podstawie historycznych stawek WIBOR 3M" });
  }
  return { Left, Center, Footer };
}

// ../obieg-zero-plugins/wibor-calc/src/index.tsx
var plugin = (deps) => {
  const host = deps.host;
  const { DollarSign } = deps.icons;
  const sdk = deps.sdk;
  initStore(host);
  sdk.registerProvider("wibor-calc", { useCalc, useCases });
  const { Left, Center, Footer } = createUI(deps.ui, deps.icons);
  return {
    id: "wibor-calc",
    label: "Kalkulator WIBOR",
    description: "Sprawy kredytowe \u2014 kalkulator, harmonogram, porownanie z/bez WIBOR",
    icon: DollarSign,
    defaultEnabled: false,
    layout: { left: Left, center: Center, footer: Footer }
  };
};
var index_default = plugin;
export {
  index_default as default
};
