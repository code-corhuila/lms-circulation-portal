// Mirrors the Circulation-relevant subset of
// library-docs/07-api/contracts/openapi/library-api.yaml component schemas.

export interface Loan {
  id: string
  studentId: string
  bookId: string
  loanDate: string
  dueDate: string
  returnDate: string | null
  status: 'ACTIVE' | 'RETURNED'
  wasLate: boolean | null
}

// lms-circulation-api's /loans and /loans/overdue now return the full
// {total,page,limit,totalPages} envelope — see
// internal/adapter/in/httpapi/handler/loan_handler.go.
export interface PaginatedMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginatedMeta
}
