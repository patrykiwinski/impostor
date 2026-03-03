const stan = {
  kategorie: [],
  wybranaKategoria: null,
  wybraneHaslo: null,
  liczbaGraczy: 0,
  liczbaImpostorow: 0,
  czyImpostorWidziKategorie: true,
  czyImpostorWidziPodpowiedz: true,
  indeksyImpostorow: new Set(),
  aktualnyGracz: 0,
  czyPrzeciaganieAktywne: false,
  czyByloPrzeciagniecie: false,
  aktywnyPointerId: null,
  startY: 0,
  przesuniecieY: 0,
  uzyteHasla: new Set(),
};

const ekranUstawien = document.getElementById("setup-screen");
const ekranGracza = document.getElementById("player-screen");
const ekranKonca = document.getElementById("end-screen");

const listaKategorii = document.getElementById("listaKategorii");
const inputLiczbaGraczy = document.getElementById("playersInput");
const inputLiczbaImpostorow = document.getElementById("impostorsInput");
const switchImpostorKategoria = document.getElementById("impostorCategorySwitch");
const switchImpostorPodpowiedz = document.getElementById("impostorHintSwitch");
const bladUstawien = document.getElementById("setupError");
const wybraneKategorieInfo = document.getElementById("wybraneKategorieInfo");
const przyciskOpenKategorie = document.getElementById("openKategorieBtn");
const przyciskCloseKategorie = document.getElementById("closeKategorieBtn");
const przyciskZaznaczWszystkie = document.getElementById("zaznaczWszystkieBtn");
const przyciskWyczyscKategorie = document.getElementById("wyczyscKategorieBtn");
const przyciskKoniecSesji = document.getElementById("endSessionBtn");
const kategorieOverlay = document.getElementById("kategorieOverlay");
const kategorieSheet = document.getElementById("kategorieSheet");

const tytulGracza = document.getElementById("playerTitle");
const kartaSekretu = document.getElementById("secretCard");
const sekretTekst = document.getElementById("sekretTekst");
const zaslonaKarty = document.getElementById("zaslonaKarty");
const przyciskNastepny = document.getElementById("nextBtn");

const przyciskStart = document.getElementById("startBtn");
const przyciskRestart = document.getElementById("restartBtn");

const MAKS_PRZESUNIECIE = 0.85;
const MIN_PRZESUNIECIE_AKTYWACJI = 12;
const KLUCZ_UZYTE_HASLA = "impostor_uzyte_hasla_v1";

uruchom();
podepnijPrzeciaganie();
podepnijPanelKategorii();
ustawWymiaryEkranu();
window.addEventListener("resize", ustawWymiaryEkranu);
window.addEventListener("orientationchange", ustawWymiaryEkranu);

async function uruchom() {
  try {
    const odpowiedzData = await fetch("./data.json");
    const dane = await odpowiedzData.json();
    stan.kategorie = dane.categories || [];
    wczytajUzyteHasla();
    uzupelnijKategorie();
    aktualizujWidocznoscPrzyciskuKategorii();
  } catch {
    bladUstawien.textContent = "Nie udało się wczytać danych";
  }
}

function uzupelnijKategorie() {
  listaKategorii.innerHTML = "";

  stan.kategorie.forEach((kategoria, indeks) => {
    const etykieta = document.createElement("label");
    etykieta.className = "kategoria-opcja";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "kategoria-checkbox";
    checkbox.value = String(indeks);
    checkbox.checked = true;
    checkbox.addEventListener("change", aktualizujInfoKategorii);

    const tekst = document.createElement("span");
    tekst.textContent = kategoria.name;

    etykieta.appendChild(checkbox);
    etykieta.appendChild(tekst);
    listaKategorii.appendChild(etykieta);
  });

  aktualizujInfoKategorii();
}

przyciskStart.addEventListener("click", () => {
  bladUstawien.textContent = "";

  const liczbaGraczy = Number(inputLiczbaGraczy.value);
  const liczbaImpostorow = Number(inputLiczbaImpostorow.value);
  const zaznaczoneIndeksy = pobierzZaznaczoneKategorie();

  if (!Number.isInteger(liczbaGraczy) || liczbaGraczy < 3) {
    bladUstawien.textContent = "Liczba graczy musi wynosić minimum 3.";
    return;
  }

  if (!Number.isInteger(liczbaImpostorow) || liczbaImpostorow < 1) {
    bladUstawien.textContent = "Liczba impostorów musi wynosić minimum 1.";
    return;
  }

  if (liczbaImpostorow >= liczbaGraczy) {
    bladUstawien.textContent = "Impostorów musi być mniej niż graczy.";
    return;
  }

  if (zaznaczoneIndeksy.length === 0) {
    bladUstawien.textContent = "Wybierz przynajmniej jedną kategorię.";
    return;
  }

  const dostepneKategorie = zaznaczoneIndeksy
    .map((indeks) => stan.kategorie[indeks])
    .filter((kategoria) => kategoria && Array.isArray(kategoria.entries) && kategoria.entries.length > 0);

  if (dostepneKategorie.length === 0) {
    bladUstawien.textContent = "Zaznaczone kategorie nie mają haseł.";
    return;
  }

  const dostepneHasla = dostepneKategorie.flatMap((kategoria) =>
    kategoria.entries
      .filter((haslo) => !czyHasloByloUzyte(kategoria.name, haslo.word))
      .map((haslo) => ({ kategoria, haslo })),
  );

  if (dostepneHasla.length === 0) {
    bladUstawien.textContent = "W tej sesji nie ma już nowych haseł. Kliknij Koniec sesji.";
    return;
  }

  const wybranyZestaw = losujElement(dostepneHasla);

  stan.liczbaGraczy = liczbaGraczy;
  stan.liczbaImpostorow = liczbaImpostorow;
  stan.czyImpostorWidziKategorie = Boolean(switchImpostorKategoria.checked);
  stan.czyImpostorWidziPodpowiedz = Boolean(switchImpostorPodpowiedz.checked);
  stan.wybranaKategoria = wybranyZestaw.kategoria;
  stan.wybraneHaslo = wybranyZestaw.haslo;
  stan.indeksyImpostorow = wylosujImpostorow(liczbaGraczy, liczbaImpostorow);
  stan.aktualnyGracz = 0;
  oznaczHasloJakoUzyte(stan.wybranaKategoria.name, stan.wybraneHaslo.word);

  pokazEkranGracza();
  renderujGracza();
});

przyciskNastepny.addEventListener("click", () => {
  if (!stan.czyByloPrzeciagniecie) {
    return;
  }

  stan.aktualnyGracz += 1;

  if (stan.aktualnyGracz >= stan.liczbaGraczy) {
    pokazEkranKonca();
    return;
  }

  renderujGracza();
});

przyciskRestart.addEventListener("click", () => {
  pokazEkranUstawien();
});

przyciskKoniecSesji.addEventListener("click", () => {
  const pierwszePotwierdzenie = window.confirm(
    "Czy na pewno chcesz zakończyć sesję i wyczyścić historię haseł?",
  );
  if (!pierwszePotwierdzenie) {
    return;
  }

  const drugiePotwierdzenie = window.confirm("Potwierdź ponownie: zakończyć sesję?");
  if (!drugiePotwierdzenie) {
    return;
  }

  stan.uzyteHasla.clear();
  zapiszUzyteHasla();
  bladUstawien.textContent = "Sesja zakończona. Historia haseł została wyczyszczona.";
});

function podepnijPrzeciaganie() {
  zaslonaKarty.addEventListener("pointerdown", rozpocznijPrzeciaganie);
  window.addEventListener("pointermove", przeciagaj);
  window.addEventListener("pointerup", zakonczPrzeciaganie);
  window.addEventListener("pointercancel", zakonczPrzeciaganie);
}

function podepnijPanelKategorii() {
  przyciskOpenKategorie.addEventListener("click", otworzPanelKategorii);
  przyciskCloseKategorie.addEventListener("click", zamknijPanelKategorii);
  kategorieOverlay.addEventListener("click", zamknijPanelKategorii);

  przyciskZaznaczWszystkie.addEventListener("click", () => {
    ustawZaznaczenieWszystkich(true);
  });

  przyciskWyczyscKategorie.addEventListener("click", () => {
    ustawZaznaczenieWszystkich(false);
  });
}

function rozpocznijPrzeciaganie(zdarzenie) {
  stan.czyPrzeciaganieAktywne = true;
  stan.aktywnyPointerId = zdarzenie.pointerId;
  stan.startY = zdarzenie.clientY;
  stan.przesuniecieY = 0;

  zaslonaKarty.classList.add("chwycona");
  zaslonaKarty.style.transition = "none";
}

function przeciagaj(zdarzenie) {
  if (!stan.czyPrzeciaganieAktywne || zdarzenie.pointerId !== stan.aktywnyPointerId) {
    return;
  }

  const wysokoscKarty = kartaSekretu.clientHeight;
  const maksPrzesuniecie = wysokoscKarty * MAKS_PRZESUNIECIE;
  const surowePrzesuniecie = stan.startY - zdarzenie.clientY;

  stan.przesuniecieY = ogranicz(surowePrzesuniecie, 0, maksPrzesuniecie);
  ustawPrzesuniecieZaslony(stan.przesuniecieY);
}

function zakonczPrzeciaganie(zdarzenie) {
  if (!stan.czyPrzeciaganieAktywne || zdarzenie.pointerId !== stan.aktywnyPointerId) {
    return;
  }

  stan.czyPrzeciaganieAktywne = false;
  stan.aktywnyPointerId = null;
  zaslonaKarty.classList.remove("chwycona");

  const czyBylRuch = stan.przesuniecieY >= MIN_PRZESUNIECIE_AKTYWACJI;
  if (czyBylRuch) {
    stan.czyByloPrzeciagniecie = true;
    odblokujNastepnyPrzycisk();
  }

  przywrocZaslone();
}

function przywrocZaslone() {
  stan.przesuniecieY = 0;
  zaslonaKarty.style.transition = "transform 0.2s ease-out";

  requestAnimationFrame(() => {
    ustawPrzesuniecieZaslony(0);
  });
}

function renderujGracza() {
  const czyImpostor = stan.indeksyImpostorow.has(stan.aktualnyGracz);

  if (czyImpostor) {
    const fragmenty = [];

    if (stan.czyImpostorWidziKategorie) {
      fragmenty.push(`Kategoria: ${stan.wybranaKategoria.name}`);
    }

    if (stan.czyImpostorWidziPodpowiedz) {
      const podpowiedz = losujPodpowiedz(stan.wybraneHaslo.hints);
      fragmenty.push(`Podpowiedź: ${podpowiedz}`);
    }

    const trescImpostora = fragmenty.length > 0 ? fragmenty.join(" | ") : "brak podpowiedzi";
    sekretTekst.innerHTML = `IMPOSTOR<br>${trescImpostora}`;
  } else {
    sekretTekst.textContent = stan.wybraneHaslo.word;
  }

  stan.czyPrzeciaganieAktywne = false;
  stan.czyByloPrzeciagniecie = false;
  stan.aktywnyPointerId = null;
  stan.przesuniecieY = 0;

  tytulGracza.textContent = `Gracz ${stan.aktualnyGracz + 1}`;

  zaslonaKarty.classList.remove("hidden", "chwycona");
  zaslonaKarty.textContent = "Przeciągnij w górę";
  zaslonaKarty.style.transition = "transform 0.2s ease-out";
  ustawPrzesuniecieZaslony(0);

  ustawKolorZaslonyGracza(stan.aktualnyGracz);
  przyciskNastepny.classList.remove("hidden");
  zablokujNastepnyPrzycisk();
}

function zablokujNastepnyPrzycisk() {
  przyciskNastepny.disabled = true;
  przyciskNastepny.classList.add("disabled");
}

function odblokujNastepnyPrzycisk() {
  przyciskNastepny.disabled = false;
  przyciskNastepny.classList.remove("disabled");
}

function ustawPrzesuniecieZaslony(przesuniecieY) {
  zaslonaKarty.style.transform = `translateY(-${przesuniecieY}px)`;
}

function ogranicz(wartosc, min, max) {
  return Math.min(Math.max(wartosc, min), max);
}

function pobierzZaznaczoneKategorie() {
  return Array.from(listaKategorii.querySelectorAll(".kategoria-checkbox:checked")).map((element) =>
    Number(element.value),
  );
}

function pobierzNazwyZaznaczonychKategorii() {
  return pobierzZaznaczoneKategorie()
    .map((indeks) => stan.kategorie[indeks])
    .filter(Boolean)
    .map((kategoria) => kategoria.name);
}

function aktualizujInfoKategorii() {
  const nazwy = pobierzNazwyZaznaczonychKategorii();

  if (nazwy.length === 0) {
    wybraneKategorieInfo.textContent = "Brak zaznaczonych kategorii";
    return;
  }

  wybraneKategorieInfo.textContent = `${nazwy.length} wybrane: ${nazwy.join(", ")}`;
}

function ustawZaznaczenieWszystkich(czyZaznaczyc) {
  listaKategorii.querySelectorAll(".kategoria-checkbox").forEach((element) => {
    element.checked = czyZaznaczyc;
  });

  aktualizujInfoKategorii();
}

function otworzPanelKategorii() {
  document.body.classList.add("blokada-scroll");
  przyciskOpenKategorie.classList.add("ukryty");
  kategorieOverlay.classList.remove("hidden");
  kategorieSheet.classList.remove("hidden");
}

function zamknijPanelKategorii() {
  document.body.classList.remove("blokada-scroll");
  kategorieOverlay.classList.add("hidden");
  kategorieSheet.classList.add("hidden");
  aktualizujWidocznoscPrzyciskuKategorii();
}

function pokazEkranUstawien() {
  zamknijPanelKategorii();
  ekranUstawien.classList.remove("hidden");
  ekranGracza.classList.add("hidden");
  ekranKonca.classList.add("hidden");
  aktualizujWidocznoscPrzyciskuKategorii();
}

function pokazEkranGracza() {
  zamknijPanelKategorii();
  ekranUstawien.classList.add("hidden");
  ekranGracza.classList.remove("hidden");
  ekranKonca.classList.add("hidden");
  aktualizujWidocznoscPrzyciskuKategorii();
}

function pokazEkranKonca() {
  zamknijPanelKategorii();
  ekranUstawien.classList.add("hidden");
  ekranGracza.classList.add("hidden");
  ekranKonca.classList.remove("hidden");
  aktualizujWidocznoscPrzyciskuKategorii();
}

function losujElement(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function losujPodpowiedz(podpowiedzi) {
  if (!Array.isArray(podpowiedzi) || podpowiedzi.length === 0) {
    return "brak";
  }

  return podpowiedzi[Math.floor(Math.random() * podpowiedzi.length)];
}

function wylosujImpostorow(liczbaGraczy, liczbaImpostorow) {
  const pula = Array.from({ length: liczbaGraczy }, (_, i) => i);
  const wybrani = new Set();

  while (wybrani.size < liczbaImpostorow) {
    const indeks = Math.floor(Math.random() * pula.length);
    wybrani.add(pula[indeks]);
    pula.splice(indeks, 1);
  }

  return wybrani;
}

function ustawWymiaryEkranu() {
  const vh = window.innerHeight * 0.01;
  const vw = window.innerWidth * 0.01;

  document.documentElement.style.setProperty("--vh", `${vh}px`);
  document.documentElement.style.setProperty("--vw", `${vw}px`);
}

function aktualizujWidocznoscPrzyciskuKategorii() {
  const czyEkranUstawien = !ekranUstawien.classList.contains("hidden");
  const czyPanelKategoriiOtwarty = !kategorieSheet.classList.contains("hidden");

  if (czyEkranUstawien && !czyPanelKategoriiOtwarty) {
    przyciskOpenKategorie.classList.remove("ukryty");
  } else {
    przyciskOpenKategorie.classList.add("ukryty");
  }
}

function ustawKolorZaslonyGracza(indeksGracza) {
  const hue = (indeksGracza * 57 + 210) % 360;
  const jasny = `hsl(${hue}, 70%, 22%)`;
  const ciemny = `hsl(${hue}, 76%, 14%)`;
  zaslonaKarty.style.background = `linear-gradient(180deg, ${jasny}, ${ciemny})`;
}

function kluczHasla(nazwaKategorii, slowo) {
  const kategoria = String(nazwaKategorii || "").trim().toLowerCase();
  const haslo = String(slowo || "").trim().toLowerCase();
  return `${kategoria}|${haslo}`;
}

function czyHasloByloUzyte(nazwaKategorii, slowo) {
  return stan.uzyteHasla.has(kluczHasla(nazwaKategorii, slowo));
}

function oznaczHasloJakoUzyte(nazwaKategorii, slowo) {
  stan.uzyteHasla.add(kluczHasla(nazwaKategorii, slowo));
  zapiszUzyteHasla();
}

function wczytajUzyteHasla() {
  try {
    const surowe = localStorage.getItem(KLUCZ_UZYTE_HASLA);
    if (!surowe) {
      stan.uzyteHasla = new Set();
      return;
    }

    const lista = JSON.parse(surowe);
    if (Array.isArray(lista)) {
      stan.uzyteHasla = new Set(lista.filter((element) => typeof element === "string"));
    } else {
      stan.uzyteHasla = new Set();
    }
  } catch {
    stan.uzyteHasla = new Set();
  }
}

function zapiszUzyteHasla() {
  try {
    localStorage.setItem(KLUCZ_UZYTE_HASLA, JSON.stringify(Array.from(stan.uzyteHasla)));
  } catch {
    // Brak miejsca w localStorage lub niedostępna pamięć.
  }
}
