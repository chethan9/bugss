import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

// SEO elements that can be used in _document.tsx (returns JSX without Head wrapper)
export function SEOElements() {
  return (
    <>
      <title>FixFlix - GitHub Issue Analytics Dashboard</title>
      <meta name="description" content="Analyze GitHub issues and tasks with powerful filtering, reporting, and 27 analytics widgets. Connect any repository and get actionable insights instantly." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="FixFlix - GitHub Issue Analytics Dashboard" />
      <meta property="og:description" content="Analyze GitHub issues and tasks with powerful filtering, reporting, and 27 analytics widgets. Connect any repository and get actionable insights instantly." />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="FixFlix - GitHub Issue Analytics Dashboard" />
      <meta name="twitter:description" content="Analyze GitHub issues and tasks with powerful filtering, reporting, and 27 analytics widgets. Connect any repository and get actionable insights instantly." />
    </>
  );
}

// SEO component for use in pages/_app.tsx or individual pages (uses next/head)
// Note: Flattened structure (no fragment) for better Next.js Head compatibility during hot reload
export function SEO({
  title = "FixFlix - GitHub Issue Analytics Dashboard",
  description = "Analyze GitHub issues and tasks with powerful filtering, reporting, and 27 analytics widgets. Connect any repository and get actionable insights instantly.",
  image = "/og-image.png",
  url,
}: SEOProps) {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = url || siteUrl;
  const ogImage = image.startsWith("http") ? image : `${siteUrl}${image}`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
}
