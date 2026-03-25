import type { PluginFactory, TableColumn } from '../../plugin-types'

const plnFmt = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const plnFmt0 = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 })
const dateFmt = new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
const formatPLN = (v: number, decimals = 2) => (decimals === 0 ? plnFmt0 : plnFmt).format(v)
const formatPct = (v: number, d = 2) => `${v.toFixed(d)}%`
const formatDate = (d: Date) => dateFmt.format(d)
const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000)

const resolveWibor = (d: Date, data: any[]) => { const s = toDateStr(d); let b = data[0]?.rate ?? 0; for (const e of data) { if (e.date <= s) b = e.rate; else break } return b }
const payDate = (start: Date, off: number, day: number) => { const m = start.getMonth() + off, ty = start.getFullYear() + Math.floor(m / 12), tm = ((m % 12) + 12) % 12; return new Date(ty, tm, Math.min(day, new Date(ty, tm + 1, 0).getDate())) }
const ann = (b: number, r: number, m: number) => { if (r <= 0 || m <= 0) return m > 0 ? b / m : b; const rm = r / 100 / 12, f = Math.pow(1 + rm, m); return b * (rm * f) / (f - 1) }
const int = (b: number, p: number, d: number, base = 360) => b * (p / 100) * d / base

// ── Stooq CSV parser ─────────────────────────────────────────────────

function parseStooqCSV(text: string) {
  return text.trim().split('\n').reduce<{ date: string; rate: number }[]>((acc, line) => {
    const p = line.split(',')
    if (p.length >= 5 && /^\d{4}-\d{2}-\d{2}$/.test(p[0])) {
      const r = parseFloat(p[4])
      if (!isNaN(r)) acc.push({ date: p[0], rate: r })
    }
    return acc
  }, []).sort((a, b) => a.date.localeCompare(b.date))
}

function validateRates(entries: { date: string; rate: number }[]) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const warnings: string[] = []
  for (let i = 1; i < sorted.length; i++) {
    const d0 = new Date(sorted[i - 1].date), d1 = new Date(sorted[i].date)
    const m = (d1.getFullYear() - d0.getFullYear()) * 12 + d1.getMonth() - d0.getMonth()
    if (m > 2) warnings.push(`Luka: ${sorted[i - 1].date} → ${sorted[i].date} (${m} mies.)`)
  }
  return { warnings }
}

const WIBOR_TENORS = [{ value: '3M', label: 'WIBOR 3M' }, { value: '6M', label: 'WIBOR 6M' }, { value: '1M', label: 'WIBOR 1M' }]
const TENOR_RESET: Record<string, number> = { '1M': 1, '3M': 3, '6M': 6 }
const REPAYMENT_TYPES = [{ value: 'annuity', label: 'Raty równe' }, { value: 'decreasing', label: 'Raty malejące' }]

function calculateLoan(input: any) {
  const today = new Date(); today.setHours(0,0,0,0); const wd = input.wiborData || []; const base = input.interestBase || 360
  if (!wd.length) return null

  const resetMonths = TENOR_RESET[input.wiborTenor] || 3
  const isDecreasing = input.repaymentType === 'decreasing'

  const schedule: any[] = []; let bal = input.loanAmount, balNW = input.loanAmount, balNR = input.loanAmount, prev = new Date(input.startDate)
  let wibor = resolveWibor(input.startDate, wd), inst = 0, instNW = 0, reset = 0
  const a = { pastTotal:0, pastPr:0, pastInt:0, pastIntW:0, pastIntM:0, pastIntB:0, pastN:0, futTotal:0, futInt:0, futIntW:0, futIntM:0, futN:0, pastNoWibor:0, pastIntNW:0, pastPrNW:0, futNoWibor:0, futIntNW:0, curInst:0, curNW:0, pastNoRate:0, futNoRate:0, curNR:0 }
  for (let i = 1; i <= input.loanPeriodMonths; i++) {
    const pd = payDate(input.startDate, i, input.paymentDay), days = daysBetween(prev, pd), rem = input.loanPeriodMonths - i + 1, last = i === input.loanPeriodMonths
    const bridge = input.bridgeEndDate && pd <= input.bridgeEndDate ? input.bridgeMargin : 0

    reset++; if (reset >= resetMonths || i === 1) { if (i > 1) wibor = resolveWibor(pd, wd); reset = 0; inst = ann(bal, wibor + input.margin + bridge, rem); instNW = ann(balNW, input.margin + bridge, rem) }

    const iW = int(bal, wibor, days, base), iM = int(bal, input.margin, days, base), iB = int(bal, bridge, days, base), iT = iW + iM + iB

    let pr = isDecreasing ? bal / rem : Math.max(inst - iT, 0)
    if (last || pr > bal) pr = bal
    const isPast = pd <= today

    schedule.push({ number: i, date: pd, days, wiborRate: wibor, installment: pr + iT, principal: pr, interestTotal: iT, interestWibor: iW, interestMargin: iM, interestBridge: iB, remainingBalance: bal - pr, isPast })
    bal = Math.max(bal - pr, 0)

    const iNW = int(balNW, input.margin + bridge, days, base)
    let pNW = isDecreasing ? balNW / rem : Math.max(instNW - iNW, 0)
    if (last || pNW > balNW) pNW = balNW
    const nwInst = pNW + iNW, nrInst = rem > 0 ? balNR / rem : balNR, pNR = Math.min(nrInst, balNR)

    if (isPast) { a.pastTotal += pr + iT; a.pastPr += pr; a.pastInt += iT; a.pastIntW += iW; a.pastIntM += iM; a.pastIntB += iB; a.pastN++; a.pastNoWibor += nwInst; a.pastIntNW += iNW; a.pastPrNW += pNW; a.pastNoRate += nrInst }
    else { if (a.futN === 0) { a.curInst = pr + iT; a.curNW = nwInst; a.curNR = nrInst } a.futTotal += pr + iT; a.futInt += iT; a.futIntW += iW; a.futIntM += iM; a.futN++; a.futNoWibor += nwInst; a.futIntNW += iNW; a.futNoRate += nrInst }
    balNW = Math.max(balNW - pNW, 0); balNR = Math.max(balNR - pNR, 0); prev = pd
  }
  return { schedule, repaymentType: isDecreasing ? 'decreasing' : 'annuity', pastTotalPaid:a.pastTotal, pastPrincipalPaid:a.pastPr, pastInterestTotal:a.pastInt, pastInterestWibor:a.pastIntW, pastInterestMargin:a.pastIntM, pastInterestBridge:a.pastIntB, pastInstallmentsCount:a.pastN, futureTotalToPay:a.futTotal, futureInterestTotal:a.futInt, futureInterestWibor:a.futIntW, futureInterestMargin:a.futIntM, futureInstallmentsCount:a.futN, pastTotalPaidNoWibor:a.pastNoWibor, pastInterestNoWibor:a.pastIntNW, pastPrincipalNoWibor:a.pastPrNW, futureTotalNoWibor:a.futNoWibor, futureInterestNoWibor:a.futIntNW, overpaidInterest:a.pastInt-a.pastIntNW, futureSavings:a.futTotal-a.futNoWibor, currentInstallment:a.curInst, installmentNoWibor:a.curNW, pastTotalPaidNoRate:a.pastNoRate, futureTotalNoRate:a.futNoRate, installmentNoRate:a.curNR, overpaidWithMargin:a.pastTotal-a.pastNoRate, futureSavingsWithMargin:a.futTotal-a.futNoRate }
}

const scheduleColumns: TableColumn[] = [
  { key: 'number', header: '#' }, { key: 'date', header: 'Data' },
  { key: 'installment', header: 'Rata', align: 'right' }, { key: 'principal', header: 'Kapitał', align: 'right' },
  { key: 'interest', header: 'Odsetki', align: 'right' }, { key: 'wibor', header: 'WIBOR%', align: 'right' },
  { key: 'balance', header: 'Saldo', align: 'right' },
]

const tabs = [
  { id: 'summary', label: 'Podsumowanie' },
  { id: 'schedule', label: 'Harmonogram' },
  { id: 'compare', label: 'Porównanie' },
]

// ── Plugin ──────────────────────────────────────────────────────────

const plugin: PluginFactory = ({ React, store, ui, icons, sdk }) => {
  const { useState, useEffect } = React

  const useRatesForTenor = (tenor: string) => {
    const sets = store.usePosts('wibor-rate-set')
    const tenorId = `wibor-${tenor.toLowerCase()}`
    return sets.find((s: any) => s.data.tenorId === tenorId)?.data?.entries || []
  }

  const useCalcStore = sdk.create(() => ({ result: null as any }))
  const setResult = (r: any) => useCalcStore.setState({ result: r })
  const useResult = () => useCalcStore(s => s.result)

  // ── Helpers ─────────────────────────────────────────────────────

  const KV = (label: string, value: string, color?: 'primary' | 'accent' | 'error' | 'warning' | 'info' | 'success' | 'muted') =>
    <ui.Row justify="between"><ui.Text muted>{label}</ui.Text><ui.Value size="sm" bold={!!color} color={color}>{value}</ui.Value></ui.Row>

  const KVCard = ({ title, rows }: { title: string; rows: [string, string, any?][] }) =>
    <ui.Card title={title}><ui.Stack>{rows.map(([l, v, c], i) => KV(l, v, c))}</ui.Stack></ui.Card>

  // ── Left: formularz ─────────────────────────────────────────────

  function Left() {
    const { form, bind, set } = sdk.useForm({ loanAmount: 300000, margin: 2.0, loanPeriodMonths: 360, startDate: '2018-01-01', paymentDay: 15, bridgeMargin: 0, bridgeEndDate: '', wiborTenor: '3M', manualRate: '', interestMethod: '360', repaymentType: 'annuity' })
    const rates = useRatesForTenor(form.wiborTenor)

    const calculate = () => {
      const wd = rates.length ? rates : form.manualRate ? [{ date: '2000-01-01', rate: Number(form.manualRate) }] : null
      if (!wd) { sdk.log('Podaj stawkę WIBOR ręcznie lub zaimportuj dane', 'error'); return }
      const r = calculateLoan({ ...form, startDate: new Date(form.startDate), bridgeEndDate: form.bridgeEndDate ? new Date(form.bridgeEndDate) : null, wiborData: wd, interestBase: Number(form.interestMethod) || 360 })
      if (r) setResult(r)
    }

    const F = (label: string, key: string, type?: string) =>
      <ui.Field label={label}><ui.Input type={type === 'n' ? 'number' : type === 'd' ? 'date' : undefined} {...bind(key, type === 'n' ? Number : undefined)} /></ui.Field>

    return (
      <ui.Stack>
        <ui.Box
          header={<ui.Cell label>Parametry kredytu</ui.Cell>}
          body={
            <ui.Stack>
              {F('Kwota kredytu (PLN)', 'loanAmount', 'n')}{F('Marża (%)', 'margin', 'n')}{F('Okres (miesiące)', 'loanPeriodMonths', 'n')}
              <ui.Field label="WIBOR"><ui.Select {...bind('wiborTenor')} options={WIBOR_TENORS} /></ui.Field>
              <ui.Field label="Rodzaj rat"><ui.Select {...bind('repaymentType')} options={REPAYMENT_TYPES} /></ui.Field>
              {F('Data rozpoczęcia', 'startDate', 'd')}{F('Dzień spłaty', 'paymentDay', 'n')}{F('Marża pomostowa (%)', 'bridgeMargin', 'n')}
              {form.bridgeMargin > 0 && <ui.Field label="Koniec pomostowej"><ui.Input type="date" {...bind('bridgeEndDate')} /></ui.Field>}
              {!rates.length && <>
                <ui.Field label="Stawka WIBOR (%)"><ui.Input type="number" {...bind('manualRate')} placeholder="np. 5.85" /></ui.Field>
                <ui.Card color="warning"><ui.Text muted>Stała stawka — obliczenie zakłada niezmienną wartość WIBOR przez cały okres kredytu. Aby uwzględnić historyczne zmiany stawek, zaimportuj dane CSV.</ui.Text></ui.Card>
              </>}
              <ui.Button onClick={calculate} block color="primary">Oblicz</ui.Button>
            </ui.Stack>
          }
          grow
        />
      </ui.Stack>
    )
  }

  // ── Center: wyniki ──────────────────────────────────────────────

  function Center() {
    const result = useResult(), [tab, setTab] = useState('summary')
    if (!result) return <ui.Placeholder text="Wprowadź dane i kliknij Oblicz" />
    return (
      <ui.Page>
        <ui.Tabs tabs={tabs} active={tab} onChange={setTab} />
        {tab === 'summary' && <Summary r={result} />}
        {tab === 'schedule' && <Schedule r={result} />}
        {tab === 'compare' && <Compare r={result} />}
      </ui.Page>
    )
  }

  function Summary({ r }: { r: any }) {
    return (
      <ui.Stack>
        <ui.Stats>
          <ui.Stat title="Korzyść całkowita" value={formatPLN(r.overpaidInterest + r.futureSavings)} color="success" />
          <ui.Stat title="Rata aktualna" value={formatPLN(r.currentInstallment)} />
          <ui.Stat title="Rata bez WIBOR" value={formatPLN(r.installmentNoWibor)} color="info" />
        </ui.Stats>
        <KVCard title="Dotychczasowe" rows={[['Zapłacono łącznie', formatPLN(r.pastTotalPaid)], ['Kapitał', formatPLN(r.pastPrincipalPaid)], ['Odsetki', formatPLN(r.pastInterestTotal)], ['w tym WIBOR', formatPLN(r.pastInterestWibor), 'warning'], ['Rat zapłaconych', String(r.pastInstallmentsCount)]]} />
        <KVCard title="Przyszłe" rows={[['Do zapłaty', formatPLN(r.futureTotalToPay)], ['Odsetki przyszłe', formatPLN(r.futureInterestTotal)], ['Rat pozostałych', String(r.futureInstallmentsCount)]]} />
      </ui.Stack>
    )
  }

  function Schedule({ r }: { r: any }) {
    const [filter, setFilter] = useState('all')
    const filtered = filter === 'past' ? r.schedule.filter((x: any) => x.isPast) : filter === 'future' ? r.schedule.filter((x: any) => !x.isPast) : r.schedule
    const tableRows = filtered.map((x: any) => ({ number: x.number, date: formatDate(x.date), installment: formatPLN(x.installment), principal: formatPLN(x.principal), interest: formatPLN(x.interestTotal), wibor: formatPct(x.wiborRate), balance: formatPLN(x.remainingBalance) }))
    const filterTabs = [{ id: 'all', label: `Wszystkie (${r.schedule.length})` }, { id: 'past', label: 'Przeszłe' }, { id: 'future', label: 'Przyszłe' }]
    return (
      <ui.Stack>
        <ui.Tabs tabs={filterTabs} active={filter} onChange={setFilter} variant="lift" />
        <ui.Table columns={scheduleColumns} rows={tableRows} pageSize={24} empty="Brak rat dla wybranego filtra" />
      </ui.Stack>
    )
  }

  function Compare({ r }: { r: any }) {
    return (
      <ui.Stack>
        <ui.Stats>
          <ui.Stat title="Nadpłacone odsetki" value={formatPLN(r.overpaidInterest)} color="error" />
          <ui.Stat title="Przyszłe oszczędności" value={formatPLN(r.futureSavings)} color="success" />
        </ui.Stats>
        <KVCard title="Przeszłość" rows={[['Zapłacone z WIBOR', formatPLN(r.pastTotalPaid)], ['Zapłacone bez WIBOR', formatPLN(r.pastTotalPaidNoWibor)], ['Nadpłata (WIBOR)', formatPLN(r.overpaidInterest), 'error'], ['Nadpłata (WIBOR + marża)', formatPLN(r.overpaidWithMargin), 'error']]} />
        <KVCard title="Przyszłość" rows={[['Do zapłaty z WIBOR', formatPLN(r.futureTotalToPay)], ['Do zapłaty bez WIBOR', formatPLN(r.futureTotalNoWibor)], ['Oszczędność', formatPLN(r.futureSavings), 'success']]} />
        <KVCard title="Porównanie rat" rows={[['Rata aktualna', formatPLN(r.currentInstallment)], ['Rata bez WIBOR', formatPLN(r.installmentNoWibor), 'info'], ['Rata sam kapitał', formatPLN(r.installmentNoRate), 'success']]} />
      </ui.Stack>
    )
  }

  function Footer() {
    return <ui.Text muted>Kalkulator WIBOR</ui.Text>
  }

  // ── Rejestracja typów danych ────────────────────────────────────

  store.registerType('wibor-rate-set', [
    { key: 'tenorId', label: 'Tenor', required: true },
    { key: 'entries', label: 'Stawki' },
  ], 'Stawki WIBOR')

  // ── Contribution points ─────────────────────────────────────────

  sdk.registerView('wiborCalc.left', { slot: 'left', component: Left })
  sdk.registerView('wiborCalc.center', { slot: 'center', component: Center })
  sdk.registerView('wiborCalc.footer', { slot: 'footer', component: Footer })

  sdk.registerParser('wiborCalc.csv', {
    accept: '.csv',
    targetType: 'wibor-rate-set',
    parse: (text: string) => {
      const entries = parseStooqCSV(text)
      return entries.length ? [{ tenorId: 'wibor-3m', entries }] : []
    },
  })

  return {
    id: 'wibor-calc',
    label: 'Kalkulator WIBOR',
    description: 'Kalkulator kredytu hipotecznego WIBOR',
    version: '1.0.0',
    icon: icons.DollarSign,
  }
}

export default plugin
