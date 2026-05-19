/**
 * Convert Google Drive share link to direct preview URL
 * Examples:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * 
 * Converts to: https://drive.google.com/uc?export=view&id=FILE_ID
 */
export function convertGoogleDriveLink(url) {
  if (!url) return "";

  try {
    // Pattern 1: https://drive.google.com/file/d/FILE_ID/view
    const pattern1 = /drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/;
    const match1 = url.match(pattern1);
    if (match1) {
      return `https://drive.google.com/uc?export=view&id=${match1[1]}`;
    }

    // Pattern 2: https://drive.google.com/open?id=FILE_ID
    const pattern2 = /drive\.google\.com\/open\?id=([a-zA-Z0-9-_]+)/;
    const match2 = url.match(pattern2);
    if (match2) {
      return `https://drive.google.com/uc?export=view&id=${match2[1]}`;
    }

    // If already a direct URL or not a Drive link, return as is
    return url;
  } catch (error) {
    console.error("Error converting Google Drive link:", error);
    return url;
  }
}

/**
 * Check if URL is a Google Drive link
 */
export function isGoogleDriveLink(url) {
  return url && url.includes("drive.google.com");
}

/**
 * Extract File ID from Google Drive URL
 */
export function extractGoogleDriveFileId(url) {
  if (!url) return null;

  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view
  const pattern1 = /drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/;
  const match1 = url.match(pattern1);
  if (match1) return match1[1];

  // Pattern 2: https://drive.google.com/open?id=FILE_ID
  const pattern2 = /drive\.google\.com\/open\?id=([a-zA-Z0-9-_]+)/;
  const match2 = url.match(pattern2);
  if (match2) return match2[1];

  return null;
}
