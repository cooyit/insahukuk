// Iletisim formu: dogrulama HTML'de (tarayici gecersiz formda "submit" olayini hic baslatmaz).
// Sunucu ucu henuz yok (acik soru S1). Gecerli gonderim durdurulur ve durum alanina "gonderilmedi"
// yazilir; sahte "gonderildi" mesaji gosterilmez. Uc yazilinca bu dosya silinir, form dogrudan
// action adresine gider.
for (const form of document.querySelectorAll<HTMLFormElement>('form[data-iletisim-formu]')) {
  const durum = form.querySelector<HTMLElement>('[data-form-durum]');
  form.addEventListener('submit', (olay) => {
    olay.preventDefault();
    if (durum) durum.textContent = durum.dataset.mesaj ?? '';
  });
}
