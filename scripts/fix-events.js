/**
 * Migration script to fix existing events
 * Add current user email to all events' assignedToEmails
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Event from "../lib/models/Event.js";
import { connectToDatabase } from "../lib/mongodb.js";

dotenv.config();

const DEFAULT_USER_EMAIL = "admin@gmail.com";

async function fixEvents() {
  try {
    console.log("🔧 Starting event migration...");
    
    await connectToDatabase();
    console.log("✅ Connected to MongoDB");

    // Find all events
    const allEvents = await Event.find();
    console.log(`📦 Found ${allEvents.length} events to migrate`);

    let updated = 0;

    for (const event of allEvents) {
      // Check if assignedToEmails is empty or undefined
      if (!event.assignedToEmails || event.assignedToEmails.length === 0) {
        console.log(`  Updating "${event.title}"...`);
        
        event.assignedToEmails = [DEFAULT_USER_EMAIL];
        await event.save();
        updated++;
        
        console.log(`    ✅ Added ${DEFAULT_USER_EMAIL}`);
      } else {
        console.log(`  ✓ "${event.title}" already has emails:`, event.assignedToEmails);
      }
    }

    console.log(`\n✅ Migration complete! Updated ${updated} events`);

    // Verify the migration
    const verifyEvents = await Event.find();
    console.log("\n📋 Verification:");
    verifyEvents.forEach((e) => {
      console.log(`  - "${e.title}": ${e.assignedToEmails?.join(", ") || "NO EMAILS"}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

fixEvents();
