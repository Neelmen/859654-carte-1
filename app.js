// ================================
// app.js - Menu digital
// ================================

let currentLevel = "menu";          // niveau actuel : menu / subcategory / dishes
let selectedCategory = null;        // catégorie choisie

const SUPABASE_URL = "https://oaxpofkmtrudriyrbxvy.supabase.co";
const SUPABASE_KEY = "sb_publishable_W0bTuLBKIo_-tSVK_XfKYg_LScZ_5EY";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ================================
// Affichage des plats dans le menu
// ================================
function displayMenu(dishes) {
    const container = document.getElementById("menu");
    container.innerHTML = "";

    if (!dishes || dishes.length === 0) {
        container.innerHTML = "<p>Aucun plat disponible pour cette catégorie.</p>";
        return;
    }

    dishes.forEach(dish => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <img src="${dish.image_url}" alt="${dish.name}">
            <h3>${dish.name}</h3>
            <p>${dish.price} €</p>
        `;

        // Au clic sur la carte, ouvrir la fiche détaillée
        card.addEventListener("click", () => {
            const detail = document.getElementById("dish-detail");
            detail.classList.remove("hidden");
            document.getElementById("detail-image").src = dish.image_url;
            document.getElementById("detail-name").textContent = dish.name;
            document.getElementById("detail-price").textContent = dish.price + " €";
            document.getElementById("detail-description").textContent = dish.description || "";
            document.getElementById("detail-ingredients").textContent = dish.ingredients || "";
            document.getElementById("detail-allergens").textContent = dish.allergens || "";
        });

        container.appendChild(card);
    });
}

// ================================
// Affichage du menu principal (catégories)
// ================================
function showMainMenu() {
    currentLevel = "menu";
    const nav = document.getElementById("navigation");
    const container = document.getElementById("menu");
    nav.innerHTML = "";
    container.innerHTML = "";

    const categories = ["entree","plat","dessert","boisson"];

    categories.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat.toUpperCase();

        btn.onclick = () => {
            selectedCategory = cat;
            showSubcategories(cat);
        };

        nav.appendChild(btn);
    });

    document.getElementById("back-button").classList.add("hidden");
}

// ================================
// Affichage des sous-catégories
// ================================
async function showSubcategories(category) {
    currentLevel = "subcategory";

    const { data, error } = await client
        .from("dishes")
        .select("subcategory")
        .eq("category", category);

    if (error) {
        console.error("Erreur Supabase:", error);
        return;
    }

    const unique = [...new Set(data.map(d => d.subcategory).filter(s => s))]; // enlever null/undefined

    const container = document.getElementById("menu");
    container.innerHTML = "";

    if (unique.length === 0) {
        container.innerHTML = "<p>Aucune sous-catégorie disponible.</p>";
    }

    unique.forEach(sub => {
        const btn = document.createElement("button");
        btn.textContent = sub.toUpperCase();
        btn.onclick = () => showDishes(category, sub);
        container.appendChild(btn);
    });

    document.getElementById("back-button").classList.remove("hidden");
}

// ================================
// Affichage des plats pour une sous-catégorie
// ================================
async function showDishes(category, subcategory) {
    currentLevel = "dishes";

    const { data, error } = await client
        .from("dishes")
        .select("*")
        .eq("category", category)
        .eq("subcategory", subcategory);

    if (error) {
        console.error("Erreur Supabase:", error);
        return;
    }

    displayMenu(data);
}

// ================================
// Bouton retour
// ================================
document.getElementById("back-button").onclick = () => {
    if (currentLevel === "dishes") {
        showSubcategories(selectedCategory);
    } else if (currentLevel === "subcategory") {
        showMainMenu();
    }
};

// ================================
// Fiche détaillée : fermeture au clic n’importe où
// ================================
const detail = document.getElementById("dish-detail");

detail.addEventListener("click", () => {
    detail.classList.add("hidden");
});

// Empêcher la fermeture si on clique sur l'image ou le texte
const detailContent = detail.querySelectorAll("img, h2, p");
detailContent.forEach(el => {
    el.addEventListener("click", e => e.stopPropagation());
});

// ================================
// Lancement
// ================================
document.addEventListener("DOMContentLoaded", () => {
    showMainMenu();
});

