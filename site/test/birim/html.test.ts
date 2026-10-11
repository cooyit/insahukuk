import { describe, expect, it } from 'vitest';
import { duzMetin, htmlTemizle } from '../../src/lib/html';

describe('kural: zengin metin derlemede izin listesiyle temizlenir (XSS)', () => {
  it('<script> icerigiyle birlikte silinir', () => {
    expect(htmlTemizle('<p>a</p><script>alert(1)</script><p>b</p>')).toBe('<p>a</p><p>b</p>');
  });

  it('onclick gibi olay nitelikleri silinir', () => {
    expect(htmlTemizle('<p onclick="alert(1)" onmouseover="x()">metin</p>')).toBe('<p>metin</p>');
  });

  it('javascript:, data: ve //baska-alan baglantilari silinir', () => {
    expect(htmlTemizle('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
    expect(htmlTemizle('<a href="JaVaScRiPt:alert(1)">x</a>')).toBe('<a>x</a>');
    expect(htmlTemizle('<a href="data:text/html,<script>alert(1)</script>">x</a>')).toBe('<a>x</a>');
    expect(htmlTemizle('<a href="//kotu.example/">x</a>')).toBe('<a>x</a>');
  });

  it('style, iframe, img, form gibi izinli olmayanlar silinir', () => {
    expect(htmlTemizle('<p style="color:red">a</p>')).toBe('<p>a</p>');
    expect(htmlTemizle('<iframe src="https://x.example"></iframe><p>a</p>')).toBe('<p>a</p>');
    expect(htmlTemizle('<img src="https://x.example/a.png" alt="a"><p>a</p>')).toBe('<p>a</p>');
    expect(htmlTemizle('<form action="/x"><input name="a"></form>')).toBe('');
  });

  it('izinli etiketler ve guvenli baglantilar kalir', () => {
    const html =
      '<h2>Baslik</h2><p><strong>kalin</strong> <em>egik</em> <a href="https://ornek.example/a">dis</a> <a href="/ekip">ic</a> <a href="mailto:a@b.example">posta</a></p>' +
      '<ul><li>bir</li></ul><ol start="2"><li>iki</li></ol><blockquote>alinti</blockquote>' +
      '<table><thead><tr><th scope="col">A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>';
    expect(htmlTemizle(html)).toBe(html);
  });

  it('icerikteki h1 h2 olur (sayfanin tek h1 kurali)', () => {
    expect(htmlTemizle('<h1>Buyuk</h1>')).toBe('<h2>Buyuk</h2>');
  });

  it('bos ve null deger bos metin verir', () => {
    expect(htmlTemizle(null)).toBe('');
    expect(htmlTemizle(undefined)).toBe('');
  });

  it('duz metin: HTML varliklari cozulur (Astro tekrar kacirir; cift kacis olmasin)', () => {
    expect(duzMetin('<p>Kira &amp; Tahliye</p>')).toBe('Kira & Tahliye');
    expect(duzMetin('<p>a &lt;b&gt; &quot;c&quot; &#39;d&#39;</p>')).toBe('a <b> "c" \'d\'');
    expect(duzMetin('&amp;lt;')).toBe('&lt;');
  });

  it('duz metin: etiketler atilir, bosluk sadelesir', () => {
    expect(duzMetin('<h2>Baş</h2>\n<p>ilk   paragraf</p><script>x</script>')).toBe('Baş ilk paragraf');
  });
});
