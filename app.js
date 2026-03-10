let currentLevel = "menu";
let selectedCategory = null;

const SUPABASE_URL = "https://oaxpofkmtrudriyrbxvy.supabase.co";
const SUPABASE_KEY = "sb_publishable_W0bTuLBKIo_-tSVK_XfKYg_LScZ_5EY";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function displayMenu(dishes) {

    const container = document.getElementById("menu");
    container.innerHTML = "";

    dishes.forEach(dish => {

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <img src="${dish.image_url}" alt="${dish.name}">
            <h3>${dish.name}</h3>
            <p>${dish.price} €</p>
        `;

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

function showMainMenu() {

    currentLevel = "menu";

    const nav = document.getElementById("navigation");
    const container = document.getElementById("menu");

    nav.innerHTML = "";
    container.innerHTML = "";

    const categories = ["entree", "plat", "dessert", "boisson"];

    categories.forEach(cat => {

        const btn = document.createElement("button");

        btn.textContent = cat.toUpperCase();

        btn.onclick = () => {

            selectedCategory = cat;

            showSubcategories(cat);

        };

        nav.appendChild(btn);

    });

}

async function showSubcategories(category) {

    currentLevel = "subcategory";

    const { data, error } = await client
        .from("dishes")
        .select("subcategory")
        .eq("category", category);

    if (error) {
        console.error(error);
        return;
    }

    const unique = [...new Set(
        data
        .map(d => d.subcategory)
        .filter(sub => sub)
    )];

    const container = document.getElementById("menu");

    container.innerHTML = "";

    unique.forEach(sub => {

        const btn = document.createElement("button");

        btn.textContent = sub.toUpperCase();

        btn.onclick = () => {

            showDishes(category, sub);

        };

        container.appendChild(btn);

    });

    document.getElementById("back-button").classList.remove("hidden");

}

async function showDishes(category, subcategory) {

    currentLevel = "dishes";

    const { data, error } = await client
        .from("dishes")
        .select("*")
        .eq("category", category)
        .eq("subcategory", subcategory);

    if (error) {
        console.error(error);
        return;
    }

    displayMenu(data);

}

document.getElementById("back-button").onclick = () => {

    if (currentLevel === "dishes") {

        showSubcategories(selectedCategory);

    }

    else if (currentLevel === "subcategory") {

        showMainMenu();

        document.getElementById("back-button").classList.add("hidden");

    }

};

const detail = document.getElementById("dish-detail");

detail.addEventListener("click", () => {

    detail.classList.add("hidden");

});

const detailContent = detail.querySelectorAll("img, h2, p");

detailContent.forEach(el => {

    el.addEventListener("click", e => e.stopPropagation());

});

showMainMenu();
