import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: object;
}

export function SEO({
  title,
  description,
  keywords,
  canonical,
  ogImage = "https://resumeiq.ai/opengraph.jpg",
  ogType = "website",
  structuredData,
}: SEOProps) {
  useEffect(() => {
    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    if (keywords) setMeta("name", "keywords", keywords);

    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:url", canonical || window.location.href);

    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", ogImage);

    if (canonical) {
      let linkEl = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
      if (!linkEl) {
        linkEl = document.createElement("link");
        linkEl.setAttribute("rel", "canonical");
        document.head.appendChild(linkEl);
      }
      linkEl.setAttribute("href", canonical);
    }

    if (structuredData) {
      let scriptEl = document.querySelector("script[data-seo-ld]") as HTMLScriptElement;
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.setAttribute("type", "application/ld+json");
        scriptEl.setAttribute("data-seo-ld", "true");
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(structuredData);
    }

    return () => {
      document.title = "ResumeIQ — Free AI Resume Analyzer, ATS Checker & Job Match Tool";
    };
  }, [title, description, keywords, canonical, ogImage, ogType, structuredData]);

  return null;
}
