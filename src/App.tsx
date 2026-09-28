import { Navigate, useRoutes } from 'react-router-dom'

import { circulationRoutes } from './routes'

// Standalone route tree for previewing this portal in isolation — see
// lms-membership-portal's identical App.tsx for the full rationale.
function App() {
  const element = useRoutes([...circulationRoutes, { path: '*', element: <Navigate to="/" replace /> }])
  return element
}

export default App
