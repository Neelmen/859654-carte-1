const orderState = {
    items: [],
    history: [],
};

const orderElements = {};
let orderMessageTimer;

// Récupération de la table via l'URL (ex: ?table=1)
const urlParams = new URLSearchParams(window.location.search);
const tableNumber = parseInt(urlParams.get('table')) || 1; 

const SUPABASE_URL = "https://oaxpofkmtrudriyrbxvy.supabase.co";
const BUCKET_NAME = "dishes-images";
const client = supabase.createClient(
    SUPABASE_URL,
    "sb_publishable_W0bTuLBKIo_-tSVK_XfKYg_LScZ_5EY"
);

function initOrderModule() {
    orderElements.total = document.getElementById("order-total");
    orderElements.historyPanel = document.getElementById("order-history");
    orderElements.historyList = document.getElementById("history-list");
    orderElements.historyToggle = document.getElementById("order-history-toggle");
    orderElements.historyClose = document.getElementById("close-history");
    orderElements.itemsList = document.getElementById("order-items-list");
    orderElements.empty = document.getElementById("order-empty");
    orderElements.messages = document.getElementById("order-messages");
    orderElements.callWaiter = document.getElementById("call-waiter");
    orderElements.requestBill = document.getElementById("request-bill");

    if (orderElements.historyToggle) {
        orderElements.historyToggle.addEventListener("click", () => {
            orderElements.historyPanel?.classList.toggle("hidden");
        });
    }

    if (orderElements.historyClose) {
        orderElements.historyClose.addEventListener("click", () => {
            orderElements.historyPanel?.classList.add("hidden");
        });
    }

    if (orderElements.callWaiter) {
        orderElements.callWaiter.addEventListener("click", () => {
            displayMessage("Le serveur est en route vers votre table.");
        });
    }

    if (orderElements.requestBill) {
        orderElements.requestBill.addEventListener("click", () => {
            displayMessage("La note va vous être envoyée.");
        });
    }

    // Charger les commandes existantes pour cette table au démarrage
    fetchTableOrders();
    // Activer l'écoute en temps réel
    subscribeToOrders();
}

// RECUPERATION DES DONNEES DEPUIS SUPABASE
async function fetchTableOrders() {
    const { data, error } = await client
        .from('orders')
        .select('*')
        .eq('table_id', tableNumber)
        .neq('status', 'abandonné')
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Erreur de chargement des commandes:", error);
        return;
    }

    if (data) {
        // On remplit l'état local avec les données de la DB
        orderState.items = data.map(d => ({
            name: d.dish_name,
            price: d.price,
            status: d.status
        }));
        
        orderState.history = data.map(d => ({
            label: d.dish_name,
            price: d.price,
            type: d.status, // On utilise le statut pour le type
            timestamp: new Date(d.created_at),
        }));

        updateOrderDisplay();
    }
}

// ENVOI D'UNE COMMANDE VERS SUPABASE
async function addToOrder(name, price) {
    const numericPrice = parseFloat(price);
    if (Number.isNaN(numericPrice)) {
        displayMessage("Impossible d'ajouter ce plat.");
        return;
    }

    const { error } = await client
        .from('orders')
        .insert([{
            table_id: tableNumber,
            dish_name: name,
            price: numericPrice,
            status: 'commandé'
        }]);

    if (error) {
        displayMessage("Erreur réseau lors de la commande.");
        console.error(error);
    } else {
        displayMessage(`${name} a été ajouté à votre commande.`);
        // Note: l'affichage se mettra à jour via le Realtime (subscribeToOrders)
    }
}

// TEMPS RÉEL : Mise à jour automatique si le serveur change un statut
function subscribeToOrders() {
    client
        .channel('schema-db-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'orders', filter: `table_id=eq.${tableNumber}` }, 
            (payload) => {
                fetchTableOrders();
            }
        )
        .subscribe();
}

function updateOrderDisplay() {
    const total = orderState.items.reduce((sum, item) => sum + item.price, 0);

    if (orderElements.total) {
        orderElements.total.textContent = formatPrice(total);
    }

    if (orderElements.itemsList) {
        orderElements.itemsList.innerHTML = "";
        orderState.items.forEach((item) => {
            const li = document.createElement("li");
            const title = document.createElement("span");
            // On affiche le statut (ex: Livré) à côté du nom
            const statusIcon = item.status === 'livré' ? '✅ ' : '⏳ ';
            title.textContent = statusIcon + item.name;
            const price = document.createElement("strong");
            price.textContent = formatPrice(item.price);
            li.append(title, price);
            orderElements.itemsList.appendChild(li);
        });
    }

    if (orderElements.empty) {
        orderElements.empty.style.display = orderState.items.length ? "none" : "block";
    }

    renderHistoryList();
}

function renderHistoryList() {
    if (!orderElements.historyList) return;
    orderElements.historyList.innerHTML = "";

    const sortedHistory = [...orderState.history].sort((a, b) => a.timestamp - b.timestamp);

    sortedHistory.forEach((entry) => {
        const li = document.createElement("li");
        const left = document.createElement("span");
        left.textContent = `${formatClock(entry.timestamp)} • ${entry.label}`;
        const right = document.createElement("span");
        right.textContent = entry.price > 0 ? formatPrice(entry.price) : "—";
        li.append(left, right);
        orderElements.historyList.appendChild(li);
    });
}

function formatPrice(value) {
    return `${value.toFixed(2)} €`;
}

function formatClock(date) {
    return new Date(date).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

function displayMessage(text) {
    if (!orderElements.messages) return;
    if (orderMessageTimer) clearTimeout(orderMessageTimer);
    orderElements.messages.textContent = text;
    orderMessageTimer = setTimeout(() => {
        if (orderElements.messages) orderElements.messages.textContent = "";
    }, 3200);
}

// --- LOGIQUE DU MENU (Inchangée mais intégrée) ---

const cache = {};
let currentCategory = null;

function getImageUrlFromPath(imagePath) {
    if (!imagePath) return "";
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${imagePath}`;
}

async function showCategory(category) {
    const container = document.getElementById("menu");
    if (currentCategory === category) {
        currentCategory = null;
        closeMenuAnimation();
        return;
    }
    currentCategory = category;
    container.innerHTML = "";

    document.querySelectorAll("#navigation button").forEach((btn) => {
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
        container.innerHTML = "<p>Erreur lors du chargement.</p>";
        return;
    }

    const grouped = data.reduce((acc, dish) => {
        const sub = dish.subcategory?.trim() || "_no_sub";
        if (!acc[sub]) acc[sub] = [];
        acc[sub].push(dish);
        return acc;
    }, {});

    cache[category] = grouped;
    displayCategory(grouped);
    scrollToMenu();
}

async function displayCategory(grouped) {
    const container = document.getElementById("menu");
    container.innerHTML = "";
    const entries = Object.entries(grouped);
    for (const [sub, dishes] of entries) {
        const title = document.createElement("h2");
        title.textContent = sub === "_no_sub" ? "Sélection" : sub;
        container.appendChild(title);
        const groupDiv = document.createElement("div");
        groupDiv.className = "category-group";
        container.appendChild(groupDiv);

        for (const dish of dishes) {
            const card = document.createElement("div");
            card.className = "card";
            const img = document.createElement("img");
            img.src = getImageUrlFromPath(dish.image_path);
            const h3Name = document.createElement("h3");
            h3Name.textContent = dish.name;
            const pPrice = document.createElement("p");
            pPrice.textContent = dish.price + " €";
            card.append(img, h3Name, pPrice);
            card.addEventListener("click", () => showDetail(dish));
            groupDiv.appendChild(card);
        }
    }
}

function showDetail(dish) {
    const detail = document.getElementById("dish-detail");
    detail.classList.remove("hidden");
    detail.innerHTML = "";
    const card = document.createElement("div");
    card.className = "card";
    const img = document.createElement("img");
    img.src = getImageUrlFromPath(dish.image_path);
    const h3Name = document.createElement("h3");
    h3Name.textContent = dish.name;
    const orderButton = document.createElement("button");
    orderButton.className = "action-button order-card-button";
    orderButton.textContent = `Commander (${dish.price} €)`;
    orderButton.onclick = () => {
        addToOrder(dish.name, dish.price);
        detail.classList.add("hidden");
    };
    card.append(img, h3Name, orderButton);
    detail.appendChild(card);
}

function initMainMenu() {
    const nav = document.getElementById("navigation");
    const categories = ["entree", "plat", "dessert", "boisson", "accompagnement"];
    nav.innerHTML = "";
    categories.forEach((cat) => {
        const btn = document.createElement("button");
        btn.textContent = cat.toUpperCase();
        btn.onclick = () => showCategory(cat);
        nav.appendChild(btn);
    });
}

function scrollToMenu() {
    document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
}

function closeMenuAnimation(callback) {
    document.getElementById("menu").innerHTML = "";
    document.getElementById("back-button").classList.add("hidden");
    if (callback) callback();
}

document.getElementById("back-button")?.addEventListener("click", () => {
    if (currentCategory) {
        currentCategory = null;
        closeMenuAnimation(() => initMainMenu());
    }
});

document.addEventListener("DOMContentLoaded", () => {
    initMainMenu();
    initOrderModule();
});