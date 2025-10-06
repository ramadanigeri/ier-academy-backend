// Use frontend's Sanity API to avoid authentication issues
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export async function getCourseBySlug(slug) {
  try {
    const response = await fetch(`${FRONTEND_URL}/api/sanity/course/${slug}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch course: ${response.statusText}`);
    }

    const course = await response.json();
    return course;
  } catch (error) {
    console.error("Error fetching course from frontend API:", error);
    throw error;
  }
}

// Alternative: Move Sanity client to backend
// import { createClient } from '@sanity/client'
//
// const client = createClient({
//   projectId: process.env.SANITY_PROJECT_ID,
//   dataset: process.env.SANITY_DATASET,
//   useCdn: false,
//   apiVersion: '2024-01-01',
//   token: process.env.SANITY_TOKEN, // Only if you need write access
// })
//
// export async function getCourseBySlug(slug) {
//   const query = `*[_type == "course" && slug.current == $slug][0] {
//     _id,
//     title,
//     slug,
//     price,
//     currency,
//     sessions[] {
//       _id,
//       title,
//       startDate,
//       endDate,
//       capacity,
//       enrolledCount,
//       status
//     }
//   }`
//
//   return await client.fetch(query, { slug })
// }
