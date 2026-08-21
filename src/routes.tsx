import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { NotFoundPage, PublicOnly, RequireAuth } from '@/router'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { BudgetsPage } from '@/pages/BudgetsPage'
import { BudgetDetailPage } from '@/pages/BudgetDetailPage'
import { AccountsPage } from '@/pages/AccountsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { GoalsPage } from '@/pages/GoalsPage'
import { FinancialHealthPage } from '@/pages/FinancialHealthPage'
import { SettingsPage } from '@/pages/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app" replace />,
  },
  {
    element: <PublicOnly />,
    children: [
      { path: '/auth/login', element: <LoginPage /> },
      { path: '/auth/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/app',
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'transactions', element: <TransactionsPage /> },
          { path: 'budgets', element: <BudgetsPage /> },
          { path: 'budgets/:id', element: <BudgetDetailPage /> },
          { path: 'accounts', element: <AccountsPage /> },
          { path: 'analytics', element: <AnalyticsPage /> },
          { path: 'goals', element: <GoalsPage /> },
          { path: 'financial-health', element: <FinancialHealthPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
      // Legacy redirects to prevent 404 on old bookmarks
      { path: '/dashboard', element: <Navigate to="/app" replace /> },
      { path: '/transactions', element: <Navigate to="/app/transactions" replace /> },
      { path: '/budgets', element: <Navigate to="/app/budgets" replace /> },
      { path: '/accounts', element: <Navigate to="/app/accounts" replace /> },
      { path: '/analytics', element: <Navigate to="/app/analytics" replace /> },
      { path: '/goals', element: <Navigate to="/app/goals" replace /> },
      { path: '/financial-health', element: <Navigate to="/app/financial-health" replace /> },
      { path: '/settings', element: <Navigate to="/app/settings" replace /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
