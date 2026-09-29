const API = "https://api.coingecko.com/api/v3";

let allCoins = [];
let coinPage = 1;
let selectedCoin = null;

let btcChart = null;
let coinDetailChart = null;
let portfolioChart = null;

const coinsPerPage = 25;


/* =========================
   HELPERS
========================= */

function $(id){
    return document.getElementById(id);
}

function formatMoney(value, compact = false){

    if(value === null || value === undefined || isNaN(value)){
        return "—";
    }

    if(compact){

        if(Math.abs(value) >= 1e12){
            return "$" + (value / 1e12).toFixed(2) + "T";
        }

        if(Math.abs(value) >= 1e9){
            return "$" + (value / 1e9).toFixed(2) + "B";
        }

        if(Math.abs(value) >= 1e6){
            return "$" + (value / 1e6).toFixed(2) + "M";
        }

    }

    if(value < 0.01){
        return "$" + value.toFixed(8);
    }

    if(value < 1){
        return "$" + value.toFixed(4);
    }

    return "$" + value.toLocaleString(
        undefined,
        {
            maximumFractionDigits:2
        }
    );
}

function formatNumber(value){

    if(value === null || value === undefined){
        return "—";
    }

    return Number(value).toLocaleString(
        undefined,
        {
            maximumFractionDigits:2
        }
    );
}

function changeClass(value){

    return Number(value) >= 0
        ? "change-positive"
        : "change-negative";
}

function formatChange(value){

    if(value === null || value === undefined){
        return "—";
    }

    const n = Number(value);

    return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}


/* =========================
   GLOBAL MARKET
========================= */

async function loadMarket(){

    try{

        const response =
            await fetch(`${API}/global`);

        const data =
            await response.json();

        const market = data.data;

        $("totalMarketCap").textContent =
            formatMoney(
                market.total_market_cap.usd,
                true
            );

        $("totalVolume").textContent =
            formatMoney(
                market.total_volume.usd,
                true
            );

        $("btcDominance").textContent =
            market.market_cap_percentage.btc.toFixed(2) + "%";

        $("activeCoins").textContent =
            Number(
                market.active_cryptocurrencies
            ).toLocaleString();

        const change =
            market.market_cap_change_percentage_24h_usd;

        $("marketCapChange").textContent =
            formatChange(change);

        $("marketCapChange").className =
            changeClass(change);

        $("marketUpdated").textContent =
            "Updated " +
            new Date().toLocaleTimeString(
                [],
                {
                    hour:"2-digit",
                    minute:"2-digit"
                }
            );

    }catch(error){

        console.log(
            "Global market error:",
            error
        );

    }
}


/* =========================
   MARKET COINS
========================= */

async function loadMarketCoins(){

    try{

        const response =
            await fetch(
                `${API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`
            );

        allCoins =
            await response.json();

        if(!Array.isArray(allCoins)){
            return;
        }

        const bitcoin =
            allCoins.find(
                coin => coin.id === "bitcoin"
            );

        if(bitcoin){

            $("btcPrice").textContent =
                formatMoney(bitcoin.current_price);

            $("btcChange").textContent =
                formatChange(
                    bitcoin.price_change_percentage_24h
                );

            $("btcChange").className =
                changeClass(
                    bitcoin.price_change_percentage_24h
                );
        }

        renderMovers();
        renderCoinExplorer();
        renderWatchlist();

    }catch(error){

        console.log(
            "Market coins error:",
            error
        );

    }
}


/* =========================
   MARKET MOVERS
========================= */

function renderMovers(){

    if(!allCoins.length){
        return;
    }

    const sorted =
        [...allCoins].sort(
            (a,b) =>
                (b.price_change_percentage_24h || 0) -
                (a.price_change_percentage_24h || 0)
        );

    const gainers =
        sorted.slice(0,5);

    const losers =
        [...allCoins]
            .sort(
                (a,b) =>
                    (a.price_change_percentage_24h || 0) -
                    (b.price_change_percentage_24h || 0)
            )
            .slice(0,5);

    $("gainersList").innerHTML =
        gainers.map(
            createCoinRow
        ).join("");

    $("losersList").innerHTML =
        losers.map(
            createCoinRow
        ).join("");

    setupCoinRowClicks();
}

function createCoinRow(coin){

    const change =
        coin.price_change_percentage_24h || 0;

    return `
        <div
            class="coin-row"
            data-coin-id="${coin.id}"
        >

            <div class="coin-row-left">

                <img
                    src="${coin.image}"
                    alt="${coin.name}"
                >

                <div class="coin-row-name">

                    <strong>${coin.name}</strong>

                    <span>
                        ${coin.symbol.toUpperCase()}
                    </span>

                </div>

            </div>

            <span class="${changeClass(change)}">
                ${formatChange(change)}
            </span>

        </div>
    `;
}


/* =========================
   TRENDING
========================= */

async function loadTrending(){

    try{

        const response =
            await fetch(
                `${API}/search/trending`
            );

        const data =
            await response.json();

        const trending =
            data.coins.slice(0,5);

        $("trendingList").innerHTML =
            trending.map(item => {

                const coin = item.item;

                return `
                    <div
                        class="coin-row"
                        data-coin-id="${coin.id}"
                    >

                        <div class="coin-row-left">

                            <img
                                src="${coin.small}"
                                alt="${coin.name}"
                            >

                            <div class="coin-row-name">

                                <strong>
                                    ${coin.name}
                                </strong>

                                <span>
                                    ${coin.symbol}
                                </span>

                            </div>

                        </div>

                        <span>
                            #${coin.market_cap_rank || "—"}
                        </span>

                    </div>
                `;

            }).join("");

        setupCoinRowClicks();

    }catch(error){

        console.log(
            "Trending error:",
            error
        );

    }
}


/* =========================
   BITCOIN CHART
========================= */

async function loadBitcoinChart(){

    try{

        const response =
            await fetch(
                `${API}/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=hourly`
            );

        const data =
            await response.json();

        const labels =
            data.prices.map(
                item =>
                    new Date(item[0]).toLocaleDateString(
                        [],
                        {
                            month:"short",
                            day:"numeric"
                        }
                    )
            );

        const prices =
            data.prices.map(
                item => item[1]
            );

        if(btcChart){
            btcChart.destroy();
        }

        btcChart =
            new Chart(
                $("btcChart"),
                {
                    type:"line",

                    data:{
                        labels,

                        datasets:[
                            {
                                label:"Bitcoin",

                                data:prices,

                                borderWidth:2,

                                pointRadius:0,

                                tension:.25
                            }
                        ]
                    },

                    options:{
                        responsive:true,

                        maintainAspectRatio:false,

                        plugins:{
                            legend:{
                                display:false
                            }
                        },

                        scales:{
                            x:{
                                display:false
                            },

                            y:{
                                ticks:{
                                    callback:
                                        value =>
                                            "$" +
                                            Number(
                                                value
                                            ).toLocaleString()
                                }
                            }
                        }
                    }
                }
            );

    }catch(error){

        console.log(
            "Bitcoin chart error:",
            error
        );

    }
}


/* =========================
   FEAR & GREED
========================= */

async function loadFearGreed(){

    try{

        const response =
            await fetch(
                "https://api.alternative.me/fng/?limit=1"
            );

        const data =
            await response.json();

        const current =
            data.data[0];

        const value =
            Number(current.value);

        $("fearValue").textContent =
            value;

        $("fearLabel").textContent =
            current.value_classification;

        $("sentimentIntelligence").textContent =
            current.value_classification +
            " (" +
            value +
            ")";

    }catch(error){

        console.log(
            "Fear & Greed error:",
            error
        );

        $("fearLabel").textContent =
            "Unavailable";
    }
}


/* =========================
   COIN EXPLORER
========================= */

function renderCoinExplorer(){

    const search =
        $("coinSearch")
            .value
            .toLowerCase()
            .trim();

    let filtered =
        allCoins.filter(
            coin =>
                coin.name
                    .toLowerCase()
                    .includes(search) ||

                coin.symbol
                    .toLowerCase()
                    .includes(search)
        );

    const visible =
        filtered.slice(
            0,
            coinPage * coinsPerPage
        );

    $("coinTableBody").innerHTML =
        visible.map(
            createCoinTableRow
        ).join("");

    $("loadMoreCoins").style.display =
        visible.length < filtered.length
            ? "inline-flex"
            : "none";

    setupCoinTableClicks();
}

function createCoinTableRow(coin){

    const change =
        coin.price_change_percentage_24h || 0;

    return `
        <tr data-coin-id="${coin.id}">

            <td>
                #${coin.market_cap_rank || "—"}
            </td>

            <td>

                <div class="coin-table-name">

                    <img
                        src="${coin.image}"
                        alt="${coin.name}"
                    >

                    <div>

                        <strong>
                            ${coin.name}
                        </strong>

                        <span>
                            ${coin.symbol.toUpperCase()}
                        </span>

                    </div>

                </div>

            </td>

            <td>
                ${formatMoney(coin.current_price)}
            </td>

            <td class="${changeClass(change)}">
                ${formatChange(change)}
            </td>

            <td>
                ${formatMoney(
                    coin.market_cap,
                    true
                )}
            </td>

            <td>
                ${formatMoney(
                    coin.total_volume,
                    true
                )}
            </td>

            <td>
                ${isInWatchlist(coin.id) ? "★" : "☆"}
            </td>

        </tr>
    `;
}

function setupCoinTableClicks(){

    document
        .querySelectorAll(
            "#coinTableBody tr"
        )
        .forEach(row => {

            row.onclick = () => {

                const id =
                    row.dataset.coinId;

                if(id){
                    loadCoinDetails(id);
                }

            };

        });
}


/* =========================
   COIN DETAILS
========================= */

async function loadCoinDetails(id){

    $("coinDetails")
        .classList
        .remove("hidden");

    document
        .querySelectorAll(".page-section")
        .forEach(section => {

            if(section.id !== "coinDetails"){
                section.style.display = "none";
            }

        });

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

    try{

        const response =
            await fetch(
                `${API}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
            );

        const coin =
            await response.json();

        selectedCoin = coin;

        displayCoinDetails(coin);

        await loadCoinDetailChart(id);

    }catch(error){

        console.log(
            "Coin details error:",
            error
        );

    }
}

function displayCoinDetails(coin){

    const market =
        coin.market_data;

    $("detailCoinImage").src =
        coin.image.large;

    $("detailCoinSymbol").textContent =
        coin.symbol.toUpperCase();

    $("detailCoinName").textContent =
        coin.name;

    $("detailCoinRank").textContent =
        "Market Cap Rank #" +
        (coin.market_cap_rank || "—");

    $("detailCoinPrice").textContent =
        formatMoney(
            market.current_price.usd
        );

    $("detailCoinChange").textContent =
        formatChange(
            market.price_change_percentage_24h
        );

    $("detailCoinChange").className =
        changeClass(
            market.price_change_percentage_24h
        );

    $("detailMarketCap").textContent =
        formatMoney(
            market.market_cap.usd,
            true
        );

    $("detailVolume").textContent =
        formatMoney(
            market.total_volume.usd,
            true
        );

    $("detailCirculating").textContent =
        formatNumber(
            market.circulating_supply
        );

    $("detailTotalSupply").textContent =
        formatNumber(
            market.total_supply
        );

    $("detailAth").textContent =
        formatMoney(
            market.ath.usd
        );

    $("detailAtl").textContent =
        formatMoney(
            market.atl.usd
        );

    const description =
        coin.description?.en || "";

    $("detailDescription").innerHTML =
        description
            ? cleanDescription(description)
            : "No description available.";

    updateDetailWatchButton();

    $("btcIntelligence").textContent =
        coin.symbol.toUpperCase() +
        " • Rank #" +
        (coin.market_cap_rank || "—");
}

function cleanDescription(text){

    const temp =
        document.createElement("div");

    temp.innerHTML = text;

    return temp.textContent || temp.innerText || "";
}

async function loadCoinDetailChart(id){

    try{

        const response =
            await fetch(
                `${API}/coins/${id}/market_chart?vs_currency=usd&days=7&interval=daily`
            );

        const data =
            await response.json();

        const labels =
            data.prices.map(
                item =>
                    new Date(item[0]).toLocaleDateString(
                        [],
                        {
                            month:"short",
                            day:"numeric"
                        }
                    )
            );

        const prices =
            data.prices.map(
                item => item[1]
            );

        if(coinDetailChart){
            coinDetailChart.destroy();
        }

        coinDetailChart =
            new Chart(
                $("coinDetailChart"),
                {
                    type:"line",

                    data:{
                        labels,

                        datasets:[
                            {
                                label:
                                    selectedCoin.name,

                                data:prices,

                                borderWidth:2,

                                pointRadius:2,

                                tension:.25
                            }
                        ]
                    },

                    options:{
                        responsive:true,

                        maintainAspectRatio:false,

                        plugins:{
                            legend:{
                                display:false
                            }
                        }
                    }
                }
            );

    }catch(error){

        console.log(
            "Coin detail chart error:",
            error
        );

    }
}


/* =========================
   WATCHLIST
========================= */

function getWatchlist(){

    try{

        return JSON.parse(
            localStorage.getItem(
                "cryptoOnlineWatchlist"
            )
        ) || [];

    }catch(error){

        return [];
    }
}

function saveWatchlist(list){

    localStorage.setItem(
        "cryptoOnlineWatchlist",
        JSON.stringify(list)
    );
}

function isInWatchlist(id){

    return getWatchlist().includes(id);
}

function toggleWatchlist(id){

    let list =
        getWatchlist();

    if(list.includes(id)){

        list =
            list.filter(
                coinId => coinId !== id
            );

    }else{

        list.push(id);
    }

    saveWatchlist(list);

    renderWatchlist();

    updateWatchlistCount();

    updateDetailWatchButton();

    $("watchlistIntelligence").textContent =
        list.length +
        (list.length === 1
            ? " asset"
            : " assets");
}

function updateWatchlistCount(){

    const count =
        getWatchlist().length;

    $("watchlistCount").textContent =
        count +
        (count === 1
            ? " coin"
            : " coins");
}

function updateDetailWatchButton(){

    if(!selectedCoin){
        return;
    }

    const active =
        isInWatchlist(
            selectedCoin.id
        );

    $("detailWatchButton").textContent =
        active
            ? "★ In Watchlist"
            : "☆ Add to Watchlist";
}

function renderWatchlist(){

    const list =
        getWatchlist();

    const container =
        $("watchlistContainer");

    if(!list.length){

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">★</div>

                <h3>Your watchlist is empty</h3>

                <p>
                    Add coins from the Coin Explorer
                    to monitor them here.
                </p>

                <a
                    href="#explorer"
                    class="primary-button"
                >
                    Explore Coins
                </a>

            </div>
        `;

        return;
    }

    const coins =
        list
            .map(
                id =>
                    allCoins.find(
                        coin =>
                            coin.id === id
                    )
            )
            .filter(Boolean);

    container.innerHTML =
        coins.map(coin => {

            const change =
                coin.price_change_percentage_24h || 0;

            return `
                <div
                    class="watch-card"
                    data-coin-id="${coin.id}"
                >

                    <div class="watch-card-top">

                        <div class="watch-coin">

                            <img
                                src="${coin.image}"
                                alt="${coin.name}"
                            >

                            <div>

                                <strong>
                                    ${coin.name}
                                </strong>

                                <span>
                                    ${coin.symbol.toUpperCase()}
                                </span>

                            </div>

                        </div>

                        <button
                            class="remove-watch"
                            data-remove="${coin.id}"
                        >
                            ×
                        </button>

                    </div>

                    <div class="watch-price">
                        ${formatMoney(
                            coin.current_price
                        )}
                    </div>

                    <span class="${changeClass(change)}">
                        ${formatChange(change)}
                    </span>

                </div>
            `;

        }).join("");

    setupWatchlistClicks();
}

function setupWatchlistClicks(){

    document
        .querySelectorAll(
            ".watch-card"
        )
        .forEach(card => {

            card.onclick = event => {

                if(
                    event.target.closest(
                        ".remove-watch"
                    )
                ){
                    return;
                }

                loadCoinDetails(
                    card.dataset.coinId
                );
            };

        });

    document
        .querySelectorAll(
            ".remove-watch"
        )
        .forEach(button => {

            button.onclick = event => {

                event.stopPropagation();

                toggleWatchlist(
                    button.dataset.remove
                );
            };

        });
}


/* =========================
   PORTFOLIO
========================= */

function getPortfolio(){

    try{

        return JSON.parse(
            localStorage.getItem(
                "cryptoOnlinePortfolio"
            )
        ) || [];

    }catch(error){

        return [];
    }
}

function savePortfolio(list){

    localStorage.setItem(
        "cryptoOnlinePortfolio",
        JSON.stringify(list)
    );
}

async function renderPortfolio(){

    const portfolio =
        getPortfolio();

    const container =
        $("portfolioHoldings");

    if(!portfolio.length){

        $("portfolioValue").textContent =
            "$0.00";

        $("portfolioInvested").textContent =
            "$0.00";

        $("portfolioProfit").textContent =
            "$0.00";

        $("portfolioAssets").textContent =
            "0";

        container.innerHTML = `
            <div class="empty-state small">

                <div class="empty-icon">▣</div>

                <h3>No holdings yet</h3>

                <p>
                    Add your first crypto holding.
                </p>

            </div>
        `;

        updatePortfolioChart([]);

        return;
    }

    let totalValue = 0;
    let totalInvested = 0;

    const enriched = [];

    for(
        const holding
        of portfolio
    ){

        const coin =
            allCoins.find(
                item =>
                    item.id === holding.coin
            );

        if(!coin){
            continue;
        }

        const value =
            coin.current_price *
            holding.amount;

        const invested =
            holding.purchasePrice *
            holding.amount;

        const profit =
            value -
            invested;

        totalValue += value;
        totalInvested += invested;

        enriched.push({
            ...holding,
            coin,
            value,
            invested,
            profit
        });
    }

    const totalProfit =
        totalValue -
        totalInvested;

    $("portfolioValue").textContent =
        formatMoney(totalValue);

    $("portfolioInvested").textContent =
        formatMoney(totalInvested);

    $("portfolioProfit").textContent =
        formatMoney(totalProfit);

    $("portfolioProfit").className =
        totalProfit >= 0
            ? "change-positive"
            : "change-negative";

    $("portfolioAssets").textContent =
        enriched.length;

    container.innerHTML =
        enriched.map(item => {

            const change =
                item.invested > 0
                    ? (
                        item.profit /
                        item.invested
                    ) * 100
                    : 0;

            return `
                <div class="holding">

                    <div class="holding-main">

                        <img
                            src="${item.coin.image}"
                            alt="${item.coin.name}"
                        >

                        <div>

                            <strong>
                                ${item.coin.name}
                            </strong>

                            <span>
                                ${formatNumber(
                                    item.amount
                                )}
                                ${item.coin.symbol.toUpperCase()}
                            </span>

                        </div>

                    </div>

                    <div class="holding-values">

                        <strong>
                            ${formatMoney(item.value)}
                        </strong>

                        <span
                            class="${changeClass(item.profit)}"
                        >
                            ${formatMoney(item.profit)}
                            (${formatChange(change)})
                        </span>

                    </div>

                    <button
                        class="remove-watch"
                        data-remove-holding="${item.coin.id}"
                    >
                        ×
                    </button>

                </div>
            `;

        }).join("");

    document
        .querySelectorAll(
            "[data-remove-holding]"
        )
        .forEach(button => {

            button.onclick = () => {

                const id =
                    button.dataset.removeHolding;

                const updated =
                    getPortfolio().filter(
                        holding =>
                            holding.coin !== id
                    );

                savePortfolio(updated);

                renderPortfolio();
            };

        });

    updatePortfolioChart(enriched);
}

function updatePortfolioChart(items){

    if(portfolioChart){
        portfolioChart.destroy();
    }

    if(!items.length){
        return;
    }

    portfolioChart =
        new Chart(
            $("portfolioChart"),
            {
                type:"doughnut",

                data:{
                    labels:
                        items.map(
                            item =>
                                item.coin.name
                        ),

                    datasets:[
                        {
                            data:
                                items.map(
                                    item =>
                                        item.value
                                ),

                            borderWidth:0
                        }
                    ]
                },

                options:{
                    responsive:true,

                    plugins:{
                        legend:{
                            position:"bottom"
                        }
                    }
                }
            }
        );
}


/* =========================
   MODAL
========================= */

function openHoldingModal(){

    $("holdingModal")
        .classList
        .remove("hidden");

    $("holdingCoin")
        .focus();
}

function closeHoldingModal(){

    $("holdingModal")
        .classList
        .add("hidden");
}

function saveNewHolding(){

    const coin =
        $("holdingCoin")
            .value
            .trim()
            .toLowerCase();

    const amount =
        Number(
            $("holdingAmount").value
        );

    const purchasePrice =
        Number(
            $("holdingPurchasePrice").value
        );

    if(
        !coin ||
        !amount ||
        amount <= 0 ||
        purchasePrice < 0
    ){

        alert(
            "Please enter valid holding information."
        );

        return;
    }

    const portfolio =
        getPortfolio();

    const existing =
        portfolio.find(
            item =>
                item.coin === coin
        );

    if(existing){

        existing.amount += amount;

        existing.purchasePrice =
            (
                existing.purchasePrice +
                purchasePrice
            ) / 2;

    }else{

        portfolio.push({
            coin,
            amount,
            purchasePrice
        });

    }

    savePortfolio(portfolio);

    $("holdingCoin").value = "";
    $("holdingAmount").value = "";
    $("holdingPurchasePrice").value = "";

    closeHoldingModal();

    renderPortfolio();
}


/* =========================
   GLOBAL SEARCH
========================= */

function setupGlobalSearch(){

    const input =
        $("globalSearch");

    const results =
        $("searchResults");

    input.addEventListener(
        "input",
        () => {

            const query =
                input.value
                    .toLowerCase()
                    .trim();

            if(!query){

                results.style.display =
                    "none";

                return;
            }

            const matches =
                allCoins
                    .filter(
                        coin =>
                            coin.name
                                .toLowerCase()
                                .includes(query) ||

                            coin.symbol
                                .toLowerCase()
                                .includes(query)
                    )
                    .slice(0,6);

            if(!matches.length){

                results.innerHTML =
                    `<div class="search-result">
                        No coins found
                    </div>`;

                results.style.display =
                    "block";

                return;
            }

            results.innerHTML =
                matches.map(
                    coin => `
                        <div
                            class="search-result"
                            data-search-id="${coin.id}"
                        >

                            <img
                                src="${coin.thumb || coin.image}"
                                alt="${coin.name}"
                            >

                            <div>

                                <strong>
                                    ${coin.name}
                                </strong>

                                <small>
                                    ${coin.symbol.toUpperCase()}
                                </small>

                            </div>

                        </div>
                    `
                ).join("");

            results.style.display =
                "block";

            document
                .querySelectorAll(
                    "[data-search-id]"
                )
                .forEach(result => {

                    result.onclick = () => {

                        const id =
                            result.dataset.searchId;

                        input.value = "";
                        results.style.display =
                            "none";

                        loadCoinDetails(id);
                    };

                });

        }
    );

    document.addEventListener(
        "click",
        event => {

            if(
                !event.target.closest(
                    ".search-box"
                )
            ){

                results.style.display =
                    "none";
            }

        }
    );
}


/* =========================
   NAVIGATION
========================= */

function setupNavigation(){

    document
        .querySelectorAll(".nav-link")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".nav-link"
                        )
                        .forEach(item =>
                            item.classList.remove(
                                "active"
                            )
                        );

                    link.classList.add(
                        "active"
                    );

                    $("sidebar")
                        ?.classList
                        .remove("open");
                }
            );

        });

}


/* =========================
   MOBILE MENU
========================= */

function setupMobileMenu(){

    const menu =
        $("mobileMenu");

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    menu.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );
}


/* =========================
   THEME
========================= */

function setupTheme(){

    const saved =
        localStorage.getItem(
            "cryptoOnlineTheme"
        );

    if(saved === "dark"){
        document.body.classList.add(
            "dark"
        );
    }

    updateThemeButton();

    $("themeToggle")
        .addEventListener(
            "click",
            () => {

                document.body.classList.toggle(
                    "dark"
                );

                const mode =
                    document.body.classList.contains(
                        "dark"
                    )
                    ? "dark"
                    : "light";

                localStorage.setItem(
                    "cryptoOnlineTheme",
                    mode
                );

                updateThemeButton();

            }
        );
}

function updateThemeButton(){

    $("themeToggle").innerHTML =
        document.body.classList.contains("dark")
            ? "☀ <span>Light Mode</span>"
            : "☾ <span>Dark Mode</span>";
}


/* =========================
   COIN ROW CLICKS
========================= */

function setupCoinRowClicks(){

    document
        .querySelectorAll(
            ".coin-row"
        )
        .forEach(row => {

            row.onclick = () => {

                loadCoinDetails(
                    row.dataset.coinId
                );

            };

        });
}


/* =========================
   DETAIL BUTTON
========================= */

function setupDetailButton(){

    $("closeCoinDetails")
        .addEventListener(
            "click",
            () => {

                $("coinDetails")
                    .classList
                    .add("hidden");

                document
                    .querySelectorAll(
                        ".page-section"
                    )
                    .forEach(section => {

                        section.style.display =
                            "";

                    });

                $("explorer")
                    .scrollIntoView({
                        behavior:"smooth"
                    });

            }
        );

    $("detailWatchButton")
        .addEventListener(
            "click",
            () => {

                if(selectedCoin){

                    toggleWatchlist(
                        selectedCoin.id
                    );
                }

            }
        );
}


/* =========================
   EXPLORER SEARCH
========================= */

function setupExplorerSearch(){

    $("coinSearch")
        .addEventListener(
            "input",
            () => {

                coinPage = 1;

                renderCoinExplorer();

            }
        );

    $("loadMoreCoins")
        .addEventListener(
            "click",
            () => {

                coinPage++;

                renderCoinExplorer();

            }
        );
}


/* =========================
   REFRESH
========================= */

function setupRefresh(){

    $("refreshButton")
        .addEventListener(
            "click",
            async () => {

                $("refreshButton")
                    .textContent = "…";

                await Promise.all([
                    loadMarket(),
                    loadMarketCoins(),
                    loadTrending(),
                    loadBitcoinChart(),
                    loadFearGreed()
                ]);

                renderPortfolio();

                $("refreshButton")
                    .textContent = "↻";

            }
        );
}


/* =========================
   INITIALIZATION
========================= */

async function initialize(){

    setupNavigation();
    setupMobileMenu();
    setupTheme();
    setupGlobalSearch();
    setupExplorerSearch();
    setupDetailButton();
    setupRefresh();

    $("addHoldingButton")
        .addEventListener(
            "click",
            openHoldingModal
        );

    $("closeHoldingModal")
        .addEventListener(
            "click",
            closeHoldingModal
        );

    $("saveHolding")
        .addEventListener(
            "click",
            saveNewHolding
        );

    await Promise.all([
        loadMarket(),
        loadMarketCoins(),
        loadTrending(),
        loadBitcoinChart(),
        loadFearGreed()
    ]);

    renderWatchlist();
    updateWatchlistCount();
    renderPortfolio();

    $("watchlistIntelligence").textContent =
        getWatchlist().length +
        (
            getWatchlist().length === 1
                ? " asset"
                : " assets"
        );
}

initialize();


/* =========================
   AUTOMATIC REFRESH
========================= */

setInterval(
    loadMarket,
    60000
);

setInterval(
    async () => {

        await loadMarketCoins();

        renderPortfolio();

    },
    60000
);

setInterval(
    loadTrending,
    300000
);

setInterval(
    loadBitcoinChart,
    300000
);

setInterval(
    loadFearGreed,
    300000
);
