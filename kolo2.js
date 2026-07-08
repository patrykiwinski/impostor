let KATEGORIE_GRA = null;
const stan = { osie: [], runda: 0, aktualnaOs: null };

// Pobieranie elementów
const ekranGry = document.getElementById("ekran-gry");
const ekranStartowy = document.getElementById("ekran-startowy");
const kontenerKategorii = document.getElementById("kontener-kategorii");
const rundaBadge = document.getElementById("runda-badge");
const btnNastepna = document.getElementById("btn-nastepna");
const btnPowrot = document.getElementById("btn-powrot");

// Inicjalizacja
fetch('dataKolo.json')
    .then(r => r.json())
    .then(data => {
        KATEGORIE_GRA = data;
        generujCheckboxy();
    });

function generujCheckboxy() {
    Object.keys(KATEGORIE_GRA).forEach(klucz => {
        const label = document.createElement("label");
        label.style.display = "block";
        label.style.marginBottom = "8px";
        
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.value = klucz;
        cb.checked = true; // Domyślnie zaznaczone
        
        label.appendChild(cb);
        label.appendChild(document.createTextNode(" " + klucz));
        kontenerKategorii.appendChild(label);
    });

    const btnStart = document.createElement("button");
    btnStart.className = "btn";
    btnStart.textContent = "🚀 Uruchom grę";
    btnStart.onclick = uruchomGre;
    kontenerKategorii.appendChild(btnStart);
}

function uruchomGre() {
    const zaznaczone = Array.from(kontenerKategorii.querySelectorAll("input:checked")).map(i => i.value);
    
    if (zaznaczone.length === 0) {
        alert("Wybierz przynajmniej jedną kategorię!");
        return;
    }

    stan.osie = [];
    zaznaczone.forEach(k => stan.osie = stan.osie.concat(KATEGORIE_GRA[k]));
    
    ekranStartowy.classList.add("hidden");
    ekranGry.classList.remove("hidden");
    rozpocznijRunde();
}

function rozpocznijRunde() {
    stan.runda += 1;
    // Losowanie hasła z połączonej listy wszystkich zaznaczonych kategorii
    stan.aktualnaOs = stan.osie[Math.floor(Math.random() * stan.osie.length)];
    
    document.getElementById("haslo-lewe").textContent = stan.aktualnaOs.left;
    document.getElementById("haslo-prawe").textContent = stan.aktualnaOs.right;
    rundaBadge.textContent = "Runda " + stan.runda;
}

btnNastepna.addEventListener("click", rozpocznijRunde);
btnPowrot.addEventListener("click", () => {
    ekranGry.classList.add("hidden");
    ekranStartowy.classList.remove("hidden");
});
