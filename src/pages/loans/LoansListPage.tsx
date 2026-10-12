import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { apiClient, type ShellError } from 'shell/apiClient'
import type { Loan, Paginated } from '../../types'

const timeFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

function formatDate(iso: string) {
  return timeFormat.format(new Date(iso))
}

type ViewState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'data'; loans: Loan[] }

// Implements HU-07 (library-docs/04-requirements/user-stories.md):
// "As the administrator, I want to see active loans and return history, and
// register a return." Registering a new loan (HU-06) is a separate page —
// see LoanFormPage.
//
// Four states, per rules/2-anexos/H-front.md — loading, error with retry,
// empty, and data.
export function LoansListPage() {
  const [view, setView] = useState<ViewState>({ status: 'loading' })
  const [status, setStatus] = useState<'' | 'ACTIVE' | 'RETURNED'>('')
  const [returningId, setReturningId] = useState<string | null>(null)
  const [returnError, setReturnError] = useState<string | null>(null)
  const [studentNames, setStudentNames] = useState<Record<string, string>>({})
  const [bookTitles, setBookTitles] = useState<Record<string, string>>({})

  // Rules/2-anexos/H-front.md: "Una petición más nueva reemplaza a la anterior".
  const latestRequestId = useRef(0)

  async function load(currentStatus: typeof status) {
    const requestId = ++latestRequestId.current
    setView({ status: 'loading' })
    try {
      const { data } = await apiClient.get<Paginated<Loan>>('/loans', {
        params: currentStatus ? { status: currentStatus } : undefined,
      })
      if (requestId !== latestRequestId.current) return
      setView(data.data.length === 0 ? { status: 'empty' } : { status: 'data', loans: data.data })
    } catch (err) {
      if (requestId !== latestRequestId.current) return
      const shellError = err as ShellError
      setView({ status: 'error', message: shellError.message ?? 'Unable to load loans.' })
    }
  }

  // A Loan only carries studentId/bookId (circulation-service owns neither
  // Student nor Book) — these two lookups turn those ids into the name and
  // title an administrator can actually read, same data membership-service
  // and catalog-service already expose for LoanFormPage's SearchableSelect.
  async function loadNames() {
    try {
      const { data } = await apiClient.get<Paginated<{ id: string; fullName: string }>>('/students', {
        params: { limit: 100 },
      })
      setStudentNames(Object.fromEntries(data.data.map((s) => [s.id, s.fullName])))
    } catch {
      // Falls back to showing the raw id for every row — still usable.
    }
    try {
      const { data } = await apiClient.get<Paginated<{ id: string; title: string }>>('/books', {
        params: { limit: 100 },
      })
      setBookTitles(Object.fromEntries(data.data.map((b) => [b.id, b.title])))
    } catch {
      // Falls back to showing the raw id for every row — still usable.
    }
  }

  useEffect(() => {
    load(status)
    loadNames()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFilter(event: FormEvent) {
    event.preventDefault()
    load(status)
  }

  async function returnLoan(id: string) {
    setReturningId(id)
    setReturnError(null)
    try {
      await apiClient.post(`/loans/${id}/return`)
      load(status)
    } catch (err) {
      const shellError = err as ShellError
      setReturnError(shellError.message ?? 'Unable to register the return.')
    } finally {
      setReturningId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Loans</h1>
          <p className="text-sm text-slate-500">Active loans and return history.</p>
        </div>
        <Link to="new">
          <Button>Register loan</Button>
        </Link>
      </div>

      <form onSubmit={handleFilter} className="flex gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="RETURNED">Returned</option>
        </select>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>

      {returnError && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-error-600">{returnError}</p>
      )}

      {view.status === 'loading' && (
        <Card className="p-6 text-center text-sm text-slate-400">Loading loans…</Card>
      )}

      {view.status === 'error' && (
        <Card className="space-y-3 p-6 text-center">
          <p role="alert" className="text-sm text-error-600">{view.message}</p>
          <Button variant="secondary" onClick={() => load(status)}>Try again</Button>
        </Card>
      )}

      {view.status === 'empty' && (
        <Card className="p-6 text-center text-sm text-slate-400">No loans found.</Card>
      )}

      {view.status === 'data' && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Student</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Book</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Loan date</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Due date</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {view.loans.map((l) => (
                <tr key={l.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">{studentNames[l.studentId] ?? l.studentId}</td>
                  <td className="px-4 py-3 text-slate-500">{bookTitles[l.bookId] ?? l.bookId}</td>
                  <td className="px-4 py-3 text-slate-500 tabular-nums">{formatDate(l.loanDate)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatDate(l.dueDate)}</td>
                  <td className="px-4 py-3">
                    {l.status === 'RETURNED' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-500/10 ring-inset">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Returned{l.wasLate ? ' (late)' : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-success-600 ring-1 ring-emerald-600/10 ring-inset">
                        <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {l.status === 'ACTIVE' && (
                      <Button
                        variant="secondary"
                        isLoading={returningId === l.id}
                        onClick={() => returnLoan(l.id)}
                      >
                        Return
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
