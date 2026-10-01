import type { RouteObject } from 'react-router-dom'

import { EmptyState } from './components/ui/EmptyState'
import { OverdueLoansPage } from './pages/loans/OverdueLoansPage'

// Exposed to lms-front via Module Federation (vite.config.ts's
// federation({ exposes })). Paths are relative to wherever the shell mounts
// this portal. Each screen is a placeholder until its HU branch lands.
export const circulationRoutes: RouteObject[] = [
  {
    index: true,
    element: <EmptyState title="Loans" description="List active and returned loans, and register returns." hu="HU-07" />,
  },
  {
    path: 'new',
    element: <EmptyState title="New loan" description="Register a loan for a student and a book." hu="HU-06" />,
  },
  { path: 'overdue', element: <OverdueLoansPage /> },
]
