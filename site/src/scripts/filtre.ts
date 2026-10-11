// Liste filtreleri (yayinlar, kararlar). Sitedeki tek istemci betigi.
// JS yoksa form "hidden" kalir ve butun liste gorunur; JS varsa form acilir.
//
// Sozlesme: <form data-filtre="liste-id" data-sayi-sablonu="{n} ..." data-sonuc-yok="...">
// icinde <select name="x">; listede <li data-filtre-oge data-x="1 2"> (bosluklu deger listesi).
// Bir oge, secili her filtrenin degerini kendi listesinde tasiyorsa gorunur.

function filtreyiKur(form: HTMLFormElement): void {
  const liste = document.getElementById(form.dataset.filtre ?? '');
  const durum = form.querySelector<HTMLElement>('[data-filtre-durum]');
  if (!liste || !durum) return;

  const ogeler = [...liste.querySelectorAll<HTMLElement>('[data-filtre-oge]')];
  const secimler = [...form.querySelectorAll<HTMLSelectElement>('select')];
  const sablon = form.dataset.sayiSablonu ?? '{n}';
  const sonucYok = form.dataset.sonucYok ?? '';

  function uygula(): void {
    let gorunen = 0;
    for (const oge of ogeler) {
      const uygun = secimler.every((s) => !s.value || (oge.dataset[s.name] ?? '').split(' ').includes(s.value));
      oge.hidden = !uygun;
      if (uygun) gorunen++;
    }
    durum!.textContent = gorunen === 0 ? sonucYok : sablon.replace('{n}', String(gorunen));
  }

  form.addEventListener('change', uygula);
  // "reset" olayi degerler sifirlanmadan once gelir; bir sonraki turda uygula.
  form.addEventListener('reset', () => setTimeout(uygula));
  form.addEventListener('submit', (olay) => olay.preventDefault());
  form.hidden = false;
  uygula();
}

document.querySelectorAll<HTMLFormElement>('form[data-filtre]').forEach(filtreyiKur);
