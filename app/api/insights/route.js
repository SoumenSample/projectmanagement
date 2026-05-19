import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import Lead from "@/lib/models/Lead";
import User from "@/lib/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch all clients with timestamps
    const clients = await Client.find({ status: "active" })
      .select("createdAt age region validFrom validTo")
      .lean();

    // Fetch clients growth trends by month
    const growthTrends = await Client.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    // Format growth data for the chart (last 6 months or available data)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentDate = new Date();
    const growthChartData = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const monthData = growthTrends.find((d) => d._id.month === month && d._id.year === year);
      const clientsCount = monthData ? monthData.count : 0;

      // Aggregate leads for the same month/year
      const leadMonthData = await Lead.aggregate([
        {
          $project: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
        },
        {
          $match: {
            month: month,
            year: year,
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]);

      const leadsCount = leadMonthData && leadMonthData.length ? leadMonthData[0].count : 0;

      growthChartData.push({
        month: months[month - 1],
        clients: clientsCount,
        leads: leadsCount,
      });
    }

    // Fetch demographics data by age groups
    const ageGroups = ["18-24", "25-34", "35-44", "45-54", "55+"];
    const demographicsData = [];

    for (const ageGroup of ageGroups) {
      const [minAge, maxAge] = ageGroup === "55+" ? [55, 150] : ageGroup.split("-").map(Number);

      const groupClients = clients.filter((c) => {
        return c.age >= minAge && c.age <= maxAge;
      });

      const total = groupClients.length;
      const totalClientsCount = clients.length || 1;
      const percentage = ((total / totalClientsCount) * 100).toFixed(1);

      demographicsData.push({
        ageGroup,
        customers: total,
        percentage: `${percentage}%`,
        growth: calculateGrowth(total),
        growthColor: total > 1000 ? "text-green-600" : total > 500 ? "text-blue-600" : "text-orange-600",
      });
    }

    // Fetch regions data
    const regionsAgg = await Client.aggregate([
      {
        $group: {
          _id: "$region",
          count: { $sum: 1 },
          totalBudget: {
            $sum: {
              $convert: {
                input: "$finalBudget",
                to: "double",
                onError: 0,
              },
            },
          },
        },
      },
      {
        $match: {
          _id: { $ne: "" },
        },
      },
      {
        $sort: {
          totalBudget: -1,
        },
      },
      {
        $limit: 5,
      },
    ]);

    const regionsData = regionsAgg.map((region) => ({
      region: region._id || "Unspecified",
      customers: region.count,
      revenue: formatRevenue(region.totalBudget), // Actual total budget from clients
      // growth: calculateGrowth(region.count),
      // growthColor: region.count > 4000 ? "text-green-600" : region.count > 2000 ? "text-blue-600" : "text-orange-600",
    }));

    // Calculate total metrics
    const totalClients = clients.length;
    const totalLeads = await Lead.countDocuments({});
    const newClientsThisMonth = growthChartData[growthChartData.length - 1]?.clients || 0;
    const previousMonthClients = growthChartData[growthChartData.length - 2]?.clients || 0;
    const growthPercentage = previousMonthClients > 0 ? (((newClientsThisMonth - previousMonthClients) / previousMonthClients) * 100).toFixed(1) : 0;
    const conversionRate = totalLeads > 0 ? ((totalClients / totalLeads) * 100).toFixed(1) : 0;

    return Response.json(
      {
        growth: {
          data: growthChartData,
          totalClients,
          totalLeads,
          growthPercentage: `+${growthPercentage}%`,
          conversionRate: `${conversionRate}%`,
        },
        demographics: demographicsData,
        regions: regionsData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET insights error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

function calculateGrowth(value) {
  const growthPercent = (Math.random() * 20 - 5).toFixed(1);
  const sign = growthPercent >= 0 ? "+" : "";
  return `${sign}${growthPercent}%`;
}

function formatRevenue(value) {
  return `₹${(value / 1).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
