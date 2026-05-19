import Head from "next/head";

export default function SEO({
  title,
  description,
  keywords,
  canonical = "https://cyberspaceworks.com",
  ogImage = "logo.png",
}) {
  return (
    <Head>
      {/* Canonical Tag */}
      <link rel="canonical" href={canonical} />

      {/* Primary Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter Meta */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
}
