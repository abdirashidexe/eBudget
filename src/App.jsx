import { useEffect, useState } from 'react'
import {
  Archive,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Landmark,
  LockKeyhole,
  Plus,
  ReceiptText,
  WalletCards,
} from 'lucide-react'

const RATE = 60
const STORAGE_KEY = 'egyptBudgetState'
const INITIAL_STATE = {
  totalUSDPool: 2377.08,
  activeEGPBalance: 10000,
  activeHistory: [],
  checkpoints: [],
}

const money = (value) =>
  Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const normalizeCheckpoint = (checkpoint) => ({
  ...checkpoint,
  transactions: Array.isArray(checkpoint.transactions)
    ? checkpoint.transactions
    : [],
})

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return INITIAL_STATE
    const parsed = JSON.parse(saved)
    return {
      ...INITIAL_STATE,
      ...parsed,
      checkpoints: Array.isArray(parsed.checkpoints)
        ? parsed.checkpoints.map(normalizeCheckpoint)
        : [],
    }
  } catch {
    return INITIAL_STATE
  }
}

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`

function Field({ id, label, suffix, ...props }) {
  return (
    <label className="field-label" htmlFor={id}>
      <span>{label}</span>
      <span className="input-wrap">
        <input id={id} {...props} />
        {suffix && <span className="input-suffix">{suffix}</span>}
      </span>
    </label>
  )
}

function App() {
  const [budget, setBudget] = useState(loadState)
  const [expense, setExpense] = useState('')
  const [description, setDescription] = useState('')
  const [funds, setFunds] = useState('')
  const [monthLimit, setMonthLimit] = useState('')
  const [notice, setNotice] = useState('')
  const [expandedCheckpoints, setExpandedCheckpoints] = useState(() => new Set())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budget))
  }, [budget])

  const toggleCheckpoint = (id) => {
    setExpandedCheckpoints((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const announce = (message) => {
    setNotice('')
    window.setTimeout(() => setNotice(message), 0)
  }

  const subtractExpense = (event) => {
    event.preventDefault()
    const amountEGP = Number(expense)
    if (!Number.isFinite(amountEGP) || amountEGP <= 0) {
      announce('Enter an EGP amount greater than zero.')
      return
    }

    setBudget((current) => ({
      ...current,
      activeEGPBalance: current.activeEGPBalance - amountEGP,
      totalUSDPool: current.totalUSDPool - amountEGP / RATE,
      activeHistory: [
        ...current.activeHistory,
        {
          id: makeId(),
          amountEGP,
          desc: description.trim(),
          timestamp: new Date().toISOString(),
        },
      ],
    }))
    setExpense('')
    setDescription('')
    announce(`${money(amountEGP)} EGP subtracted.`)
  }

  const addFunds = (event) => {
    event.preventDefault()
    const amountUSD = Number(funds)
    if (!Number.isFinite(amountUSD) || amountUSD <= 0) {
      announce('Enter a USD amount greater than zero.')
      return
    }
    setBudget((current) => ({
      ...current,
      totalUSDPool: current.totalUSDPool + amountUSD,
    }))
    setFunds('')
    announce(`${money(amountUSD)} USD added to the vault.`)
  }

  const setLimit = (event) => {
    event.preventDefault()
    const amountUSD = Number(monthLimit)
    if (!Number.isFinite(amountUSD) || amountUSD < 0) {
      announce('Enter a USD limit of zero or more.')
      return
    }
    const amountEGP = amountUSD * RATE
    setBudget((current) => ({ ...current, activeEGPBalance: amountEGP }))
    setMonthLimit('')
    announce(
      `Month limit set to $${money(amountUSD)} USD (${money(amountEGP)} EGP).`,
    )
  }

  const closeMonth = () => {
    const checkpoint = {
      id: makeId(),
      closedAt: new Date().toISOString(),
      finalEGPBalance: budget.activeEGPBalance,
      txCount: budget.activeHistory.length,
      transactions: [...budget.activeHistory],
    }
    setBudget((current) => ({
      ...current,
      activeEGPBalance: 0,
      activeHistory: [],
      checkpoints: [checkpoint, ...current.checkpoints],
    }))
    announce('Month closed and checkpoint created.')
  }

  const recentTransactions = budget.activeHistory.slice(-5).reverse()

  return (
    <div className="min-h-screen bg-[#faf6f0] text-[#231f20]">
      <header className="border-b-[5px] border-[#231f20] bg-[#f2e9dc]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-md border-[3px] border-[#231f20] bg-[#d47859]">
              <WalletCards aria-hidden="true" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-lg font-extrabold leading-none">Egypt Budget</p>
              <p className="mt-1 text-xs font-semibold text-[#665d57]">
                Your money, simply kept.
              </p>
            </div>
          </div>
          <span className="flex items-center gap-2 text-xs font-bold text-[#665d57]">
            <LockKeyhole aria-hidden="true" size={16} />
            Saved locally
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <section
          className="vault-card"
          aria-labelledby="vault-heading"
        >
          <div className="relative z-10">
            <div className="eyebrow">
              <Landmark aria-hidden="true" size={18} />
              <h1 id="vault-heading">Total USD Pool</h1>
            </div>
            <p className="mt-5 break-words text-[clamp(2.5rem,9vw,5rem)] font-extrabold leading-none tracking-[-0.06em]">
              ${money(budget.totalUSDPool)}
              <span className="ml-2 text-base tracking-normal sm:text-xl">USD</span>
            </p>
            <p className="mt-4 text-lg font-semibold text-[#4e4743] sm:text-2xl">
              {money(budget.totalUSDPool * RATE)} EGP
            </p>
          </div>
          <div className="coin coin-one" aria-hidden="true">$</div>
          <div className="coin coin-two" aria-hidden="true">£</div>
        </section>

        <section className="mt-7 grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="paper-card flex flex-col justify-between bg-[#cbd3a4]">
            <div>
              <div className="eyebrow">
                <CalendarDays aria-hidden="true" size={18} />
                <h2>Active Period</h2>
              </div>
              <p className="mt-8 break-words text-[clamp(2.35rem,7vw,4rem)] font-extrabold leading-none tracking-[-0.055em]">
                {money(budget.activeEGPBalance)}
                <span className="ml-2 text-base tracking-normal">EGP</span>
              </p>
              <p className="mt-3 text-xl font-semibold text-[#4e532f]">
                ${money(budget.activeEGPBalance / RATE)} USD
              </p>
            </div>
            <p className="mt-10 border-t-[3px] border-[#231f20] pt-4 text-xs font-bold">
              Fixed Rate: $1 USD = 60.00 EGP
            </p>
          </article>

          <div className="paper-card">
            <div className="eyebrow">
              <ReceiptText aria-hidden="true" size={18} />
              <h2>Move Money</h2>
            </div>

            <form className="mt-6" onSubmit={subtractExpense}>
              <h3 className="flex items-center gap-2 text-lg font-extrabold">
                <ArrowDownLeft aria-hidden="true" className="text-[#a04432]" />
                Subtract transaction
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  id="expense"
                  label="Amount"
                  suffix="EGP"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="150.00"
                  value={expense}
                  onChange={(event) => setExpense(event.target.value)}
                />
                <Field
                  id="description"
                  label="Description (optional)"
                  type="text"
                  placeholder="Groceries"
                  maxLength="80"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <button className="action-button danger-button mt-4" type="submit">
                <ArrowDownLeft aria-hidden="true" size={19} />
                Subtract
              </button>
            </form>

            <div className="my-7 border-t-[3px] border-dashed border-[#9b8d80]" />

            <form onSubmit={addFunds}>
              <h3 className="flex items-center gap-2 text-lg font-extrabold">
                <ArrowUpRight aria-hidden="true" className="text-[#4c6b3c]" />
                Add funds to vault
              </h3>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <Field
                    id="funds"
                    label="Amount"
                    suffix="USD"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="500.00"
                    value={funds}
                    onChange={(event) => setFunds(event.target.value)}
                  />
                </div>
                <button className="action-button positive-button" type="submit">
                  <Plus aria-hidden="true" size={19} />
                  Add Funds
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="mt-7 paper-card" aria-labelledby="period-heading">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="eyebrow">
                <CalendarDays aria-hidden="true" size={18} />
                <h2 id="period-heading">Period Setup</h2>
              </div>
              <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-[#665d57]">
                Set the active spending limit in USD. It converts to EGP at the fixed rate and does not change your USD vault.
              </p>
            </div>
            <form
              className="flex w-full flex-col gap-3 sm:flex-row sm:items-end md:max-w-xl"
              onSubmit={setLimit}
            >
              <div className="min-w-0 flex-1">
                <Field
                  id="month-limit"
                  label="Set month limit"
                  suffix="USD"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="200.00"
                  value={monthLimit}
                  onChange={(event) => setMonthLimit(event.target.value)}
                />
              </div>
              <button className="action-button neutral-button" type="submit">
                Set Limit
              </button>
            </form>
          </div>
          <div className="mt-7 flex flex-col justify-between gap-4 border-t-[3px] border-[#231f20] pt-6 sm:flex-row sm:items-center">
            <p className="text-sm font-semibold text-[#665d57]">
              This archives {budget.activeHistory.length} transaction
              {budget.activeHistory.length === 1 ? '' : 's'} and resets the active balance.
            </p>
            <button
              className="action-button ochre-button shrink-0"
              type="button"
              onClick={closeMonth}
            >
              <Archive aria-hidden="true" size={19} />
              Close Month / Create Checkpoint
            </button>
          </div>
        </section>

        <section className="mt-7 grid gap-7 lg:grid-cols-2" aria-label="Data logs">
          <article className="paper-card">
            <div className="flex items-center justify-between gap-3">
              <div className="eyebrow">
                <ReceiptText aria-hidden="true" size={18} />
                <h2>Active Period Log</h2>
              </div>
              <span className="counter">{budget.activeHistory.length}</span>
            </div>
            <div className="mt-6">
              {recentTransactions.length ? (
                <ul className="divide-y-[3px] divide-[#d8cdc1]">
                  {recentTransactions.map((transaction) => (
                    <li className="flex items-start justify-between gap-4 py-4 first:pt-0" key={transaction.id}>
                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          {transaction.desc || 'Untitled transaction'}
                        </p>
                        <time
                          className="mt-1 block text-xs font-semibold text-[#756a63]"
                          dateTime={transaction.timestamp}
                        >
                          {new Date(transaction.timestamp).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </time>
                      </div>
                      <p className="shrink-0 font-extrabold text-[#a04432]">
                        − {money(transaction.amountEGP)} EGP
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState text="No transactions yet. Your latest five will appear here." />
              )}
            </div>
          </article>

          <article className="paper-card">
            <div className="flex items-center justify-between gap-3">
              <div className="eyebrow">
                <Archive aria-hidden="true" size={18} />
                <h2>Archived Months</h2>
              </div>
              <span className="counter">{budget.checkpoints.length}</span>
            </div>
            <div className="mt-6">
              {budget.checkpoints.length ? (
                <ul className="divide-y-[3px] divide-[#d8cdc1]">
                  {budget.checkpoints.map((checkpoint) => {
                    const isOpen = expandedCheckpoints.has(checkpoint.id)
                    const archivedTx = Array.isArray(checkpoint.transactions)
                      ? checkpoint.transactions
                      : []

                    return (
                      <li className="py-4 first:pt-0" key={checkpoint.id}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-4 text-left"
                          aria-expanded={isOpen}
                          onClick={() => toggleCheckpoint(checkpoint.id)}
                        >
                          <div className="min-w-0">
                            <time
                              className="font-bold"
                              dateTime={checkpoint.closedAt}
                            >
                              {new Date(checkpoint.closedAt).toLocaleDateString([], {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </time>
                            <p className="mt-1 text-xs font-semibold text-[#756a63]">
                              {checkpoint.txCount} transaction
                              {checkpoint.txCount === 1 ? '' : 's'}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <p className="text-right font-extrabold">
                              {money(checkpoint.finalEGPBalance)}
                              <span className="ml-1 text-xs">EGP</span>
                            </p>
                            <ChevronDown
                              aria-hidden="true"
                              size={20}
                              className={`transition-transform duration-200 ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>

                        {isOpen && (
                          <div className="mt-4 rounded-md border-[3px] border-[#d8cdc1] bg-[#f6f0e8] px-4 py-3">
                            {archivedTx.length ? (
                              <ul className="divide-y-[2px] divide-[#d8cdc1]">
                                {[...archivedTx].reverse().map((transaction) => (
                                  <li
                                    className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                    key={transaction.id}
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-bold">
                                        {transaction.desc || 'Untitled transaction'}
                                      </p>
                                      <time
                                        className="mt-1 block text-xs font-semibold text-[#756a63]"
                                        dateTime={transaction.timestamp}
                                      >
                                        {new Date(transaction.timestamp).toLocaleString([], {
                                          dateStyle: 'medium',
                                          timeStyle: 'short',
                                        })}
                                      </time>
                                    </div>
                                    <p className="shrink-0 text-sm font-extrabold text-[#a04432]">
                                      − {money(transaction.amountEGP)} EGP
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm font-semibold text-[#756a63]">
                                No transaction details were saved for this period.
                              </p>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <EmptyState text="Closed periods will be safely listed here." />
              )}
            </div>
          </article>
        </section>

        <footer className="flex flex-col justify-between gap-2 py-8 text-xs font-semibold text-[#756a63] sm:flex-row">
          <p>Private by design. Your budget stays in this browser.</p>
          <p>Egypt Budget · Fixed exchange rate</p>
        </footer>
      </main>
      <p className="sr-only" role="status" aria-live="polite">
        {notice}
      </p>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="rounded-md border-[3px] border-dashed border-[#9b8d80] bg-[#f6f0e8] px-5 py-8 text-center">
      <p className="text-sm font-semibold leading-relaxed text-[#756a63]">{text}</p>
    </div>
  )
}

export default App
