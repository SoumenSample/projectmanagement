import { MetricsOverview } from "./component/metrics-overview"
import { ChartAreaInteractive, SalesChart } from "./component/salesCharts"
import { RecentTransactions } from "./component/recent-transactions"
import { TopProducts } from "./component/top-products"
import { CustomerInsights } from "./component/customer-insights"
import { QuickActions } from "./component/quick-actions"
import { RevenueBreakdown } from "./component/revenue-breakdown"

export default function Dashboard2() {
  return (
    <div className="flex-1 space-y-6 px-6 pt-0">
        {/* Enhanced Header */}

        <div className="flex md:flex-row flex-col md:items-center justify-between gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Business Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your business performance and key metrics in real-time
            </p>
          </div>
          <QuickActions />
        </div>

        {/* Main Dashboard Grid */}
        <div className="@container/main space-y-6">
          {/* Top Row - Key Metrics */}

          <MetricsOverview />

          {/* Second Row - Charts in 6-6 columns */}
          <div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
            <ChartAreaInteractive />
            <RevenueBreakdown />
          </div>

          {/* Third Row - Two Column Layout */}
          <div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
            <RecentTransactions />
            <TopProducts />
          </div>

          {/* Fourth Row - Customer Insights and Team Performance */}
          <CustomerInsights />
        </div>
      </div>
  )
}