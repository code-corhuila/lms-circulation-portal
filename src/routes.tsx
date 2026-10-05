import type { RouteObject } from 'react-router-dom'

import { LoanFormPage } from './pages/loans/LoanFormPage'
import { LoansListPage } from './pages/loans/LoansListPage'
import { OverdueLoansPage } from './pages/loans/OverdueLoansPage'

// Exposed to lms-front via Module Federation (vite.config.ts's
// federation({ exposes })). Paths are relative to wherever the shell mounts
// this portal — this portal doesn't know or care what that prefix is.
export const circulationRoutes: RouteObject[] = [
  { index: true, element: <LoansListPage /> },
  { path: 'new', element: <LoanFormPage /> },
  { path: 'overdue', element: <OverdueLoansPage /> },
]
