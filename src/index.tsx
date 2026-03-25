import type { PluginFactory, TableColumn } from '@obieg-zero/sdk'
import { daysBetween, resolveWibor, parseStooqCSV, calculateLoan } from './calc'

const plnFmt = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const plnFmt0 = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 })
const dateFmt = new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
const formatPLN = (v: number, decimals = 2) => (decimals === 0 ? plnFmt0 : plnFmt).format(v)
const formatPct = (v: number, d = 2) => `${v.toFixed(d)}%`
const formatDate = (d: Date) => dateFmt.format(d)

const WIBOR_TENORS = [{ value: '3M', label: 'WIBOR 3M' }, { value: '6M', label: 'WIBOR 6M' }, { value: '1M', label: 'WIBOR 1M' }]
const REPAYMENT_TYPES = [{ value: 'annuity', label: 'Raty równe' }, { value: 'decreasing', label: 'Raty malejące' }]

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
  { id: 'benefit', label: 'Korzyść klienta' },
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

  // ── CRM bridge ─────────────────────────────────────────────────

  function useCaseDefaults() {
    const caseId = sdk.shared(s => (s as any).crm?.caseId) as string | null
    const cases = store.usePosts('case')
    const opponents = store.usePosts('opponent')
    const templates = store.usePosts('opponent-template')

    if (!caseId) return null
    const cas = cases.find(c => c.id === caseId)
    if (!cas) return null

    const opponentId = cas.data.opponent as string | undefined
    const opponent = opponentId ? opponents.find(o => o.id === opponentId) : null
    const template = opponent ? templates.find(t => t.parentId === opponent.id) : null

    return {
      loanAmount: Number(cas.data.loanAmount) || 300000,
      startDate: cas.data.loanDate || '2018-01-01',
      margin: Number(template?.data.margin) || 2.0,
      bridgeMargin: Number(template?.data.bridgeMargin) || 0,
      wiborTenor: template?.data.wiborType || '3M',
      interestMethod: template?.data.interestMethod || '360',
      opponentName: opponent?.data.name || null,
      caseSubject: cas.data.subject || cas.id.slice(0, 8),
    }
  }

  // ── WIBOR data helpers ─────────────────────────────────────────

  const WIBOR_BASE = 'https://raw.githubusercontent.com/obieg-zero/wibor/main'
  const WIBOR_FILES: Record<string, string> = { '1M': 'wibor-1m.json', '3M': 'wibor-3m.json', '6M': 'wibor-6m.json' }

  function useRateStatus(tenor: string) {
    const sets = store.usePosts('wibor-rate-set')
    const tenorId = `wibor-${tenor.toLowerCase()}`
    const rateSet = sets.find((s: any) => s.data.tenorId === tenorId)
    const entries = (rateSet?.data?.entries || []) as { date: string; rate: number }[]
    if (!entries.length) return { count: 0, lastDate: null, fresh: false, lastRate: 0 }
    const lastDate = entries[entries.length - 1].date
    const fresh = daysBetween(new Date(lastDate), new Date()) < 14
    return { count: entries.length, lastDate, fresh, lastRate: entries[entries.length - 1].rate }
  }

  function saveTenorData(tenor: string, entries: { date: string; rate: number }[]) {
    const tenorId = `wibor-${tenor.toLowerCase()}`
    const sets = store.getPosts('wibor-rate-set')
    for (const s of sets) { if (s.data?.tenorId === tenorId) store.remove(s.id) }
    store.add('wibor-rate-set', { tenorId, entries })
    sdk.log(`WIBOR ${tenor}: wczytano ${entries.length} stawek`, 'ok')
  }

  async function fetchTenor(tenor: string) {
    sdk.log(`Pobieram WIBOR ${tenor}…`, 'info')
    try {
      const url = `${WIBOR_BASE}/${WIBOR_FILES[tenor]}`
      const res = await (window as any).fetch(url)
      if (!res.ok) throw new Error(res.statusText)
      const raw = await res.json() as { d: string; r: number }[]
      const entries = raw.map(e => ({ date: e.d, rate: e.r }))
      if (!entries.length) { sdk.log('Brak danych', 'error'); return }
      saveTenorData(tenor, entries)
    } catch (e: any) { sdk.log(`Błąd pobierania: ${e.message}`, 'error') }
  }

  async function fetchAllTenors() {
    for (const t of ['1M', '3M', '6M']) await fetchTenor(t)
  }

  function detectTenorFromFilename(filename: string): string | null {
    const fn = filename.toLowerCase()
    if (fn.includes('wibor1m') || fn.includes('wibor_1m') || fn.includes('wibor-1m') || fn.includes('plopln1m')) return '1M'
    if (fn.includes('wibor3m') || fn.includes('wibor_3m') || fn.includes('wibor-3m') || fn.includes('plopln3m')) return '3M'
    if (fn.includes('wibor6m') || fn.includes('wibor_6m') || fn.includes('wibor-6m') || fn.includes('plopln6m')) return '6M'
    return null
  }

  async function importTenorFile(tenor: string) {
    const file = await sdk.openFileDialog('.csv,.json')
    if (!file) return
    const detected = detectTenorFromFilename(file.name)
    if (detected && detected !== tenor) {
      sdk.log(`Plik "${file.name}" zawiera dane WIBOR ${detected}, a nie ${tenor}`, 'error')
      return
    }
    const text = await file.text()
    let entries: { date: string; rate: number }[]
    if (file.name.endsWith('.json')) {
      const raw = JSON.parse(text) as { d: string; r: number }[]
      entries = raw.map(e => ({ date: e.d, rate: e.r }))
    } else {
      entries = parseStooqCSV(text)
    }
    if (!entries.length) { sdk.log('Brak danych w pliku', 'error'); return }
    saveTenorData(tenor, entries)
  }

  function WiborDataBody() {
    return (
      <ui.Stack gap="md">
        <ui.Card>
          <ui.Stack>
            <ui.Text muted>Historyczne stawki WIBOR potrzebne do obliczeń. Pobierz aktualne dane jednym kliknięciem lub zaimportuj własny plik.</ui.Text>
            <ui.Row justify="end"><ui.Button size="xs" color="primary" onClick={fetchAllTenors}>Pobierz wszystkie</ui.Button></ui.Row>
          </ui.Stack>
        </ui.Card>
        {['1M', '3M', '6M'].map((t, i, arr) => {
          const s = useRateStatus(t)
          return <ui.Stack key={t}>
            <ui.Text muted>{`WIBOR ${t}`}</ui.Text>
            <ui.Text muted size="2xs">{s.count > 0 ? `${s.count} stawek · do ${s.lastDate} · ostatnia ${formatPct(s.lastRate)}` : 'brak danych'}</ui.Text>
            <ui.Row>
              <ui.Button size="xs" color="primary" onClick={() => fetchTenor(t)}>Pobierz</ui.Button>
              <ui.Button size="xs" color="ghost" onClick={() => importTenorFile(t)}>Importuj z pliku</ui.Button>
            </ui.Row>
            {i < arr.length - 1 && <ui.Divider />}
          </ui.Stack>
        })}
      </ui.Stack>
    )
  }

  function TemplatesBody({ onApply }: { onApply?: (data: Record<string, unknown>) => void }) {
    const [selectedOpp, setSelectedOpp] = useState('')
    const opponents = store.usePosts('opponent')
    const templates = store.usePosts('opponent-template')

    if (!opponents.length) return <ui.Placeholder text="Brak banków w bazie" />

    const options = [{ value: '', label: '— wszystkie banki —' }, ...opponents.map((o: any) => ({ value: o.id, label: o.data.name }))]
    const filtered = selectedOpp ? opponents.filter((o: any) => o.id === selectedOpp) : opponents

    const applyTemplate = (t: any) => {
      const data: Record<string, unknown> = {}
      if (t.data.margin) data.margin = Number(t.data.margin)
      if (t.data.bridgeMargin) data.bridgeMargin = Number(t.data.bridgeMargin)
      if (t.data.wiborType) data.wiborTenor = t.data.wiborType
      if (t.data.interestMethod) data.interestMethod = t.data.interestMethod
      onApply?.(data)
      sdk.log(`Zastosowano szablon: ${t.data.name}`, 'ok')
    }

    return (
      <ui.Stack gap="md">
        <ui.Card>
          <ui.Text muted>Szablony umów z danymi banków. Wybierz bank i zastosuj szablon aby wypełnić parametry kalkulatora.</ui.Text>
        </ui.Card>
        <ui.Select value={selectedOpp} options={options} onChange={(e: any) => setSelectedOpp(e.target.value)} />
        {filtered.map((opp: any) => {
          const tpls = templates.filter((t: any) => t.parentId === opp.id)
          if (!tpls.length) return null
          return <ui.Stack key={opp.id}>
            <ui.Text muted>{opp.data.name}</ui.Text>
            {tpls.map((t: any) => (
              <ui.Card key={t.id}>
                <ui.Stack>
                  <ui.Text muted size="2xs">{t.data.name}</ui.Text>
                  {t.data.margin && KV('Marża', formatPct(Number(t.data.margin)))}
                  {t.data.bridgeMargin && KV('Pomostowa', formatPct(Number(t.data.bridgeMargin)))}
                  {t.data.wiborType && KV('WIBOR', t.data.wiborType)}
                  {t.data.commission && KV('Prowizja', formatPct(Number(t.data.commission)))}
                  {t.data.interestMethod && KV('Naliczanie', t.data.interestMethod === '365' ? '365 dni' : '360 dni')}
                  <ui.Row justify="end"><ui.Button size="xs" color="primary" onClick={() => applyTemplate(t)}>Zastosuj</ui.Button></ui.Row>
                </ui.Stack>
              </ui.Card>
            ))}
          </ui.Stack>
        })}
      </ui.Stack>
    )
  }

  // ── Left: formularz ─────────────────────────────────────────────

  function Left() {
    const [leftTab, setLeftTab] = useState('params')
    const crmDefaults = useCaseDefaults()
    const defaults = { loanAmount: 300000, margin: 2.0, loanPeriodMonths: 360, startDate: '2018-01-01', paymentDay: 15, bridgeMargin: 0, bridgeEndDate: '', wiborTenor: '3M', manualRate: '', interestMethod: '360', repaymentType: 'annuity', ...crmDefaults }
    const { form, bind, set } = sdk.useForm(defaults)
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
      <ui.Box
        header={<ui.Tabs tabs={[{ id: 'params', label: 'Parametry' }, { id: 'wibor', label: 'Stawki WIBOR' }, { id: 'templates', label: 'Szablony' }]} active={leftTab} onChange={setLeftTab} />}
        body={leftTab === 'wibor' ? <WiborDataBody /> : leftTab === 'templates' ? <TemplatesBody onApply={(data) => { set(data); setLeftTab('params') }} /> : <ui.Stack>
          {crmDefaults?.caseSubject && <ui.Card color="info"><ui.Stack><ui.Text muted>Sprawa: {crmDefaults.caseSubject}</ui.Text>{crmDefaults.opponentName && <ui.Text muted size="2xs">Bank: {crmDefaults.opponentName}</ui.Text>}</ui.Stack></ui.Card>}
          {F('Kwota kredytu (PLN)', 'loanAmount', 'n')}{F('Marża (%)', 'margin', 'n')}{F('Okres (miesiące)', 'loanPeriodMonths', 'n')}
          <ui.Field label="WIBOR"><ui.Select {...bind('wiborTenor')} options={WIBOR_TENORS} /></ui.Field>
          <ui.Field label="Rodzaj rat"><ui.Select {...bind('repaymentType')} options={REPAYMENT_TYPES} /></ui.Field>
          {F('Data rozpoczęcia', 'startDate', 'd')}{F('Dzień spłaty', 'paymentDay', 'n')}{F('Marża pomostowa (%)', 'bridgeMargin', 'n')}
          {form.bridgeMargin > 0 && <ui.Field label="Koniec pomostowej"><ui.Input type="date" {...bind('bridgeEndDate')} /></ui.Field>}
          {!rates.length && <>
            <ui.Field label="Stawka WIBOR (%)"><ui.Input type="number" {...bind('manualRate')} placeholder="np. 5.85" /></ui.Field>
            <ui.Card color="warning"><ui.Stack><ui.Text muted>Stała stawka — obliczenie zakłada niezmienną wartość WIBOR przez cały okres kredytu. Aby uwzględnić historyczne zmiany stawek, zaimportuj dane CSV.</ui.Text><ui.Row justify="end"><ui.Button size="xs" color="primary" outline onClick={() => setLeftTab('wibor')}>Stawki WIBOR</ui.Button></ui.Row></ui.Stack></ui.Card>
          </>}
          <ui.Button onClick={calculate} block color="primary">Oblicz</ui.Button>
        </ui.Stack>}
        grow
      />
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
        {tab === 'benefit' && <Benefit r={result} />}
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
          <ui.Stat title="Rata bez WIBOR i marży" value={formatPLN(r.installmentNoRate)} color="success" />
        </ui.Stats>
        <KVCard title="Dotychczasowe" rows={[['Zapłacono łącznie', formatPLN(r.pastTotalPaid)], ['Kapitał', formatPLN(r.pastPrincipalPaid)], ['Odsetki', formatPLN(r.pastInterestTotal)], ['w tym WIBOR', formatPLN(r.pastInterestWibor), 'warning'], ['w tym marża', formatPLN(r.pastInterestMargin), 'warning'], ['Rat zapłaconych', String(r.pastInstallmentsCount)]]} />
        <KVCard title="Przyszłe" rows={[['Do zapłaty', formatPLN(r.futureTotalToPay)], ['Kapitał do spłaty', formatPLN(r.futureTotalToPay - r.futureInterestTotal)], ['Odsetki przyszłe', formatPLN(r.futureInterestTotal)], ['w tym WIBOR', formatPLN(r.futureInterestWibor), 'warning'], ['w tym marża', formatPLN(r.futureInterestMargin), 'warning'], ['Rat pozostałych', String(r.futureInstallmentsCount)]]} />
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

  function Benefit({ r }: { r: any }) {
    return (
      <ui.Stack>
        <ui.Stats>
          <ui.Stat title="Korzyść łączna (WIBOR)" value={formatPLN(r.overpaidInterest + r.futureSavings)} color="success" />
          <ui.Stat title="Korzyść łączna (WIBOR + marża)" value={formatPLN(r.overpaidWithMargin + r.futureSavingsWithMargin)} color="success" />
        </ui.Stats>
        <KVCard title="Nadpłacone dotychczas" rows={[['Nadpłata z tytułu WIBOR', formatPLN(r.overpaidInterest), 'error'], ['Nadpłata z tytułu WIBOR + marża', formatPLN(r.overpaidWithMargin), 'error']]} />
        <KVCard title="Przyszłe oszczędności" rows={[['Oszczędność (WIBOR)', formatPLN(r.futureSavings), 'success'], ['Oszczędność (WIBOR + marża)', formatPLN(r.futureSavingsWithMargin), 'success']]} />
        <KVCard title="Różnica w racie miesięcznej" rows={[['Rata aktualna', formatPLN(r.currentInstallment)], ['Rata bez WIBOR', formatPLN(r.installmentNoWibor), 'info'], ['Rata bez WIBOR i marży', formatPLN(r.installmentNoRate), 'success'], ['Oszczędność miesięczna (bez WIBOR)', formatPLN(r.currentInstallment - r.installmentNoWibor), 'info'], ['Oszczędność miesięczna (bez WIBOR i marży)', formatPLN(r.currentInstallment - r.installmentNoRate), 'success']]} />
      </ui.Stack>
    )
  }

  function Footer() {
    const crmDefaults = useCaseDefaults()
    return <ui.Text muted>{crmDefaults?.opponentName ? `WIBOR · ${crmDefaults.opponentName}` : 'Kalkulator WIBOR'}</ui.Text>
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
    parse: (text: string, filename?: string) => {
      const entries = parseStooqCSV(text)
      if (!entries.length) return []
      const fn = (filename || '').toLowerCase()
      const tenorId = fn.includes('6m') ? 'wibor-6m' : fn.includes('1m') ? 'wibor-1m' : 'wibor-3m'
      return [{ tenorId, entries }]
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
