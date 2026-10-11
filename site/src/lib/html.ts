// Zengin metin (biyografi, makale, sayfa, karar metni) Directus editorunden HTML olarak gelir.
// Derleme aninda izin listesiyle temizlenir: ele gecirilmis bir editor hesabi statik siteye
// script yerlestiremesin (docs/inceleme-2026-10-09.md 4.3).
import sanitizeHtml from 'sanitize-html';

const AYARLAR: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'h2', 'h3', 'h4', 'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup',
    'blockquote', 'ul', 'ol', 'li', 'a', 'hr', 'code', 'pre',
    'table', 'caption', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'lang', 'hreflang'],
    ol: ['start'],
    th: ['scope', 'colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  // javascript:, data: ve '//baska.site' gibi adresler silinir; site ici '/...' kalir.
  allowedSchemes: ['https', 'http', 'mailto', 'tel'],
  allowProtocolRelative: false,
  // Sayfanin tek h1'i sablonda; icerikteki h1 bir alt seviyeye iner.
  transformTags: { h1: 'h2' },
  // Gorseller bilerek yok: editordeki gorsel Directus /assets adresini gosterir; canli sitede
  // bu adres kullanilmayacak (inceleme 4.3). Gerekirse ileride dist'e kopyalanan dosyayla eklenir.
};

export function htmlTemizle(html: string | null | undefined): string {
  return html ? sanitizeHtml(html, AYARLAR) : '';
}

// Meta description gibi duz metin isteyen yerler icin: etiketleri atar, boslugu sadelestirir.
// sanitize-html cikisi HTML varligi tasir ('&amp;'); Astro metni zaten kendisi kacirdigi icin
// varliklar burada cozulur, yoksa sayfada "&amp;amp;" gorunur. '&amp;' en son: '&amp;lt;' -> '&lt;'.
export function duzMetin(html: string | null | undefined): string {
  if (!html) return '';
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
