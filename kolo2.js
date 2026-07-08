let KATEGORIE_GRA = null;
const stan = { osie: [], aktualnaOs: null, runda: 0 };

// Pobieranie elementów
const ekranGry = document.getElementById("ekran-gry");
const ekranStartowy = document.getElementById("ekran-startowy");
const kontenerHasel = document.getElementById("haslo-lewe"); // Wymaga id="haslo-lewe" w HTML
const kontenerHaselP = document.getElementById("haslo-prawe"); // Wymaga id="haslo-prawe" w HTML
const rundaBadge = document.getElementById("runda-badge");
const btnNastepna = document.getElementById("btn-nastepna");
const btnPowrot = document.getElementById("btn-powrot");

// Inicjalizacja
fetch('dataKolo.json')
    .then(r => r.json())
    .then(data => {
        KATEGORIE_GRA = data;
        generujPrzyciskiKategorii();
    });

function generujPrzyciskiKategorii() {
    const kontener = document.getElementById("kontener-kategorii");
    Object.keys(KATEGORIE_GRA).forEach(klucz => {
        const btn = document.createElement("button");
        btn.textContent = klucz;
        btn.onclick = () => wybierzKategorie([klucz]);
        kontener.appendChild(btn);
    });
}

function wybierzKategorie(wybrane) {
    stan.osie = [];
    wybrane.forEach(k => stan.osie = stan.osie.concat(KATEGORIE_GRA[k]));
    ekranStartowy.classList.add("hidden");
    ekranGry.classList.remove("hidden");
    rozpocznijRunde();
}

function rozpocznijRunde() {
    stan.runda += 1;
    stan.aktualnaOs = stan.osie[Math.floor(Math.random() * stan.osie.length)];
    
    // Aktualizacja tekstu w HTML
    document.getElementById("haslo-lewe").textContent = stan.aktualnaOs.left;
    document.getElementById("haslo-prawe").textContent = stan.aktualnaOs.right;
    rundaBadge.textContent = "Runda " + stan.runda;
}

btnNastepna.addEventListener("click", rozpocznijRunde);
btnPowrot.addEventListener("click", () => {
    ekranGry.classList.add("hidden");
    ekranStartowy.classList.remove("hidden");
});
