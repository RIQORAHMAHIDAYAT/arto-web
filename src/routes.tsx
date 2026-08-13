import { createBrowserRouter } from 'react-router-dom'
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
        path: '/',
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
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])