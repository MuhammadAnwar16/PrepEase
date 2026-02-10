/**
 * Seed Courses Script
 * Populates the database with sample courses for testing
 * 
 * Usage: node seedCourses.js
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import Course from "./models/Course.js";

dotenv.config();

const sampleCourses = [
  {
    courseCode: "CS101",
    title: "Data Structures",
    description: "Learn fundamental data structures including arrays, linked lists, stacks, queues, and trees.",
    teacher: null, // Will be set to a test teacher ID if available
  },
  {
    courseCode: "WEB201",
    title: "Web Development",
    description: "Master full-stack web development with HTML, CSS, JavaScript, React, Node.js, and databases.",
    teacher: null,
  },
  {
    courseCode: "ML301",
    title: "Machine Learning",
    description: "Explore machine learning algorithms, neural networks, and practical applications with Python.",
    teacher: null,
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/prepease";
    console.log(`[Seed] Connecting to MongoDB at ${mongoUri}...`);
    
    await mongoose.connect(mongoUri);
    console.log("[Seed] ✅ Connected to MongoDB\n");

    // Clear existing courses (optional - comment out to keep existing courses)
    // const deletedCount = await Course.deleteMany({});
    // console.log(`[Seed] Cleared ${deletedCount.deletedCount} existing courses\n`);

    // Insert sample courses
    console.log("[Seed] Inserting sample courses...\n");
    const createdCourses = await Course.insertMany(sampleCourses);

    // Log created courses with their IDs
    console.log("[Seed] ✅ Courses created successfully:\n");
    console.log("========================================");
    
    createdCourses.forEach((course, index) => {
      console.log(`\n${index + 1}. ${course.title}`);
      console.log(`   Code: ${course.courseCode}`);
      console.log(`   ID: ${course._id}`);
      console.log(`   Description: ${course.description}`);
    });

    console.log("\n========================================");
    console.log("\n[Seed] 📋 Course IDs for testing:\n");
    
    createdCourses.forEach((course) => {
      console.log(`${course.courseCode}: ${course._id}`);
    });

    console.log("\n[Seed] ✨ Seeding complete!\n");
    console.log("[Seed] You can now use these course IDs in your material uploads.\n");

  } catch (error) {
    console.error("[Seed] ❌ Error seeding database:");
    console.error(error.message);
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("[Seed] 🔌 Disconnected from MongoDB\n");
  }
};

// Run the seeding script
seedDatabase();
