import { beforeAll, describe, expect, it } from 'vitest';
import { distVarMi, etiketler, gorunenMetin, htmlSayfalari, nitelik, yolVarMi, type Sayfa } from './dist';

let sayfalar: Sayfa[] = [];
const sayfa = (yol: string) => sayfalar.find((s) => s.yol === yol)!;
const main = (s: Sayfa) => s.html.match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? '';

beforeAll(() => {
  if (!distVarMi()) throw new Error('dist/ yok: once "npm run build" calistirin');
  sayfalar = htmlSayfalari();
});

describe('kural: taslak, incelemede, arsiv ve ileri tarihli yayin sitede yok', () => {
  it('bu yayinlarin sayfasi uretilmez ve listede gecmez', () => {
    const gizliler = {
      'gayrimenkul-hukukunda-guncel-sorunlar': 'Gayrimenkul Hukukunda Güncel Sorunlar', // taslak
      'idari-para-cezalarina-itiraz': 'İdari Para Cezalarına İtiraz', // incelemede
      'eski-mevzuata-gore-kira-artisi': 'Eski Mevzuata Göre Kira Artışı', // arsiv
      'nafaka-uyusmazliklarinda-yeni-donem': 'Nafaka Uyuşmazlıklarında Yeni Dönem', // 2027
    };
    for (const [slug, baslik] of Object.entries(gizliler)) {
      expect(yolVarMi(`/yayinlar/${slug}`), slug).toBe(false);
      for (const s of sayfalar) expect(gorunenMetin(s.html), `${s.yol}: ${baslik}`).not.toContain(baslik);
    }
  });

  it('TR listede tam 10, EN listede tam 4 yayin (JS kapaliyken hepsi gorunur)', () => {
    expect(etiketler(main(sayfa('/yayinlar')), 'li').filter((e) => e.includes('data-filtre-oge')).length).toBe(10);
    expect(etiketler(main(sayfa('/en/publications')), 'li').filter((e) => e.includes('data-filtre-oge')).length).toBe(4);
  });

  it('EN cevirisi hazir olmayan yayinin EN sayfasi yok', () => {
    expect(yolVarMi('/en/publications/reasonable-time-in-criminal-proceedings')).toBe(false);
  });
});

describe('kural: JS en az; filtre formu JS olmadan gizli', () => {
  it('filtre formu "hidden" ile gelir, liste ogeleri gizli gelmez', () => {
    const form = etiketler(sayfa('/yayinlar').html, 'form')[0];
    expect(form).toMatch(/\shidden[\s>]/);
    expect(etiketler(main(sayfa('/yayinlar')), 'li').some((e) => /\shidden[\s>]/.test(e))).toBe(false);
  });
});

describe('kural: yayin detayi ture gore degisir', () => {
  it('makale: icerik var', () => {
    expect(main(sayfa('/yayinlar/kira-bedelinin-tespiti-davalarinda-guncel-durum'))).toContain('<h2>I. Giriş</h2>');
  });

  it('kitap: yayinevi ve ISBN kunyesi', () => {
    const metin = gorunenMetin(main(sayfa('/yayinlar/kira-uyusmazliklarinda-arabuluculuk')));
    expect(metin).toContain('ISBN 9780306406157');
    expect(metin).toContain('Yayınevi Örnek Yayınevi');
  });

  it('video: gomme yok, yalnizca dis baglanti', () => {
    const html = main(sayfa('/yayinlar/arabuluculuk-sureci-nasil-isler'));
    expect(html).not.toMatch(/<(iframe|video|embed|object)\b/);
    const dis = etiketler(html, 'a').find((e) => nitelik(e, 'href') === 'https://video.example.org/arabuluculuk-sureci');
    expect(dis).toBeDefined();
    expect(nitelik(dis!, 'rel')).toContain('noreferrer');
  });

  it('haber: kaynak adi ve dis baglanti', () => {
    const metin = gorunenMetin(main(sayfa('/yayinlar/kira-artis-oranina-iliskin-degerlendirme')));
    expect(metin).toContain('Kaynak: Örnek Gazete');
  });

  it('PDF eki indirilebilir baglanti olarak var', () => {
    const html = main(sayfa('/yayinlar/velayet-duzenlemesinde-cocugun-yarari'));
    const ek = etiketler(html, 'a').find((e) => (nitelik(e, 'href') ?? '').endsWith('.pdf'));
    expect(ek).toBeDefined();
    expect(nitelik(ek!, 'download')).toBe('velayet-duzenlemesi-ornek-ek.pdf');
  });
});

describe('kural: pasif yazarin adi yazilir, profiline baglanti verilmez', () => {
  it('yayin 14: Deniz Ünal baglantisiz, Mehmet Kaya bagli', () => {
    const html = main(sayfa('/yayinlar/temerrut-nedeniyle-tahliye'));
    expect(gorunenMetin(html)).toContain('Deniz Ünal');
    expect(html).not.toContain('/ekip/deniz-unal');
    expect(html).toContain('href="/ekip/mehmet-kaya"');
  });

  it('dis yazar unvaniyla yazilir, baglanti yok', () => {
    const metin = gorunenMetin(main(sayfa('/yayinlar/kira-bedelinin-tespiti-davalarinda-guncel-durum')));
    expect(metin).toContain('Can Öztürk (Dr. Öğr. Üyesi, Örnek Üniversitesi)');
  });
});

describe('kural: zengin metin temizlenmis olarak sayfaya ulasir', () => {
  it('yayin 3 sayfasinda tek h1 ve editorun h1\'i h2 olmus', () => {
    const html = sayfa('/yayinlar/imar-plani-degisikliklerine-itiraz').html;
    expect(html).toContain('<h2>Editörün yanlışlıkla eklediği büyük başlık</h2>');
    expect(html).not.toContain('alert(');
  });
});
