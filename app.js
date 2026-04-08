// Configuration Supabase
const SUPABASE_URL = "https://oaxpofkmtrudriyrbxvy.supabase.co";
const BUCKET_NAME = "dishes-images";
const client = supabase.createClient(SUPABASE_URL, "sb_publishable_W0bTuLBKIo_-tSVK_XfKYg_LScZ_5EY");

const cache = {};
let currentCategory = null;
const detail = document.getElementById("dish-detail");
const backButton = document.getElementById("back-button");

function getImageUrlFromPath(imagePath) {
    if (!imagePath) return "";
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${imagePath}`;
}

async function showCategory(category) {
    const container = document.getElementById("menu");
    if (currentCategory === category) {
        closeMenuAnimation();
        return;
    }
    currentCategory = category;
    container.innerHTML = "";

    document.querySelectorAll("#navigation button").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute('data-cat') === category);
    });

    backButton.classList.remove("hidden");

    if (cache[category]) {
        displayCategory(cache[category]);
        return;
    }

    const { data, error } = await client.from("dishes").select("*").eq("category", category).eq("available", true);
    if (error) return;

    const grouped = data.reduce((acc, dish) => {
        const sub = dish.subcategory || "_no_sub";
        if (!acc[sub]) acc[sub] = [];
        acc[sub].push(dish);
        return acc;
    }, {});

    cache[category] = grouped;
    displayCategory(grouped);
}

function displayCategory(grouped) {
    const container = document.getElementById("menu");
    container.innerHTML = "";

    Object.entries(grouped).forEach(([sub, dishes]) => {
        const title = document.createElement("h2");
        title.textContent = sub === "_no_sub" ? "La Sélection" : sub;
        title.style.margin = "40px 0 20px";
        container.appendChild(title);

        const groupDiv = document.createElement("div");
        groupDiv.className = "category-group";

        dishes.forEach(dish => {
            const card = document.createElement("div");
            card.className = "card";

            // Logique de prix pour la liste
            const displayPrice = (dish.price === 0 || dish.price === "0")
                ? "Inclus avec le plat"
                : `${dish.price} €`;

            card.innerHTML = `
                <img src="${getImageUrlFromPath(dish.image_path)}" alt="${dish.name}">
                <h3>${dish.name}</h3>
                <p style="padding-bottom:10px">${displayPrice}</p>
            `;
            card.onclick = () => showDetail(dish);
            groupDiv.appendChild(card);
        });
        container.appendChild(groupDiv);
    });

    window.scrollTo({ top: container.offsetTop - 20, behavior: 'smooth' });
}

function showDetail(dish) {
    // Logique de prix intelligente
    const displayPrice = (dish.price === 0 || dish.price === "0")
        ? "Inclus avec le plat"
        : `${dish.price} €`;

    // Construction dynamique du contenu
    let extraContent = "";

    if (dish.description && dish.description.trim() !== "") {
        extraContent += `<p style="margin-top:15px; opacity:0.9;">${dish.description}</p>`;
    }

    if (dish.ingredients && dish.ingredients.trim() !== "") {
        extraContent += `<p style="font-size:0.85rem; opacity:0.7; font-style:italic; margin-top:10px;">
                            <b>Ingrédients :</b> ${dish.ingredients}
                         </p>`;
    }

    detail.innerHTML = `
        <div class="zoom-container" onclick="closeDetail()">
            <img src="${getImageUrlFromPath(dish.image_path)}" class="zoom-image">
            <div class="zoom-info" onclick="event.stopPropagation()">
                <h2>${dish.name}</h2>
                <div style="font-size:1.4rem; color:#f4ab30; margin-bottom:10px">${displayPrice}</div>
                ${extraContent}
            </div>
        </div>
    `;
    detail.classList.add("active");
    detail.classList.remove("hidden");
    document.body.classList.add("overlay-open");
    backButton.classList.remove("hidden");
}

function closeDetail() {
    detail.classList.remove("active");
    detail.classList.add("hidden");
    document.body.classList.remove("overlay-open");
}

function closeMenuAnimation() {
    currentCategory = null;
    document.getElementById("menu").innerHTML = "";
    backButton.classList.add("hidden");
    document.querySelectorAll("#navigation button").forEach(btn => btn.classList.remove("active"));
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

backButton.onclick = () => {
    if (detail.classList.contains("active")) {
        closeDetail();
    } else {
        closeMenuAnimation();
    }
};

function addRippleEffect() {
    document.addEventListener("mousedown", (e) => {
        const btn = e.target.closest("button, #back-button");
        if (!btn) return;
        const ripple = document.createElement("span");
        ripple.className = "ripple";
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + "px";
        ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
        ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const nav = document.getElementById("navigation");
    const labels = {
        entree: "ENTRÉES",
        plat: "PLATS",
        accompagnement: "ACCOMPAGNEMENTS",
        dessert: "DESSERTS",
        boisson: "BOISSONS"
    };
    Object.keys(labels).forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = labels[cat];
        btn.setAttribute('data-cat', cat);
        btn.onclick = () => showCategory(cat);
        nav.appendChild(btn);
    });
    addRippleEffect();
});