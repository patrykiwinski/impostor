/** Osi gry — edytuj tutaj (dataKolo.json to kopia referencyjna). */
const OSIE_KOLO = [
  { left: "Tanie", right: "Drogie" },
  { left: "Zimne", right: "Gorące" },
  { left: "Ciche", right: "Głośne" },
  { left: "Słodkie", right: "Słone" },
  { left: "Stare", right: "Nowe" },
  { left: "Proste", right: "Skomplikowane" },
  { left: "Lekkie", right: "Ciężkie" },
  { left: "Miękkie", right: "Twarde" },
  { left: "Wolne", right: "Szybkie" },
  { left: "Małe", right: "Duże" },
  { left: "Nudne", right: "Ekscytujące" },
  { left: "Niebezpieczne", right: "Bezpieczne" },
  { left: "Szalone", right: "Normalne" },
  { left: "Niezdrowe", right: "Zdrowe" },
  { left: "Niepopularne", right: "Popularne" },
  { left: "Niesmaczne", right: "Pyszne" },
  { left: "Brzydkie", right: "Piękne" },
  { left: "Trudne", right: "Łatwe" },
  { left: "Mokre", right: "Suche" },
  { left: "Ciemne", right: "Jasne" },
  { left: "Wiejskie", right: "Miejskie" },
  { left: "Formalne", right: "Casual" },
  { left: "Tradycyjne", right: "Nowoczesne" },
  { left: "Samotne", right: "Towarzyskie" },
  { left: "Introwertyczne", right: "Ekstrawertyczne" },
];

const TARCZA = {
  cx: 160,
  cy: 175,
  promien: 130,
  promienKreski: 118,
  promienNumerow: 98,
  promienIgly: 108,
};

const stan = {
  osie: OSIE_KOLO,
  aktualnaOs: null,
  cel: 0,
  pozycjaPartnera: 5,
  faza: 1,
  runda: 0,
  wymuszonyObrot: false,
  przeciaganie: false,
  pointerId: null,
};

const appRoot = document.getElementById("app-root");
const ekranGry = document.getElementById("ekran-gry");
const ekranBlad = document.getElementById("ekran-blad");
const labelLewy = document.getElementById("label-lewy");
const labelPrawy = document.getElementById("label-prawy");
const tarczaWrap = document.getElementById("tarcza-wrap");
const tarczaSvg = document.getElementById("tarcza-svg");
const tarczaKreski = document.getElementById("tarcza-kreski");
const tarczaNumery = document.getElementById("tarcza-numery");
const lukTlo = document.getElementById("tarcza-luk-tlo");
const lukKolor = document.getElementById("tarcza-luk-kolor");
const iglaCel = document.getElementById("igla-cel");
const iglaPartner = document.getElementById("igla-partner");
const tarczaWartosc = document.getElementById("tarcza-wartosc");
const fazaInfo = document.getElementById("faza-info");
const sekcjaAkcji = document.getElementById("sekcja-akcji");
const sekcjaWynik = document.getElementById("sekcja-wynik");
const wynikOpis = document.getElementById("wynik-opis");
const wynikCel = document.getElementById("wynik-cel");
const wynikPartner = document.getElementById("wynik-partner");
const rundaBadge = document.getElementById("runda-badge");
const btnDalej = document.getElementById("btn-dalej");
const btnZatwierdz = document.getElementById("btn-zatwierdz");
const btnNastepna = document.getElementById("btn-nastepna");
const btnObrot = document.getElementById("btn-obrot");

ustawWymiaryEkranu();
window.addEventListener("resize", ustawWymiaryEkranu);
window.addEventListener("orientationchange", ustawWymiaryEkranu);

btnDalej.addEventListener("click", () => przejdzDoFazy(2));
btnZatwierdz.addEventListener("click", zatwierdzWynik);
btnNastepna.addEventListener("click", rozpocznijRunde);
btnObrot.addEventListener("click", przelaczObrot);

tarczaSvg.addEventListener("pointerdown", rozpocznijPrzeciaganie);
window.addEventListener("pointermove", przeciagaj);
window.addEventListener("pointerup", zakonczPrzeciaganie);
window.addEventListener("pointercancel", zakonczPrzeciaganie);

uruchom();

function uruchom() {
  if (stan.osie.length === 0) {
    ekranGry.classList.add("hidden");
    ekranBlad.classList.remove("hidden");
    return;
  }

  zbudujTarcze();
  rozpocznijRunde();
}

function zbudujTarcze() {
  const { cx, cy, promien, promienKreski, promienNumerow } = TARCZA;
  const sciezkaLuku = opisLuku(cx, cy, promien, Math.PI, 0);

  lukTlo.setAttribute("d", sciezkaLuku);
  lukKolor.setAttribute("d", sciezkaLuku);

  tarczaKreski.innerHTML = "";
  tarczaNumery.innerHTML = "";

  for (let i = 1; i <= 10; i += 1) {
    const kat = pozycjaNaKat(i);
    const x1 = cx + promienKreski * Math.cos(kat);
    const y1 = cy - promienKreski * Math.sin(kat);
    const dlugosc = i % 5 === 0 ? 16 : 10;
    const x2 = cx + (promienKreski - dlugosc) * Math.cos(kat);
    const y2 = cy - (promienKreski - dlugosc) * Math.sin(kat);

    const kreska = document.createElementNS("http://www.w3.org/2000/svg", "line");
    kreska.setAttribute("x1", x1);
    kreska.setAttribute("y1", y1);
    kreska.setAttribute("x2", x2);
    kreska.setAttribute("y2", y2);
    kreska.setAttribute("class", "tarcza-kreska" + (i === 1 || i === 5 || i === 10 ? " glowna" : ""));
    tarczaKreski.appendChild(kreska);

    const nx = cx + promienNumerow * Math.cos(kat);
    const ny = cy - promienNumerow * Math.sin(kat);
    const numer = document.createElementNS("http://www.w3.org/2000/svg", "text");
    numer.setAttribute("x", nx);
    numer.setAttribute("y", ny);
    numer.setAttribute("class", "tarcza-numer");
    numer.textContent = i;
    tarczaNumery.appendChild(numer);
  }
}

function opisLuku(cx, cy, promien, katStart, katKoniec) {
  const x1 = cx + promien * Math.cos(katStart);
  const y1 = cy - promien * Math.sin(katStart);
  const x2 = cx + promien * Math.cos(katKoniec);
  const y2 = cy - promien * Math.sin(katKoniec);
  return `M ${x1} ${y1} A ${promien} ${promien} 0 0 1 ${x2} ${y2}`;
}

function pozycjaNaKat(pozycja) {
  return Math.PI - ((pozycja - 1) / 9) * Math.PI;
}

function katNaPozycje(kat) {
  const znormalizowany = ogranicz(kat, 0, Math.PI);
  const surowa = 1 + ((Math.PI - znormalizowany) / Math.PI) * 9;
  return ogranicz(Math.round(surowa), 1, 10);
}

function ustawIgle(element, pozycja) {
  const { cx, cy, promienIgly } = TARCZA;
  const kat = pozycjaNaKat(pozycja);
  const x2 = cx + promienIgly * Math.cos(kat);
  const y2 = cy - promienIgly * Math.sin(kat);
  element.setAttribute("x1", cx);
  element.setAttribute("y1", cy);
  element.setAttribute("x2", x2);
  element.setAttribute("y2", y2);
}

function aktualizujTarcze() {
  ustawIgle(iglaCel, stan.cel);
  ustawIgle(iglaPartner, stan.pozycjaPartnera);

  iglaCel.classList.toggle("widoczna", stan.faza === 1 || stan.faza === 3);
  iglaPartner.classList.toggle("widoczna", stan.faza === 2 || stan.faza === 3);

  if (stan.faza === 1) {
    tarczaWartosc.textContent = stan.cel;
    tarczaWartosc.style.color = "";
  } else if (stan.faza === 2) {
    tarczaWartosc.textContent = stan.pozycjaPartnera;
  } else {
    tarczaWartosc.textContent = stan.pozycjaPartnera;
  }
}

function rozpocznijRunde() {
  stan.runda += 1;
  stan.aktualnaOs = losujElement(stan.osie);
  stan.cel = losujLiczbe(1, 10);
  stan.pozycjaPartnera = 5;
  przejdzDoFazy(1);
}

function przejdzDoFazy(faza) {
  stan.faza = faza;

  labelLewy.textContent = stan.aktualnaOs.left;
  labelPrawy.textContent = stan.aktualnaOs.right;
  rundaBadge.textContent = "Runda " + stan.runda;

  sekcjaAkcji.classList.add("hidden");
  sekcjaWynik.classList.add("hidden");
  btnDalej.classList.add("hidden");
  btnNastepna.classList.add("hidden");
  tarczaWrap.classList.remove("interaktywna");

  if (faza === 1) {
    fazaInfo.innerHTML =
      "<strong>Faza 1 — Medium</strong><br>Patrz na wylosowany cel, wymyśl słowo-podpowiedź i przekaż telefon partnerowi.";
    btnDalej.classList.remove("hidden");
    stan.pozycjaPartnera = 5;
  } else if (faza === 2) {
    fazaInfo.innerHTML =
      "<strong>Faza 2 — Partner</strong><br>Przesuń wskazówkę po tarczy, aby trafić w pozycję Medium. Cel jest ukryty.";
    sekcjaAkcji.classList.remove("hidden");
    tarczaWrap.classList.add("interaktywna");
    stan.pozycjaPartnera = 5;
  } else if (faza === 3) {
    pokazWynik();
  }

  aktualizujTarcze();
}

function pokazWynik() {
  const roznica = Math.abs(stan.cel - stan.pozycjaPartnera);
  let opis = "Cel Medium i wybór partnera.";

  if (roznica === 0) {
    opis = "Idealne trafienie!";
  } else if (roznica === 1) {
    opis = "Bardzo blisko — różnica o 1 stopień.";
  } else if (roznica === 2) {
    opis = "Całkiem blisko — różnica o 2 stopnie.";
  }

  fazaInfo.innerHTML = "<strong>Faza 3 — Wynik</strong><br>Odsłonięto obie wskazówki na tarczy.";
  sekcjaWynik.classList.remove("hidden");
  btnNastepna.classList.remove("hidden");

  wynikOpis.textContent = opis;
  wynikCel.textContent = "Cel Medium: " + stan.cel;
  wynikPartner.textContent = "Partner: " + stan.pozycjaPartnera;

  aktualizujTarcze();
}

function zatwierdzWynik() {
  przejdzDoFazy(3);
}

function rozpocznijPrzeciaganie(zdarzenie) {
  if (stan.faza !== 2) {
    return;
  }

  stan.przeciaganie = true;
  stan.pointerId = zdarzenie.pointerId;
  tarczaSvg.setPointerCapture(zdarzenie.pointerId);
  ustawPozycjeZPunktu(zdarzenie);
}

function przeciagaj(zdarzenie) {
  if (!stan.przeciaganie || zdarzenie.pointerId !== stan.pointerId) {
    return;
  }

  ustawPozycjeZPunktu(zdarzenie);
}

function zakonczPrzeciaganie(zdarzenie) {
  if (!stan.przeciaganie || zdarzenie.pointerId !== stan.pointerId) {
    return;
  }

  stan.przeciaganie = false;
  stan.pointerId = null;

  if (tarczaSvg.hasPointerCapture(zdarzenie.pointerId)) {
    tarczaSvg.releasePointerCapture(zdarzenie.pointerId);
  }
}

function ustawPozycjeZPunktu(zdarzenie) {
  const punkt = tarczaSvg.createSVGPoint();
  punkt.x = zdarzenie.clientX;
  punkt.y = zdarzenie.clientY;
  const svgPunkt = punkt.matrixTransform(tarczaSvg.getScreenCTM().inverse());

  const dx = svgPunkt.x - TARCZA.cx;
  const dy = TARCZA.cy - svgPunkt.y;
  const kat = Math.atan2(dy, dx);

  if (kat < 0 || kat > Math.PI) {
    return;
  }

  stan.pozycjaPartnera = katNaPozycje(kat);
  aktualizujTarcze();
}

function przelaczObrot() {
  stan.wymuszonyObrot = !stan.wymuszonyObrot;
  appRoot.classList.toggle("wymuszony-obrot", stan.wymuszonyObrot);
  ustawWymiaryEkranu();
}

function losujElement(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function losujLiczbe(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function ogranicz(wartosc, min, max) {
  return Math.min(Math.max(wartosc, min), max);
}

function ustawWymiaryEkranu() {
  const vh = window.innerHeight * 0.01;
  const vw = window.innerWidth * 0.01;
  document.documentElement.style.setProperty("--vh", vh + "px");
  document.documentElement.style.setProperty("--vw", vw + "px");
}
