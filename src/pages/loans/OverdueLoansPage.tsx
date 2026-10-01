import { useEffect, useState } from 'react'

import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { apiClient, type ShellError } from 'shell/apiClient'
import type { Loan, Paginated } from '../../types'

const timeFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

function formatDate(iso: string) {
  return timeFormat.format(new Date(iso))
}

function daysOverdue(dueDate: string): number {
  const ms = Date.now() - new Date(dueDate).getTime()
  return Math.max(1, Math.floor(ms / (24 * 60 * 60 * 1000)))
}

type ViewState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'data'; loans: Loan[] }

// Implements HU-08's "Overdue Loans" report (library-docs/04-requirements/user-stories.md,
// Scenario 2): active loans whose due date has already passed. The late-return
// suspension itself is applied server-side by lms-circulation-api when the
// return is registered (see LoansListPage) — this page is read-only.
//
// Four states, per rules/2-anexos/H-front.md — loading, error with retry,
// empty, and data.
export function OverdueLoansPage() {
  const [view, setView] = useState<ViewState>({ status: 'loading' })

  async function load() {
    setView({ status: 'loading' })
    try {
      const { data } = await apiClient.get<Paginated<Loan>>('/loans/overdue')
      setView(data.data.length === 0 ? { status: 'empty' } : { status: 'data', loans: data.data })
    } catch (err) {
      const shellError = err as ShellError
      setView({ status: 'error', message: shellError.message ?? 'Unable to load overdue loans.' })
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Overdue loans</h1>
        <p className="text-sm text-slate-500">Loans past their due date and still active.</p>
      </div>

      {view.status === 'loading' && (
        <Card className="p-6 text-center text-sm text-slate-400">Loading overdue loans…</Card>
      )}

      {view.status === 'error' && (
        <Card className="space-y-3 p-6 text-center">
          <p role="alert" className="text-sm text-error-600">{view.message}</p>
          <Button variant="secondary" onClick={() => load()}>Try again</Button>
        </Card>
      )}

      {view.status === 'empty' && (
        <Card className="p-6 text-center text-sm text-slate-400">No overdue loans.</Card>
      )}

      {view.status === 'data' && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Book</th>
                <th className="px-4 py-3 font-medium">Due date</th>
                <th className="px-4 py-3 font-medium">Days overdue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {view.loans.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 text-slate-500">{l.studentId}</td>
                  <td className="px-4 py-3 text-slate-500">{l.bookId}</td>
                  <td className="px-4 py-3">{formatDate(l.dueDate)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-warning-500">
                      {daysOverdue(l.dueDate)} day(s)
                    </span>
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
