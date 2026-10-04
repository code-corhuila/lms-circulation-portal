import { type FormEvent, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { type SearchableOption, SearchableSelect } from '../../components/ui/SearchableSelect'
import { apiClient, type ShellError } from 'shell/apiClient'

type FieldErrors = Partial<Record<'studentId' | 'bookId', string>>

interface StudentSearchResult {
  id: string
  fullName: string
  documentId: string
}

interface BookSearchResult {
  id: string
  title: string
  author: string
  availableCopies: number
}

function toStudentOptions(data: unknown): SearchableOption[] {
  const students = (data as { data?: StudentSearchResult[] })?.data ?? []
  return students.map((s) => ({ id: s.id, label: s.fullName, sublabel: `Doc. ${s.documentId}` }))
}

function toBookOptions(data: unknown): SearchableOption[] {
  const books = (data as { data?: BookSearchResult[] })?.data ?? []
  return books.map((b) => ({
    id: b.id,
    label: b.title,
    sublabel: `${b.author} · ${b.availableCopies} available`,
  }))
}

// Implements HU-06 (library-docs/04-requirements/user-stories.md):
// "As the administrator, I want to register a loan for a student and a book...
// so that the copy is reserved and the due date is tracked." Calls
// lms-circulation-api's POST /loans, which coordinates eligibility
// (membership-service) and copy availability (catalog-service) server-side.
export function LoanFormPage() {
  const navigate = useNavigate()
  const [studentId, setStudentId] = useState('')
  const [studentLabel, setStudentLabel] = useState('')
  const [bookId, setBookId] = useState('')
  const [bookLabel, setBookLabel] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // One key for this whole registration intent, reused on every retry —
  // rules/2-anexos/H-front.md: "Idempotency-Key por intención, reutilizada
  // al reintentar". Matters more here than in the other two portals: without
  // it, a retried loan registration after a network cut could decrement a
  // book's available copies twice for one intent.
  const idempotencyKey = useRef(crypto.randomUUID())

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    const nextFieldErrors: FieldErrors = {}
    if (!studentId) nextFieldErrors.studentId = 'Pick a student from the list'
    if (!bookId) nextFieldErrors.bookId = 'Pick a book from the list'
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await apiClient.post(
        '/loans',
        { studentId, bookId },
        { headers: { 'Idempotency-Key': idempotencyKey.current } },
      )
      navigate('/')
    } catch (err) {
      const shellError = err as ShellError
      if (shellError.details?.length) {
        const next: FieldErrors = {}
        const knownFields: Record<string, 0> = { studentId: 0, bookId: 0 }
        for (const detail of shellError.details) {
          if (detail.field in knownFields) {
            next[detail.field as keyof FieldErrors] = detail.message
          }
        }
        setFieldErrors(next)
      }
      setFormError(shellError.message ?? 'Unable to register the loan. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Register loan</h1>
        <p className="text-sm text-slate-500">HU-06 — reserves a copy and sets the due date (7 days).</p>
      </div>

      <Card>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <SearchableSelect
            id="studentId"
            label="Student"
            placeholder="Type a student's name…"
            searchUrl="/students"
            toOptions={toStudentOptions}
            value={studentId}
            selectedLabel={studentLabel}
            onChange={(id, label) => {
              setStudentId(id)
              setStudentLabel(label)
            }}
            error={fieldErrors.studentId}
          />

          <SearchableSelect
            id="bookId"
            label="Book"
            placeholder="Type a book's title…"
            searchUrl="/books"
            toOptions={toBookOptions}
            value={bookId}
            selectedLabel={bookLabel}
            onChange={(id, label) => {
              setBookId(id)
              setBookLabel(label)
            }}
            error={fieldErrors.bookId}
          />

          {formError && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-error-600">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/')} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Register loan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
