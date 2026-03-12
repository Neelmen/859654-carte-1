// ================================
// app.js - Menu digital optimisé
// ================================
console.log("APP JS CHARGÉ");

const SUPABASE_URL = "https://oaxpofkmtrudriyrbxvy.supabase.co";
const SUPABASE_KEY = "sb_publishable_W0bTuLBKIo_-tSVK_XfKYg_LScZ_5EY";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const cache = {};
let currentCategory = null;

// ================================
// Affiche la catégorie sélectionnée
// ================================
async function showCategory(category) {

    currentCategory = category;

    // retour automatique en haut
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    const container = document.getElementById("menu");
    container.innerHTML = "";

    // bouton actif
    const navButtons = document.querySelectorAll("#navigation button");

    navButtons.forEach(btn => {

        btn.classList.remove("active");

        if (btn.textContent.toLowerCase() === category) {
            btn.classList.add("active");
        }

    });

    document.getElementById("back-button").classList.remove("hidden");

    if (cache[category]) {
        displayCategory(cache[category]);
        return;
    }

    const { data, error } = await client
        .from("dishes")
        .select("*")
        .eq("category", category)
        .eq("available", true);

    if (error) {
        console.error("Erreur Supabase:", error);
        container.innerHTML = "<p>Erreur lors du chargement de la carte.</p>";
        return;
    }

    const grouped = {};

    data.forEach(dish => {

        const sub = dish.subcategory || "Autres";

        if (!grouped[sub]) grouped[sub] = [];

        grouped[sub].push(dish);

    });

    cache[category] = grouped;

    displayCategory(grouped);
}

// ================================
// Affiche les plats
// ================================
function displayCategory(grouped) {

    const container = document.getElementById("menu");

    container.innerHTML = "";

    Object.keys(grouped).forEach(sub => {

        if (sub !== "Autres") {

            const h3 = document.createElement("h3");

            h3.textContent = sub;

            h3.style.textAlign = "center";

            h3.style.margin = "20px 0 10px";

            container.appendChild(h3);
        }

        grouped[sub].forEach(dish => {

            const card = document.createElement("div");

            card.className = "card";

            card.innerHTML = `
                <img loading="lazy" src="${dish.image_url}" alt="${dish.name}" class="dish-image">
                <h3>${dish.name}</h3>
                <p>${dish.price} €</p>
            `;

            // clic sur la carte = détail
            card.addEventListener("click", () => showDetail(dish));

            // clic sur image = plein écran
            const img = card.querySelector(".dish-image");

            img.addEventListener("click", (e) => {

                e.stopPropagation();

                showFullscreenImage(dish.image_url);

            });

            container.appendChild(card);

        });

    });

}

// ================================
// Image plein écran
// ================================
function showFullscreenImage(src) {

    const viewer = document.createElement("div");

    viewer.id = "image-viewer";

    viewer.innerHTML = `
        <img src="${src}">
    `;

    viewer.addEventListener("click", () => {
        viewer.remove();
    });

    document.body.appendChild(viewer);

}

// ================================
// Fiche détail du plat
// ================================
function showDetail(dish) {

    const detail = document.getElementById("dish-detail");

    detail.classList.remove("hidden");

    document.getElementById("detail-image").src = dish.image_url;

    document.getElementById("detail-name").textContent = dish.name;

    document.getElementById("detail-price").textContent = dish.price + " €";

    document.getElementById("detail-description").textContent = dish.description || "";

    document.getElementById("detail-ingredients").textContent = dish.ingredients || "";

    document.getElementById("detail-allergens").textContent = dish.allergens || "";

}

// ================================
// Fermeture fiche détail
// ================================
const detail = document.getElementById("dish-detail");

detail.addEventListener("click", () => detail.classList.add("hidden"));

detail.querySelectorAll("img, h2, p").forEach(el => {

    el.addEventListener("click", e => e.stopPropagation());

});

// ================================
// Menu principal
// ================================
function initMainMenu() {

    const nav = document.getElementById("navigation");

    nav.innerHTML = "";

    const categories = ["entree", "plat", "dessert", "boisson"];

    categories.forEach(cat => {

        const btn = document.createElement("button");

        btn.textContent = cat.toUpperCase();

        btn.addEventListener("click", () => showCategory(cat));

        nav.appendChild(btn);

    });

    document.getElementById("back-button").classList.add("hidden");

}

// ================================
// Bouton retour
// ================================
document.getElementById("back-button").addEventListener("click", () => {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    initMainMenu();

    document.getElementById("menu").innerHTML = "";

});

// ================================
// Lancement
// ================================
document.addEventListener("DOMContentLoaded", () => {

    initMainMenu();

});