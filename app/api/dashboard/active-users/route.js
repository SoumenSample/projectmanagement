import { connectToDatabase } from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import logger from "@/lib/logger";

export async function GET(req) {
  try {
    logger.info("=== Active Clients API Started ===");
    
    // Step 1: Connect to DB
    try {
      await connectToDatabase();
      logger.info("✓ Database connected");
    } catch (dbError) {
      console.error("✗ Database connection error:", dbError);
      throw new Error(`DB Connection failed: ${dbError.message}`);
    }

    // Step 2: Fetch all clients
    let allClients = [];
    try {
      allClients = await Client.find({});
      logger.info("✓ Fetched all clients:", { count: allClients.length });
    } catch (fetchError) {
      console.error("✗ Error fetching clients:", fetchError);
      throw new Error(`Failed to fetch clients: ${fetchError.message}`);
    }

    // Step 3: Filter active clients
    let activeClients = [];
    try {
      activeClients = allClients.filter(c => c.status === "active");
      logger.info("✓ Active clients filtered:", { count: activeClients.length });
      
      if (allClients.length > 0) {
        logger.info("Sample client:", {
          name: allClients[0].name,
          status: allClients[0].status,
        });
      }
    } catch (filterError) {
      console.error("✗ Error filtering clients:", filterError);
      throw new Error(`Failed to filter clients: ${filterError.message}`);
    }

    // Step 4: Build response
    const response = {
      success: true,
      totalActiveClients: activeClients.length,
      newClientsThisMonth: 0,
      breakdown: {
        manuallyAdded: activeClients.filter(c => c.source === "manual-admin").length,
        convertedFromLeads: activeClients.filter(c => c.convertedFromLead).length,
      },
      debug: {
        totalClientsInDB: allClients.length,
        activeClientsFound: activeClients.length
      }
    };

    logger.info("✓ Response ready:", { debug: response.debug });
    return Response.json(response);
    
  } catch (error) {
    logger.error("✗ Active Clients API error:", error.message);
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
