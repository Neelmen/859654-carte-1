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
    const container = document.getElementById("menu");

    if (currentCategory === category) {
        currentCategory = null;
        closeMenuAnimation();
        return;
    }

    currentCategory = category;

    container.innerHTML = "";

    document.querySelectorAll("#navigation button").forEach(btn => {
        btn.classList.toggle("active", btn.textContent.toLowerCase() === category);
    });
    document.getElementById("back-button").classList.remove("hidden");

    if (cache[category]) {
        displayCategory(cache[category]);
        scrollToMenu();
        return;
    }

    // --- Récupération depuis Supabase ---
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

    // --- Regroupe par subcategory ---
    const grouped = data.reduce((acc, dish) => {
        const sub = dish.subcategory && dish.subcategory.trim() !== "" ? dish.subcategory : "_no_sub";
        if (!acc[sub]) acc[sub] = [];
        acc[sub].push(dish);
        return acc;
    }, {});

    cache[category] = grouped;
    displayCategory(grouped);
    scrollToMenu();
}
// ================================
// Affiche les plats triés par subcategory dans 2 colonnes (Chargement Séquentiel)
// ================================
async function displayCategory(grouped) {
    const container = document.getElementById("menu");
    container.innerHTML = "";

    const entries = Object.entries(grouped);
    const withSub = entries.filter(([key]) => key !== "_no_sub");
    const noSub = entries.find(([key]) => key === "_no_sub");

    withSub.sort((a, b) => b[1].length - a[1].length);
    const sorted = noSub ? [...withSub, noSub] : withSub;

    // On parcourt chaque groupe (ex: "Entrées Chaudes", "Entrées Froides")
    for (const [sub, dishes] of sorted) {
        let displayName = sub === "_no_sub" ? (dishes.length > 1 ? "Autres" : "Autre") : sub;

        const title = document.createElement("h2");
        title.textContent = displayName;
        container.appendChild(title);

        const groupDiv = document.createElement("div");
        groupDiv.className = "category-group";
        container.appendChild(groupDiv);

        // --- LA FILE D'ATTENTE DES PLATS ---
        for (const dish of dishes) {
            const card = document.createElement("div");
            card.className = "card";
            
            // On prépare l'animation (caché au début)
            card.style.opacity = "0";
            card.style.transform = "translateY(15px)";
            card.style.transition = "all 0.4s ease-out";

            const imageUrl = getImageUrlFromPath(dish.image_path);
            const img = document.createElement("img");
            img.alt = dish.name;

            // On crée une promesse qui attend que l'image soit chargée ou un délai de 0.5s
            const imageLoadPromise = new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = () => {
                    img.style.display = "none";
                    resolve();
                };
                setTimeout(resolve, 500); // Ne bloque pas plus de 0.5s par plat
            });

            img.src = imageUrl;

            const h3Name = document.createElement("h3");
            h3Name.textContent = dish.name;

            const pPrice = document.createElement("p");
            pPrice.textContent = dish.price + " €";

            const pInfo = document.createElement("p");
            pInfo.textContent = "Plus d'infos";
            pInfo.style.fontWeight = "bold";
            pInfo.style.color = "#444";
            pInfo.style.cursor = "pointer";

            card.append(img, h3Name, pPrice, pInfo);
            card.addEventListener("click", () => showDetail(dish));
            groupDiv.appendChild(card);

            // ON ATTEND que l'image soit prête avant de passer au plat suivant
            await imageLoadPromise;

            // On affiche le plat avec une transition fluide
            requestAnimationFrame(() => {
                card.style.opacity = "1";
                card.style.transform = "translateY(0)";
            });
        }
    }
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
    detail.innerHTML = "";

    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = getImageUrlFromPath(dish.image_path);
    img.alt = dish.name;
    img.style.borderRadius = "10px";

    const h3Name = document.createElement("h3");
    h3Name.textContent = dish.name;

    const pPrice = document.createElement("p");
    pPrice.textContent = dish.price + " €";

    card.append(img, h3Name, pPrice);

    if (dish.description) {
        const pDesc = document.createElement("p");
        pDesc.innerHTML = "<b>Description :</b> " + dish.description;
        card.appendChild(pDesc);
    }
    if (dish.ingredients) {
        const pIng = document.createElement("p");
        pIng.innerHTML = "<b>Ingrédients :</b> " + dish.ingredients;
        card.appendChild(pIng);
    }
    if (dish.allergens) {
        const pAllerg = document.createElement("p");
        pAllerg.innerHTML = "<b>Allergènes :</b> " + dish.allergens;
        card.appendChild(pAllerg);
    }

    detail.appendChild(card);
}

// ================================
// Fermeture fiche détail (click overlay)
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

    const categories = ["entree", "plat", "dessert", "boisson", "accompagnement"];

    const labels = {
        entree: "ENTRÉES",
        plat: "PLATS",
        dessert: "DESSERTS",
        boisson: "BOISSONS",
        accompagnement: "ACCOMPAGNEMENTS"
    };

    categories.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = labels[cat] || cat.toUpperCase(); // ← ici
        btn.addEventListener("click", () => showCategory(cat));
        nav.appendChild(btn);
    });

    document.getElementById("back-button").classList.add("hidden");
}

function addRippleEffect() {
    document.addEventListener("click", function (e) {
        const button = e.target.closest("#navigation button");
        if (!button) return;

        const ripple = document.createElement("span");
        ripple.classList.add("ripple");

        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        ripple.style.width = ripple.style.height = size + "px";
        ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
        ripple.style.top = (e.clientY - rect.top - size / 2) + "px";

        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
}
///animation de scroll pour l'ouverture du menu
function scrollToMenu() {
    const container = document.getElementById("menu");

    // On utilise un léger délai pour s'assurer que le contenu 
    // a commencé à s'injecter dans le DOM avant de calculer la position.
    setTimeout(() => {
        container.scrollIntoView({
            behavior: "smooth",
            block: "start" // Aligne le HAUT du container avec le HAUT de l'écran
        });
    }, 100);

    // Animation d'apparition des cartes
    const cards = container.querySelectorAll(".card");
    cards.forEach((card, i) => {
        card.style.opacity = 0;
        card.style.transform = "translateY(20px)";
        card.style.transition = `opacity 0.4s ease ${i * 0.05}s, transform 0.4s ease ${i * 0.05}s`;
        
        requestAnimationFrame(() => {
            card.style.opacity = 1;
            card.style.transform = "translateY(0)";
        });
    });
}

// ================================
// Fermer menu avec animation
// ================================
function closeMenuAnimation(callback) {
    const container = document.getElementById("menu");
    const cards = container.querySelectorAll(".card");

    // Scroll doucement vers le haut
    scrollToTop(100); // durée en ms, ajuste pour que ça aille vite

    cards.forEach((card, i) => {
        card.style.transition = `opacity 0.3s ease ${i * 0.03}s, transform 0.3s ease ${i * 0.03}s`;
        card.style.opacity = 0;
        card.style.transform = 'translateY(-20px)';
    });

    // Supprime après l'animation
    setTimeout(() => {
        container.innerHTML = "";
        document.getElementById("back-button").classList.add("hidden");

        const navButtons = document.querySelectorAll("#navigation button");
        navButtons.forEach(btn => btn.classList.remove("active"));

        const nav = document.getElementById("navigation");
        nav.classList.add("no-hover");
        const reactivateHover = () => {
            nav.classList.remove("no-hover");
            window.removeEventListener("touchstart", reactivateHover);
            window.removeEventListener("mousemove", reactivateHover);
        };
        window.addEventListener("touchstart", reactivateHover);
        window.addEventListener("mousemove", reactivateHover);

        if (callback) callback();
    }, 300 + cards.length * 30);
}

// ================================
// Bouton retour
// ================================
document.getElementById("back-button").addEventListener("click", () => {
    const detail = document.getElementById("dish-detail");
    const viewer = document.getElementById("image-viewer");

    if (detail && !detail.classList.contains("hidden")) {
        detail.classList.add("hidden");
    } else if (viewer) {
        viewer.remove();
    } else if (currentCategory) {
        currentCategory = null;
        closeMenuAnimation(() => initMainMenu());
    }
});

// ================================
// Lancement
// ================================
document.addEventListener("DOMContentLoaded", () => {
    initMainMenu();
    addRippleEffect();
});
function scrollToTop(duration = 300) {
    const start = window.scrollY;
    const startTime = performance.now();

    function animate(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1); // 0→1
        window.scrollTo(0, start * (1 - progress));
        if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}
