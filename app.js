// ================================
// app.js - site client (public images)
// ================================
console.log("APP JS CLIENT CHARGÉ");

const SUPABASE_URL = "https://oaxpofkmtrudriyrbxvy.supabase.co";
const BUCKET_NAME = "dishes-images";
const client = supabase.createClient(
    SUPABASE_URL,
    "sb_publishable_W0bTuLBKIo_-tSVK_XfKYg_LScZ_5EY"
);

const cache = {};
let currentCategory = null;

// ================================
// Construit l'URL publique depuis image_path
// ================================
function getImageUrlFromPath(imagePath) {
    if (!imagePath) return "";
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${imagePath}`;
}

// ================================
// Affiche la catégorie sélectionnée
// ================================
async function showCategory(category) {
    currentCategory = category;
    window.scrollTo({ top: 0, behavior: "smooth" });

    const container = document.getElementById("menu");
    container.innerHTML = "";

    // Boutons navigation
    document.querySelectorAll("#navigation button").forEach(btn => {
        btn.classList.toggle("active", btn.textContent.toLowerCase() === category);
    });

    document.getElementById("back-button").classList.remove("hidden");

    if (cache[category]) {
        displayCategory(cache[category]);
        return;
    }

    // Récupération depuis Supabase
    const { data, error } = await client
        .from("dishes")
        .select("*")
        .eq("category", category)
        .eq("available", true);

    if (error) {
        console.error("Erreur Supabase:", error);
        container.innerHTML = "<p>Erreur lors du chargement des plats.</p>";
        return;
    }

    // Regroupe par subcategory
    const grouped = data.reduce((acc, dish) => {
    const sub = dish.subcategory && dish.subcategory.trim() !== "" 
        ? dish.subcategory 
        : "_no_sub"; // clé interne

    if (!acc[sub]) acc[sub] = [];
    acc[sub].push(dish);
    return acc;
}, {});

    cache[category] = grouped;
    displayCategory(grouped);
}

// ================================
// Affiche les plats triés par subcategory dans 2 colonnes
// ================================
function displayCategory(grouped) {
    const container = document.getElementById("menu");
    container.innerHTML = "";

    // Tri des sous-catégories
    // transformer en tableau pour trier
const entries = Object.entries(grouped);

// séparer les sans sous-catégorie
const withSub = entries.filter(([key]) => key !== "_no_sub");
const noSub = entries.find(([key]) => key === "_no_sub");

// trier par nombre de plats (desc)
withSub.sort((a, b) => b[1].length - a[1].length);

// reconstruire ordre final
const sorted = noSub ? [...withSub, noSub] : withSub;

sorted.forEach(([sub, dishes]) => {
            let displayName = sub;

if (sub === "_no_sub") {
    displayName = dishes.length > 1 ? "Autres" : "Autre";
}
            const groupDiv = document.createElement("div");
            groupDiv.className = "category-group";

            dishes.forEach(dish => {
                const card = document.createElement("div");
                card.className = "card";

                // Image
                const imageUrl = getImageUrlFromPath(dish.image_path);
                const img = document.createElement("img");
                img.loading = "lazy";
                img.alt = dish.name;
                img.src = imageUrl;
                img.onerror = () => (img.style.display = "none");
                img.addEventListener("click", e => {
                    e.stopPropagation();
                    showFullscreenImage(imageUrl);
                });

                // Nom du plat
                const h3Name = document.createElement("h3");
                h3Name.textContent = dish.name;

                // Prix
                const pPrice = document.createElement("p");
                pPrice.textContent = dish.price + " €";

                // Description
                const pDesc = document.createElement("p");
                if (dish.description) {
                    pDesc.innerHTML = "<b>Déscription :</b> " + dish.description;
                }

                // Ingrédients
                const pIng = document.createElement("p");
                if (dish.ingredients) {
                    pIng.innerHTML = "<b>Ingrédients :</b> " + dish.ingredients;
                }

                // Assemblage de la carte
                card.append(img, h3Name, pPrice, pDesc, pIng);
                card.addEventListener("click", () => showDetail(dish));

                groupDiv.appendChild(card);
            });

            container.appendChild(groupDiv);
        });
}

// ================================
// Image plein écran
// ================================
function showFullscreenImage(src) {
    const viewer = document.createElement("div");
    viewer.id = "image-viewer";
    Object.assign(viewer.style, {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
    });

    const img = document.createElement("img");
    img.src = src;
    Object.assign(img.style, {
        maxWidth: "95%",
        maxHeight: "95%",
        borderRadius: "10px",
    });

    viewer.appendChild(img);
    viewer.addEventListener("click", () => viewer.remove());
    document.body.appendChild(viewer);
}

// ================================
// Fiche détail du plat
// ================================
function showDetail(dish) {
    const detail = document.getElementById("dish-detail");
    detail.classList.remove("hidden");

    const imageUrl = getImageUrlFromPath(dish.image_path);

    document.getElementById("detail-image").src = imageUrl;
    document.getElementById("detail-name").textContent = dish.name;
    document.getElementById("detail-price").textContent = dish.price + " €";
    document.getElementById("detail-description").textContent = dish.description || "";
    document.getElementById("detail-ingredients").textContent = dish.ingredients || "";
    document.getElementById("detail-allergens").textContent = dish.allergens || "";

    // afficher le bouton retour
    const backButton = document.getElementById("back-button");
    backButton.classList.remove("hidden");
}

// ================================
// Fermeture fiche détail
// ================================
const detail = document.getElementById("dish-detail");
if (detail) {
    detail.addEventListener("click", () => detail.classList.add("hidden"));
    detail.querySelectorAll("img, h2, p").forEach(el =>
        el.addEventListener("click", e => e.stopPropagation())
    );
}

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
    const detail = document.getElementById("dish-detail");
    const viewer = document.getElementById("image-viewer");

    if (detail && !detail.classList.contains("hidden")) {
        // ferme la fiche détaillée
        detail.classList.add("hidden");
    } else if (viewer) {
        // ferme la visionneuse d'image
        viewer.remove();
    } else {
        // sinon retourne au menu principal
        initMainMenu();
        document.getElementById("menu").innerHTML = "";
    }
});
// ================================
// Lancement
// ================================
document.addEventListener("DOMContentLoaded", () => {
    initMainMenu();
});
