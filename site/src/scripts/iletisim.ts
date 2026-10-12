// Iletisim formu: dogrulama HTML'de (tarayici gecersiz formda "submit" olayini hic baslatmaz).
// Betik formu sayfa degistirmeden form servisine (panel/form) gonderir ve sunucunun gercek yanitini
// ("mesaj") durum alanina yazar. Basari metni sitede yok: yalnizca sunucu kaydi yazdiktan sonra
// gelir. Sunucuya ulasilamazsa ya da yanit beklenen JSON degilse "iletilemedi" denir. Betik yoksa form
// ayni adrese normal gonderilir.
for (const form of document.querySelectorAll<HTMLFormElement>('form[data-iletisim-formu]')) {
  const durum = form.querySelector<HTMLElement>('[data-form-durum]')!;
  const dugme = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  form.addEventListener('submit', async (olay) => {
    olay.preventDefault();
    const govde = new URLSearchParams();
    for (const [ad, deger] of new FormData(form)) govde.append(ad, String(deger));
    dugme.disabled = true;
    durum.textContent = durum.dataset.gonderiliyor ?? '';
    try {
      const yanit = await fetch(form.action, { method: 'POST', headers: { accept: 'application/json' }, body: govde });
      const sonuc = (await yanit.json()) as { tamam?: boolean; mesaj?: unknown };
      if (typeof sonuc?.mesaj !== 'string') throw new Error('beklenmeyen yanit');
      durum.textContent = sonuc.mesaj;
      if (yanit.ok && sonuc.tamam) form.reset();
    } catch {
      durum.textContent = durum.dataset.hata ?? '';
    } finally {
      dugme.disabled = false;
    }
  });
}
