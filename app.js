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
function getImageUrlFromPath(imagePath) {
    if (!imagePath) return "";
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${imagePath}`;
}

// ================================
async function showCategory(category) {
    const container = document.getElementById("menu");

    if (currentCategory === category) {
        currentCategory = null;
        closeMenuAnimation();
        return;
    }

    currentCategory = category;
    window.scrollTo({ top: 0, behavior: "smooth" });
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

    const { data, error } = await client
        .from("dishes")
        .select("*")
        .eq("category", category)
        .eq("available", true);

    if (error) {
        console.error(error);
        container.innerHTML = "<p>Erreur</p>";
        return;
    }

    const grouped = data.reduce((acc, dish) => {
        const sub = dish.subcategory && dish.subcategory.trim() !== "" 
            ? dish.subcategory 
            : "_no_sub";

        if (!acc[sub]) acc[sub] = [];
        acc[sub].push(dish);
        return acc;
    }, {});

    cache[category] = grouped;
    displayCategory(grouped);
    scrollToMenu();
}

// ================================
function displayCategory(grouped) {
    const container = document.getElementById("menu");
    container.innerHTML = "";

    Object.entries(grouped).forEach(([sub, dishes]) => {
        // Pas de "Autres" pour boissons et desserts
if (
    sub === "_no_sub" &&
    (dishes[0].category === "boisson" || dishes[0].category === "dessert")
) {
    // pas de titre
} else {
    const title = document.createElement("h2");
    title.textContent = sub === "_no_sub" ? "Autres" : sub;
    container.appendChild(title);
}

        const groupDiv = document.createElement("div");
        groupDiv.className = "category-group";

        dishes.forEach(dish => {
            const card = document.createElement("div");
            card.className = "card";

            const img = document.createElement("img");
            img.src = getImageUrlFromPath(dish.image_path);

            const h3 = document.createElement("h3");
            h3.textContent = dish.name;

            const pPrice = document.createElement("p");
            if (dish.category === "accompagnement") {
                pPrice.textContent = "Compris avec le plat";
            } else {
                pPrice.textContent = dish.price + " €";
            }

            card.append(img, h3, pPrice);
            card.addEventListener("click", () => showDetail(dish));

            groupDiv.appendChild(card);
        });

        container.appendChild(groupDiv);
    });
}

// ================================
function showDetail(dish) {
    const detail = document.getElementById("dish-detail");
    detail.classList.remove("hidden");
    detail.innerHTML = "";

    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = getImageUrlFromPath(dish.image_path);

    const h3 = document.createElement("h3");
    h3.textContent = dish.name;

    const pPrice = document.createElement("p");
    if (dish.category === "accompagnement") {
        pPrice.textContent = "Compris avec le plat";
    } else {
        pPrice.textContent = dish.price + " €";
    }

    card.append(img, h3, pPrice);

    if (dish.description) {
        const p = document.createElement("p");
        p.innerHTML = "<b>Description :</b> " + dish.description;
        card.appendChild(p);
    }

    if (dish.ingredients) {
        const p = document.createElement("p");
        p.innerHTML = "<b>Ingrédients :</b> " + dish.ingredients;
        card.appendChild(p);
    }

    if (dish.allergens) {
        const p = document.createElement("p");
        p.innerHTML = "<b>Allergènes :</b> " + dish.allergens;
        card.appendChild(p);
    }

    detail.appendChild(card);
}

// ================================
function initMainMenu() {
    const nav = document.getElementById("navigation");
    nav.innerHTML = "";

    ["entree","plat","accompagnement","dessert","boisson"].forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat.toUpperCase();
        btn.onclick = () => showCategory(cat);
        nav.appendChild(btn);
    });
}

// ================================
document.addEventListener("DOMContentLoaded", initMainMenu);
