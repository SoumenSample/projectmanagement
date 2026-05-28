import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/lib/models/Project";
import logger from "@/lib/logger";

export async function GET(req) {
  try {
    logger.info("=== Revenue API Started ===");
    
    // Step 1: Connect to DB
    try {
      await connectToDatabase();
      logger.info("✓ Database connected");
    } catch (dbError) {
      console.error("✗ Database connection error:", dbError);
      throw new Error(`DB Connection failed: ${dbError.message}`);
    }

    // Step 2: Fetch all projects
    let allProjects = [];
    try {
      allProjects = await Project.find({});
      logger.info("✓ Fetched all projects:", { count: allProjects.length });
    } catch (fetchError) {
      console.error("✗ Error fetching projects:", fetchError);
      throw new Error(`Failed to fetch projects: ${fetchError.message}`);
    }

    // Step 3: Log what we found
    if (allProjects.length > 0) {
      logger.info("Sample project:", {
        title: allProjects[0].title,
        status: allProjects[0].status,
        projectCost: allProjects[0].projectCost,
        createdAt: allProjects[0].createdAt,
      });
    }

    // Step 4: Calculate revenue
    let totalRevenue = 0;
    try {
      allProjects.forEach((project) => {
        const projectCost = Number(project.projectCost) || 0;
        totalRevenue += projectCost;
      });
      logger.info("✓ Revenue calculated:", { totalRevenue });
    } catch (calcError) {
      console.error("✗ Error calculating revenue:", calcError);
      throw new Error(`Failed to calculate revenue: ${calcError.message}`);
    }

    // Step 6: Build response
    const response = {
      success: true,
      totalRevenue: Math.round(totalRevenue),
      monthlyRevenue: Math.round(totalRevenue),
      percentChange: "+0%",
      projectCount: allProjects.length,
      debug: {
        totalProjectsInDB: allProjects.length
      }
    };

    logger.info("✓ Response ready:", { debug: response.debug });
    return Response.json(response);
    
  } catch (error) {
    logger.error("✗ Revenue API error:", error.message);
    logger.error("Stack:", error.stack);
    
    return Response.json(
      { 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
