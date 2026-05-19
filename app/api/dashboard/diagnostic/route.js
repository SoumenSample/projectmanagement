import { connectToDatabase } from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import logger from "@/lib/logger";

export async function GET(req) {
  try {
    logger.info("=== Diagnostic API ===");
    
    await connectToDatabase();
    logger.info("Database connected");

    // Get ALL clients with detailed info
    const allClients = await Client.find({});
    logger.info("Total clients found:", { count: allClients.length });

    // Get stats
    const activeCount = allClients.filter(c => c.status === "active").length;
    const inactiveCount = allClients.filter(c => c.status === "inactive").length;
    const otherStatusCount = allClients.filter(c => c.status !== "active" && c.status !== "inactive").length;

    // Calculate total budgets
    let totalBudget = 0;
    let activeBudget = 0;
    let budgetErrors = 0;

    allClients.forEach(c => {
      const budget = parseFloat(c.finalBudget);
      if (isNaN(budget)) {
        budgetErrors++;
        logger.warn("Invalid budget for client", { name: c.name });
      } else {
        totalBudget += budget;
        if (c.status === "active") {
          activeBudget += budget;
        }
      }
    });

    // Sample data
    const samples = allClients.slice(0, 3).map(c => ({
      name: c.name,
      status: c.status,
      finalBudget: c.finalBudget,
      createdAt: c.createdAt
    }));

    return Response.json({
      success: true,
      summary: {
        totalClients: allClients.length,
        activeClients: activeCount,
        inactiveClients: inactiveCount,
        otherStatus: otherStatusCount,
        totalBudget,
        activeBudget,
        budgetErrors
      },
      samples,
      fullData: allClients
    });
    
  } catch (error) {
    console.error("Diagnostic error:", error);
    return Response.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
