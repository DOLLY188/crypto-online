/* =========================================================
   CRYPTO ONLINE
   MASTER SCRIPT
   STEP 10 → STEP 35
   PART 1 OF 4

   Core
   Market Data
   Movers
   Trending
   Advanced Charts
   Coin Explorer
   Screener
   Compare
========================================================= */

"use strict";


/* =========================================================
   CORE CONFIGURATION
========================================================= */

const API =
    "https://api.coingecko.com/api/v3";

const FNG_API =
    "https://api.alternative.me/fng/?limit=1";

const NEWS_API =
    "https://min-api.cryptocompare.com/data/v2/news/?lang=EN";

const MEMPOOL_API =
    "https://mempool.space/api";


/* =========================================================
   GLOBAL STATE
========================================================= */

let allCoins = [];

let coinPage = 1;
let coinsPerPage = 25;

let watchlist = JSON.parse(
    localStorage.getItem(
        "cryptoOnlineWatchlist"
    ) || "[]"
);

let portfolio = JSON.parse(
    localStorage.getItem(
        "cryptoOnlinePortfolio"
    ) || "[]"
);

let compareSelection = [];

let coinCache = {};

let currentDetailCoinId = null;

let cryptoNews = [];

let newsCategory = "latest";
let newsSearch = "";

let cryptoAcademyProgress =
    JSON.parse(
        localStorage.getItem(
            "cryptoOnlineAcademyProgress"
        ) || "{}"
    );

let cryptoAIHistory =
    JSON.parse(
        localStorage.getItem(
            "cryptoOnlineAIHistory"
        ) || "[]"
    );

let cryptoAlerts =
    JSON.parse(
        localStorage.getItem(
            "cryptoOnlineAlerts"
        ) || "[]"
    );

let onChainTransactions =
    JSON.parse(
        localStorage.getItem(
            "cryptoOnlineOnChainTransactions"
        ) || "[]"
    );

let portfolioTransactions =
    JSON.parse(
        localStorage.getItem(
            "cryptoOnlineTransactions"
        ) || "[]"
    );

let advancedChartCoinId =
    "bitcoin";

let advancedChartRange =
    "7D";

let advancedChartView =
    "price";

let advancedChartMode =
    "line";

let compareChart = null;
let btcChart = null;
let btcVolumeChart = null;
let coinDetailChart = null;
let coinTerminalChart = null;

let portfolioAllocationChart = null;

let cryptoOnlineGlobalData = null;

window.cryptoOnlineGlobalData = null;


/* =========================================================
   BASIC HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function escapeHTML(value) {

    if (value === null ||
        value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatMoney(value, digits = 2) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
    ) {
        return "--";
    }

    return Number(value).toLocaleString(
        "en-US",
        {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: digits
        }
    );
}


function formatCompactMoney(value) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
    ) {
        return "--";
    }

    const n = Number(value);

    if (Math.abs(n) >= 1e12) {
        return "$" +
            (n / 1e12).toFixed(2) +
            "T";
    }

    if (Math.abs(n) >= 1e9) {
        return "$" +
            (n / 1e9).toFixed(2) +
            "B";
    }

    if (Math.abs(n) >= 1e6) {
        return "$" +
            (n / 1e6).toFixed(2) +
            "M";
    }

    if (Math.abs(n) >= 1e3) {
        return "$" +
            (n / 1e3).toFixed(2) +
            "K";
    }

    return formatMoney(n);
}


function formatPrice(value) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
    ) {
        return "--";
    }

    const n = Number(value);

    if (n >= 1000) {
        return "$" +
            n.toLocaleString(
                "en-US",
                {
                    maximumFractionDigits: 2
                }
            );
    }

    if (n >= 1) {
        return "$" +
            n.toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4
                }
            );
    }

    return "$" +
        n.toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 4,
                maximumFractionDigits: 8
            }
        );
}


function formatPercent(value) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
    ) {
        return "--";
    }

    const n = Number(value);

    return (
        n >= 0 ? "+" : ""
    ) +
        n.toFixed(2) +
        "%";
}


function percentClass(value) {

    const n = Number(value);

    if (n > 0) {
        return "positive";
    }

    if (n < 0) {
        return "negative";
    }

    return "";
}


function formatSupply(value) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
    ) {
        return "--";
    }

    return Number(value).toLocaleString(
        "en-US",
        {
            maximumFractionDigits: 4
        }
    );
}


function showToast(message) {

    let toast = $("appToast");

    if (!toast) {
        return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(
        window.cryptoToastTimer
    );

    window.cryptoToastTimer =
        setTimeout(
            () => {
                toast.classList.remove(
                    "show"
                );
            },
            3000
        );
}


async function safeFetch(
    url,
    options = {}
) {

    try {

        const response =
            await fetch(
                url,
                options
            );

        if (!response.ok) {
            throw new Error(
                "HTTP " +
                response.status
            );
        }

        return await response.json();

    } catch (error) {

        console.log(
            "API error:",
            url,
            error
        );

        return null;
    }
}


/* =========================================================
   MARKET DATA
========================================================= */

async function loadMarket() {

    const data =
        await safeFetch(
            `${API}/global`
        );

    if (!data ||
        !data.data) {
        return;
    }

    const m = data.data;

    cryptoOnlineGlobalData = m;

    window.cryptoOnlineGlobalData =
        m;


    const stats =
        document.querySelectorAll(
            ".stat-value"
        );


    if (stats[0]) {

        stats[0].textContent =
            formatCompactMoney(
                m.total_market_cap.usd
            );

    }


    if (stats[1]) {

        stats[1].textContent =
            formatCompactMoney(
                m.total_volume.usd
            );

    }


    if (stats[2]) {

        stats[2].textContent =
            Number(
                m.market_cap_percentage.btc
            ).toFixed(1) +
            "%";

    }


    if (stats[3]) {

        stats[3].textContent =
            Number(
                m.market_cap_percentage.eth
            ).toFixed(1) +
            "%";

    }


    loadMarketTerminal25();
    renderAdvancedMarketIntelligence();
    renderMarketDashboard32();
}


async function loadCoins() {

    const data =
        await safeFetch(
            `${API}/coins/markets?` +
            `vs_currency=usd&` +
            `order=market_cap_desc&` +
            `per_page=100&` +
            `page=1&` +
            `sparkline=false&` +
            `price_change_percentage=1h,24h,7d,30d`
        );

    if (!Array.isArray(data)) {
        return;
    }

    allCoins = data;

    data.forEach(
        coin => {
            coinCache[coin.id] = coin;
        }
    );


    renderMarketPrice();
    renderMovers();
    renderExplorer27();
    renderScreener();
    populateSelectors();
    renderWatchlist();
    renderPortfolio();
    renderPortfolioPro29();
    renderScreener20();
    renderMarketDashboard32();
    updatePortfolioAnalytics();
    updateAlerts23();
}


/* =========================================================
   BTC / MARKET PRICE
========================================================= */

function renderMarketPrice() {

    const btc =
        allCoins.find(
            coin =>
                coin.id === "bitcoin"
        );

    if (!btc) {
        return;
    }


    const price =
        document.querySelector(
            ".chart-price strong"
        );

    const change =
        document.querySelector(
            ".chart-price span"
        );

    const title =
        document.querySelector(
            ".asset-title h3"
        );

    const symbol =
        document.querySelector(
            ".asset-title span"
        );


    if (price) {
        price.textContent =
            formatPrice(
                btc.current_price
            );
    }


    if (change) {

        change.textContent =
            formatPercent(
                btc.price_change_percentage_24h
            );

        change.className =
            percentClass(
                btc.price_change_percentage_24h
            );

    }


    if (title) {
        title.textContent =
            btc.name;
    }


    if (symbol) {
        symbol.textContent =
            btc.symbol.toUpperCase();
    }
}


/* =========================================================
   MARKET MOVERS
========================================================= */

function createMoverCard(coin) {

    return `
        <div
            class="coin-list-item"
            data-coin-id="${escapeHTML(coin.id)}"
        >

            <img
                src="${escapeHTML(coin.image)}"
                alt="${escapeHTML(coin.name)}"
            >

            <div class="coin-list-info">

                <strong>
                    ${escapeHTML(coin.name)}
                </strong>

                <span>
                    ${escapeHTML(
                        coin.symbol.toUpperCase()
                    )}
                </span>

            </div>

            <div class="coin-list-price">

                <strong>
                    ${formatPrice(
                        coin.current_price
                    )}
                </strong>

                <span class="${percentClass(
                    coin.price_change_percentage_24h
                )}">
                    ${formatPercent(
                        coin.price_change_percentage_24h
                    )}
                </span>

            </div>

        </div>
    `;
}


function renderMovers() {

    if (!allCoins.length) {
        return;
    }


    const sorted =
        [...allCoins].sort(
            (a, b) =>
                Number(
                    b.price_change_percentage_24h || 0
                ) -
                Number(
                    a.price_change_percentage_24h || 0
                )
        );


    const gainers =
        sorted.slice(0, 5);

    const losers =
        sorted
            .slice()
            .reverse()
            .slice(0, 5);


    const gainersEl =
        $("topGainers");

    const losersEl =
        $("topLosers");

    const trendingEl =
        $("trendingCoins");


    if (gainersEl) {

        gainersEl.innerHTML =
            gainers
                .map(createMoverCard)
                .join("");

    }


    if (losersEl) {

        losersEl.innerHTML =
            losers
                .map(createMoverCard)
                .join("");

    }


    if (trendingEl) {

        trendingEl.innerHTML =
            allCoins
                .slice(0, 5)
                .map(createMoverCard)
                .join("");

    }


    document
        .querySelectorAll(
            ".coin-list-item[data-coin-id]"
        )
        .forEach(
            item => {

                item.onclick = () => {

                    loadCoinDetails(
                        item.dataset.coinId
                    );

                };

            }
        );
}


/* =========================================================
   FEAR & GREED
========================================================= */

async function loadFearGreed() {

    const data =
        await safeFetch(
            FNG_API
        );

    if (
        !data ||
        !Array.isArray(data.data) ||
        !data.data[0]
    ) {
        return;
    }

    const result =
        data.data[0];

    const value =
        Number(result.value);

    const classification =
        result.value_classification;


    const valueElement =
        $("fearGreedValue");

    const labelElement =
        $("fearGreedLabel");

    const sentimentElement =
        $("marketSentiment");

    const intelligenceElement =
        $("sentimentIntelligence");


    if (valueElement) {
        valueElement.textContent =
            value;
    }


    if (labelElement) {
        labelElement.textContent =
            classification;
    }


    if (sentimentElement) {
        sentimentElement.textContent =
            classification;
    }


    if (intelligenceElement) {

        intelligenceElement.textContent =
            classification +
            " (" +
            value +
            ")";

    }


    renderAdvancedMarketIntelligence();
    renderMarketDashboard32();
}


/* =========================================================
   BITCOIN ADVANCED CHART
========================================================= */

function getChartDays(range) {

    const values = {
        "24H": 1,
        "7D": 7,
        "30D": 30,
        "90D": 90,
        "1Y": 365
    };

    return values[range] || 7;
}


async function loadAdvancedChart() {

    const data =
        await safeFetch(
            `${API}/coins/${advancedChartCoinId}` +
            `/market_chart?vs_currency=usd` +
            `&days=${getChartDays(
                advancedChartRange
            )}` +
            `&interval=daily`
        );

    if (!data) {
        return;
    }


    const prices =
        data.prices || [];

    const volumes =
        data.total_volumes || [];


    const labels =
        prices.map(
            item =>
                new Date(
                    item[0]
                ).toLocaleDateString()
        );


    let chartValues =
        prices.map(
            item =>
                Number(item[1])
        );


    if (
        advancedChartView ===
        "change"
    ) {

        const base =
            chartValues[0] || 1;

        chartValues =
            chartValues.map(
                value =>
                    (
                        (
                            value -
                            base
                        ) /
                        base
                    ) *
                    100
            );

    }


    const canvas =
        $("btcChart");

    if (!canvas) {
        return;
    }


    if (btcChart) {
        btcChart.destroy();
    }


    btcChart =
        new Chart(
            canvas.getContext("2d"),
            {
                type:
                    advancedChartMode ===
                    "area"
                        ? "line"
                        : "line",

                data: {

                    labels,

                    datasets: [

                        {
                            label:
                                advancedChartView ===
                                "change"
                                    ? "% Change"
                                    : "Price",

                            data:
                                chartValues,

                            fill:
                                advancedChartMode ===
                                "area",

                            tension:
                                0.25,

                            borderWidth:
                                2,

                            pointRadius:
                                0

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    interaction: {
                        intersect:
                            false,
                        mode:
                            "index"
                    },

                    plugins: {

                        legend: {
                            display:
                                false
                        }

                    },

                    scales: {

                        x: {
                            ticks: {
                                maxTicksLimit:
                                    8
                            }
                        },

                        y: {
                            ticks: {

                                callback:
                                    value =>
                                        advancedChartView ===
                                        "change"
                                            ? value + "%"
                                            : formatPrice(
                                                value
                                            )

                            }

                        }

                    }

                }

            }
        );


    const volumeCanvas =
        $("btcVolumeChart");

    if (
        volumeCanvas &&
        volumes.length
    ) {

        if (btcVolumeChart) {
            btcVolumeChart.destroy();
        }


        btcVolumeChart =
            new Chart(
                volumeCanvas.getContext(
                    "2d"
                ),
                {
                    type: "bar",

                    data: {

                        labels,

                        datasets: [

                            {
                                label:
                                    "Volume",

                                data:
                                    volumes.map(
                                        item =>
                                            Number(
                                                item[1]
                                            )
                                    ),

                                borderWidth:
                                    0

                            }

                        ]

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        plugins: {
                            legend: {
                                display:
                                    false
                            }
                        }

                    }

                }
            );

    }
}


function injectAdvancedChartControls() {

    const chartPanel =
        document.querySelector(
            ".chart-panel"
        );

    if (!chartPanel ||
        chartPanel.dataset.controlsReady) {
        return;
    }

    chartPanel.dataset.controlsReady =
        "true";


    const controls =
        document.createElement(
            "div"
        );

    controls.className =
        "advanced-chart-controls";


    controls.innerHTML = `

        <select id="advancedChartCoin">

            <option value="bitcoin">
                Bitcoin
            </option>

        </select>


        <div class="chart-range-buttons">

            ${[
                "24H",
                "7D",
                "30D",
                "90D",
                "1Y"
            ].map(
                range =>
                    `<button
                        data-range="${range}"
                        class="${
                            range ===
                            advancedChartRange
                                ? "active"
                                : ""
                        }"
                    >
                        ${range}
                    </button>`
            ).join("")}

        </div>


        <div class="chart-view-buttons">

            <button
                data-view="price"
                class="active"
            >
                Price
            </button>

            <button
                data-view="change"
            >
                % Change
            </button>

            <button
                data-mode="line"
                class="active"
            >
                Line
            </button>

            <button
                data-mode="area"
            >
                Area
            </button>

        </div>

    `;


    chartPanel
        .querySelector(
            ".panel-header"
        )
        ?.insertAdjacentElement(
            "afterend",
            controls
        );


    const select =
        $("advancedChartCoin");

    if (select) {

        allCoins
            .slice(0, 100)
            .forEach(
                coin => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        coin.id;

                    option.textContent =
                        coin.name +
                        " (" +
                        coin.symbol
                            .toUpperCase() +
                        ")";

                    select.appendChild(
                        option
                    );

                }
            );


        select.value =
            advancedChartCoinId;


        select.onchange = () => {

            advancedChartCoinId =
                select.value;

            loadAdvancedChart();

        };

    }


    controls
        .querySelectorAll(
            "[data-range]"
        )
        .forEach(
            button => {

                button.onclick = () => {

                    advancedChartRange =
                        button.dataset.range;

                    controls
                        .querySelectorAll(
                            "[data-range]"
                        )
                        .forEach(
                            b =>
                                b.classList
                                    .remove(
                                        "active"
                                    )
                        );

                    button.classList.add(
                        "active"
                    );

                    loadAdvancedChart();

                };

            }
        );


    controls
        .querySelectorAll(
            "[data-view]"
        )
        .forEach(
            button => {

                button.onclick = () => {

                    advancedChartView =
                        button.dataset.view;

                    controls
                        .querySelectorAll(
                            "[data-view]"
                        )
                        .forEach(
                            b =>
                                b.classList
                                    .remove(
                                        "active"
                                    )
                        );

                    button.classList.add(
                        "active"
                    );

                    loadAdvancedChart();

                };

            }
        );


    controls
        .querySelectorAll(
            "[data-mode]"
        )
        .forEach(
            button => {

                button.onclick = () => {

                    advancedChartMode =
                        button.dataset.mode;

                    controls
                        .querySelectorAll(
                            "[data-mode]"
                        )
                        .forEach(
                            b =>
                                b.classList
                                    .remove(
                                        "active"
                                    )
                        );

                    button.classList.add(
                        "active"
                    );

                    loadAdvancedChart();

                };

            }
        );
}


async function loadBitcoinChart() {

    injectAdvancedChartControls();

    await loadAdvancedChart();
}


/* =========================================================
   EXPLORER 2.0
========================================================= */

let explorer27State = {

    search: "",

    quickFilter:
        "all",

    minMarketCap: "",
    maxMarketCap: "",

    minVolume: "",
    maxVolume: "",

    minChange: "",
    maxChange: "",

    minRank: "",
    maxRank: "",

    sort:
        "market_cap_rank",

    direction:
        "asc",

    page:
        1,

    perPage:
        20
};


function getExplorerData() {

    let data =
        [...allCoins];


    const s =
        explorer27State.search
            .trim()
            .toLowerCase();


    if (s) {

        data =
            data.filter(
                coin =>
                    coin.name
                        .toLowerCase()
                        .includes(s) ||
                    coin.symbol
                        .toLowerCase()
                        .includes(s) ||
                    coin.id
                        .toLowerCase()
                        .includes(s)
            );

    }


    if (
        explorer27State.quickFilter ===
        "gainers"
    ) {

        data =
            data.filter(
                coin =>
                    Number(
                        coin.price_change_percentage_24h
                    ) > 0
            );

    }


    if (
        explorer27State.quickFilter ===
        "losers"
    ) {

        data =
            data.filter(
                coin =>
                    Number(
                        coin.price_change_percentage_24h
                    ) < 0
            );

    }


    if (
        explorer27State.quickFilter ===
        "top10"
    ) {

        data =
            data.filter(
                coin =>
                    coin.market_cap_rank <= 10
            );

    }


    if (
        explorer27State.quickFilter ===
        "top50"
    ) {

        data =
            data.filter(
                coin =>
                    coin.market_cap_rank <= 50
            );

    }


    const filters = [

        [
            "minMarketCap",
            "market_cap",
            ">="
        ],

        [
            "maxMarketCap",
            "market_cap",
            "<="
        ],

        [
            "minVolume",
            "total_volume",
            ">="
        ],

        [
            "maxVolume",
            "total_volume",
            "<="
        ],

        [
            "minChange",
            "price_change_percentage_24h",
            ">="
        ],

        [
            "maxChange",
            "price_change_percentage_24h",
            "<="
        ],

        [
            "minRank",
            "market_cap_rank",
            ">="
        ],

        [
            "maxRank",
            "market_cap_rank",
            "<="
        ]

    ];


    filters.forEach(
        filter => {

            const state =
                explorer27State[
                    filter[0]
                ];

            if (
                state !== "" &&
                state !== null &&
                state !== undefined
            ) {

                const number =
                    Number(state);

                if (
                    Number.isFinite(
                        number
                    )
                ) {

                    data =
                        data.filter(
                            coin => {

                                const value =
                                    Number(
                                        coin[
                                            filter[1]
                                        ]
                                    );

                                return filter[2] ===
                                    ">="
                                        ? value >= number
                                        : value <= number;

                            }
                        );

                }

            }

        }
    );


    const sortKey =
        explorer27State.sort;


    data.sort(
        (a, b) => {

            const av =
                Number(
                    a[sortKey] || 0
                );

            const bv =
                Number(
                    b[sortKey] || 0
                );

            return explorer27State.direction ===
                "asc"
                    ? av - bv
                    : bv - av;

        }
    );


    return data;
}


function renderExplorer27() {

    const container =
        $("explorer27");

    if (!container) {
        return;
    }


    const data =
        getExplorerData();


    const total =
        data.length;


    const positive =
        data.filter(
            coin =>
                Number(
                    coin.price_change_percentage_24h
                ) > 0
        ).length;


    const negative =
        data.filter(
            coin =>
                Number(
                    coin.price_change_percentage_24h
                ) < 0
        ).length;


    const start =
        (
            explorer27State.page -
            1
        ) *
        explorer27State.perPage;


    const pageData =
        data.slice(
            start,
            start +
            explorer27State.perPage
        );


    container.innerHTML = `

        <div class="explorer27-toolbar">

            <input
                id="explorer27Search"
                placeholder="Search asset..."
                value="${escapeHTML(
                    explorer27State.search
                )}"
            >


            <select id="explorer27Filter">

                <option value="all">
                    All
                </option>

                <option value="gainers">
                    Gainers
                </option>

                <option value="losers">
                    Losers
                </option>

                <option value="top10">
                    Top 10
                </option>

                <option value="top50">
                    Top 50
                </option>

            </select>


            <select id="explorer27Sort">

                <option value="market_cap_rank">
                    Market Rank
                </option>

                <option value="market_cap">
                    Market Cap
                </option>

                <option value="current_price">
                    Price
                </option>

                <option value="price_change_percentage_24h">
                    24H Change
                </option>

                <option value="total_volume">
                    Volume
                </option>

            </select>


            <select id="explorer27Direction">

                <option value="asc">
                    Ascending
                </option>

                <option value="desc">
                    Descending
                </option>

            </select>

        </div>


        <div class="explorer27-stats">

            <div>
                <span>Matching</span>
                <strong>${total}</strong>
            </div>

            <div>
                <span>Positive</span>
                <strong>${positive}</strong>
            </div>

            <div>
                <span>Negative</span>
                <strong>${negative}</strong>
            </div>

        </div>


        <div class="explorer27-table">

            <div class="explorer27-row explorer27-head">

                <span>Rank</span>
                <span>Asset</span>
                <span>Price</span>
                <span>24H</span>
                <span>Market Cap</span>
                <span>Volume</span>
                <span>Supply</span>
                <span>Actions</span>

            </div>

            ${
                pageData.length
                    ? pageData
                        .map(
                            createExplorer27Row
                        )
                        .join("")
                    : `
                        <div class="empty-state">
                            No matching assets.
                        </div>
                    `
            }

        </div>


        <div class="explorer27-pagination">

            <button
                id="explorer27Prev"
                ${explorer27State.page <= 1
                    ? "disabled"
                    : ""}
            >
                Previous
            </button>

            <span>
                Page ${explorer27State.page}
                /
                ${Math.max(
                    1,
                    Math.ceil(
                        total /
                        explorer27State.perPage
                    )
                )}
            </span>

            <button
                id="explorer27Next"
                ${
                    start +
                    explorer27State.perPage >=
                    total
                        ? "disabled"
                        : ""
                }
            >
                Next
            </button>

        </div>

    `;


    const search =
        $("explorer27Search");

    const filter =
        $("explorer27Filter");

    const sort =
        $("explorer27Sort");

    const direction =
        $("explorer27Direction");


    if (search) {

        search.oninput =
            () => {

                explorer27State.search =
                    search.value;

                explorer27State.page =
                    1;

                renderExplorer27();

            };

    }


    if (filter) {

        filter.value =
            explorer27State.quickFilter;

        filter.onchange =
            () => {

                explorer27State.quickFilter =
                    filter.value;

                explorer27State.page =
                    1;

                renderExplorer27();

            };

    }


    if (sort) {

        sort.value =
            explorer27State.sort;

        sort.onchange =
            () => {

                explorer27State.sort =
                    sort.value;

                renderExplorer27();

            };

    }


    if (direction) {

        direction.value =
            explorer27State.direction;

        direction.onchange =
            () => {

                explorer27State.direction =
                    direction.value;

                renderExplorer27();

            };

    }


    $("explorer27Prev")
        ?.addEventListener(
            "click",
            () => {

                if (
                    explorer27State.page >
                    1
                ) {

                    explorer27State.page--;

                    renderExplorer27();

                }

            }
        );


    $("explorer27Next")
        ?.addEventListener(
            "click",
            () => {

                if (
                    explorer27State.page <
                    Math.ceil(
                        total /
                        explorer27State.perPage
                    )
                ) {

                    explorer27State.page++;

                    renderExplorer27();

                }

            }
        );


    container
        .querySelectorAll(
            "[data-explorer-action]"
        )
        .forEach(
            button => {

                button.onclick =
                    event => {

                        event.stopPropagation();

                        const id =
                            button.dataset.coinId;

                        if (
                            button.dataset.explorerAction ===
                            "details"
                        ) {

                            loadCoinDetails(
                                id
                            );

                        }

                        if (
                            button.dataset.explorerAction ===
                            "watch"
                        ) {

                            toggleWatchlist(
                                id
                            );

                        }

                    };

            }
        );

}


function createExplorer27Row(
    coin
) {

    return `

        <div
            class="explorer27-row"
            data-coin-id="${escapeHTML(
                coin.id
            )}"
        >

            <span>
                #${coin.market_cap_rank || "--"}
            </span>


            <span class="explorer-asset">

                <img
                    src="${escapeHTML(
                        coin.image
                    )}"
                    alt=""
                >

                <strong>
                    ${escapeHTML(
                        coin.name
                    )}
                </strong>

                <small>
                    ${escapeHTML(
                        coin.symbol.toUpperCase()
                    )}
                </small>

            </span>


            <span>
                ${formatPrice(
                    coin.current_price
                )}
            </span>


            <span class="${percentClass(
                coin.price_change_percentage_24h
            )}">
                ${formatPercent(
                    coin.price_change_percentage_24h
                )}
            </span>


            <span>
                ${formatCompactMoney(
                    coin.market_cap
                )}
            </span>


            <span>
                ${formatCompactMoney(
                    coin.total_volume
                )}
            </span>


            <span>
                ${formatSupply(
                    coin.circulating_supply
                )}
            </span>


            <span class="explorer-actions">

                <button
                    data-explorer-action="details"
                    data-coin-id="${escapeHTML(
                        coin.id
                    )}"
                >
                    Details
                </button>

                <button
                    data-explorer-action="watch"
                    data-coin-id="${escapeHTML(
                        coin.id
                    )}"
                >
                    ☆
                </button>

            </span>

        </div>

    `;
}


/* =========================================================
   SCREENER 1.0
========================================================= */

let screenerQuickFilter =
    "all";


function getScreenerData() {

    let data =
        [...allCoins];


    const search =
        $("screenerSearch")
            ?.value
            .trim()
            .toLowerCase() || "";


    if (search) {

        data =
            data.filter(
                coin =>
                    coin.name
                        .toLowerCase()
                        .includes(search) ||
                    coin.symbol
                        .toLowerCase()
                        .includes(search)
            );

    }


    if (
        screenerQuickFilter ===
        "gainers"
    ) {

        data =
            data.filter(
                coin =>
                    Number(
                        coin.price_change_percentage_24h
                    ) > 0
            );

    }


    if (
        screenerQuickFilter ===
        "losers"
    ) {

        data =
            data.filter(
                coin =>
                    Number(
                        coin.price_change_percentage_24h
                    ) < 0
            );

    }


    if (
        screenerQuickFilter ===
        "top10"
    ) {

        data =
            data.filter(
                coin =>
                    coin.market_cap_rank <= 10
            );

    }


    if (
        screenerQuickFilter ===
        "top50"
    ) {

        data =
            data.filter(
                coin =>
                    coin.market_cap_rank <= 50
            );

    }


    const minChange =
        Number(
            $("screenerMinChange")
                ?.value
        );

    const maxChange =
        Number(
            $("screenerMaxChange")
                ?.value
        );

    const minCap =
        Number(
            $("screenerMinMarketCap")
                ?.value
        );

    const maxCap =
        Number(
            $("screenerMaxMarketCap")
                ?.value
        );


    if (Number.isFinite(minChange) &&
        $("screenerMinChange")
            ?.value !== "") {

        data =
            data.filter(
                coin =>
                    Number(
                        coin.price_change_percentage_24h
                    ) >= minChange
            );

    }


    if (Number.isFinite(maxChange) &&
        $("screenerMaxChange")
            ?.value !== "") {

        data =
            data.filter(
                coin =>
                    Number(
                        coin.price_change_percentage_24h
                    ) <= maxChange
            );

    }


    if (Number.isFinite(minCap) &&
        $("screenerMinMarketCap")
            ?.value !== "") {

        data =
            data.filter(
                coin =>
                    Number(
                        coin.market_cap
                    ) >= minCap
            );

    }


    if (Number.isFinite(maxCap) &&
        $("screenerMaxMarketCap")
            ?.value !== "") {

        data =
            data.filter(
                coin =>
                    Number(
                        coin.market_cap
                    ) <= maxCap
            );

    }


    const sort =
        $("screenerSort")
            ?.value ||
        "market_cap_rank";


    const direction =
        $("screenerDirection")
            ?.value ||
        "asc";


    data.sort(
        (a, b) => {

            const av =
                Number(
                    a[sort] || 0
                );

            const bv =
                Number(
                    b[sort] || 0
                );

            return direction ===
                "asc"
                    ? av - bv
                    : bv - av;

        }
    );


    return data;
}


function renderScreener() {

    const container =
        $("screenerTable");

    if (!container) {
        return;
    }


    const data =
        getScreenerData();


    const start =
        (
            coinPage -
            1
        ) *
        coinsPerPage;


    const pageData =
        data.slice(
            start,
            start +
            coinsPerPage
        );


    const count =
        $("screenerCount");


    if (count) {

        count.textContent =
            `${data.length} assets found`;

    }


    container.innerHTML = `

        <div class="screener-row screener-head">

            <span>Rank</span>
            <span>Asset</span>
            <span>Price</span>
            <span>24H</span>
            <span>Market Cap</span>
            <span>Volume</span>
            <span>Action</span>

        </div>


        ${
            pageData.length
                ? pageData
                    .map(
                        coin =>
                            `
                            <div
                                class="screener-row"
                                data-coin-id="${escapeHTML(
                                    coin.id
                                )}"
                            >

                                <span>
                                    #${coin.market_cap_rank || "--"}
                                </span>

                                <span>
                                    <strong>
                                        ${escapeHTML(
                                            coin.name
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            coin.symbol.toUpperCase()
                                        )}
                                    </small>
                                </span>

                                <span>
                                    ${formatPrice(
                                        coin.current_price
                                    )}
                                </span>

                                <span class="${percentClass(
                                    coin.price_change_percentage_24h
                                )}">
                                    ${formatPercent(
                                        coin.price_change_percentage_24h
                                    )}
                                </span>

                                <span>
                                    ${formatCompactMoney(
                                        coin.market_cap
                                    )}
                                </span>

                                <span>
                                    ${formatCompactMoney(
                                        coin.total_volume
                                    )}
                                </span>

                                <span>

                                    <button
                                        data-action="details"
                                        data-id="${escapeHTML(
                                            coin.id
                                        )}"
                                    >
                                        Details
                                    </button>

                                    <button
                                        data-action="watch"
                                        data-id="${escapeHTML(
                                            coin.id
                                        )}"
                                    >
                                        ☆
                                    </button>

                                </span>

                            </div>
                            `
                    )
                    .join("")
                : `
                    <div class="empty-state">
                        No matching assets.
                    </div>
                `
        }

    `;


    const pages =
        Math.max(
            1,
            Math.ceil(
                data.length /
                coinsPerPage
            )
        );


    const pagination =
        $("screenerPagination");


    if (pagination) {

        pagination.innerHTML = `

            <button
                ${
                    coinPage <= 1
                        ? "disabled"
                        : ""
                }
                id="screenerPrev"
            >
                Previous
            </button>

            <span>
                Page ${coinPage} / ${pages}
            </span>

            <button
                ${
                    coinPage >= pages
                        ? "disabled"
                        : ""
                }
                id="screenerNext"
            >
                Next
            </button>

        `;


        $("screenerPrev")
            ?.addEventListener(
                "click",
                () => {

                    if (coinPage > 1) {

                        coinPage--;

                        renderScreener();

                    }

                }
            );


        $("screenerNext")
            ?.addEventListener(
                "click",
                () => {

                    if (
                        coinPage <
                        pages
                    ) {

                        coinPage++;

                        renderScreener();

                    }

                }
            );

    }


    container
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(
            button => {

                button.onclick =
                    event => {

                        event.stopPropagation();

                        const id =
                            button.dataset.id;

                        if (
                            button.dataset.action ===
                            "details"
                        ) {

                            loadCoinDetails(
                                id
                            );

                        } else {

                            toggleWatchlist(
                                id
                            );

                        }

                    };

            }
        );


    container
        .querySelectorAll(
            ".screener-row[data-coin-id]"
        )
        .forEach(
            row => {

                row.onclick = () => {

                    loadCoinDetails(
                        row.dataset.coinId
                    );

                };

            }
        );
}


function setupScreenerEvents() {

    [
        "screenerSearch",
        "screenerQuickFilter",
        "screenerSort",
        "screenerDirection",
        "screenerMinChange",
        "screenerMaxChange",
        "screenerMinMarketCap",
        "screenerMaxMarketCap"
    ].forEach(
        id => {

            $(id)?.addEventListener(
                "input",
                () => {

                    if (
                        id ===
                        "screenerQuickFilter"
                    ) {

                        screenerQuickFilter =
                            $(id).value;

                    }

                    coinPage = 1;

                    renderScreener();

                }
            );

            $(id)?.addEventListener(
                "change",
                () => {

                    if (
                        id ===
                        "screenerQuickFilter"
                    ) {

                        screenerQuickFilter =
                            $(id).value;

                    }

                    coinPage = 1;

                    renderScreener();

                }
            );

        }
    );


    $("resetScreener")
        ?.addEventListener(
            "click",
            () => {

                [
                    "screenerSearch",
                    "screenerMinChange",
                    "screenerMaxChange",
                    "screenerMinMarketCap",
                    "screenerMaxMarketCap"
                ].forEach(
                    id => {

                        if ($(id)) {
                            $(id).value =
                                "";
                        }

                    }
                );


                if ($("screenerQuickFilter")) {
                    $("screenerQuickFilter")
                        .value =
                        "all";
                }


                screenerQuickFilter =
                    "all";

                coinPage =
                    1;

                renderScreener();

            }
        );
}


/* =========================================================
   COMPARE
========================================================= */

function populateCompareSelectors() {

    [
        "compareCoin1",
        "compareCoin2",
        "compareCoin3"
    ].forEach(
        id => {

            const select =
                $(id);

            if (!select) {
                return;
            }

            const current =
                select.value;

            const isThird =
                id ===
                "compareCoin3";


            select.innerHTML =
                `<option value="">
                    ${
                        isThird
                            ? "None"
                            : "Select cryptocurrency"
                    }
                </option>`;


            allCoins
                .slice(0, 100)
                .forEach(
                    coin => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            coin.id;

                        option.textContent =
                            coin.name +
                            " (" +
                            coin.symbol
                                .toUpperCase() +
                            ")";

                        select.appendChild(
                            option
                        );

                    }
                );


            if (current) {
                select.value =
                    current;
            }

        }
    );
}


async function compareCoins() {

    const ids = [
        $("compareCoin1")?.value,
        $("compareCoin2")?.value,
        $("compareCoin3")?.value
    ].filter(Boolean);


    const unique =
        [...new Set(ids)];


    const status =
        $("compareStatus");

    const results =
        $("compareResults");


    if (unique.length < 2) {

        if (status) {
            status.textContent =
                "Select at least two cryptocurrencies to compare.";
        }

        return;
    }


    if (status) {
        status.textContent =
            "Loading comparison data...";
    }


    const details =
        [];


    for (
        const id of unique
    ) {

        let coin =
            coinCache[id];


        if (
            !coin ||
            !coin.market_cap
        ) {

            const data =
                await safeFetch(
                    `${API}/coins/${id}`
                );

            if (data) {
                coin = data;
                coinCache[id] =
                    data;
            }

        }


        if (coin) {
            details.push(
                coin
            );

        }

    }


    renderComparison(
        details
    );
}


function renderComparison(
    coins
) {

    const results =
        $("compareResults");

    const status =
        $("compareStatus");


    if (!results) {
        return;
    }


    if (status) {

        status.textContent =
            `${coins.length} assets selected for comparison.`;

    }


    results.innerHTML = `

        <div class="compare-cards">

            ${
                coins.map(
                    coin =>
                        `
                        <div class="compare-card">

                            <div class="compare-card-header">

                                <img
                                    src="${escapeHTML(
                                        coin.image?.large ||
                                        coin.image
                                    )}"
                                    alt=""
                                >

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            coin.name
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            coin.symbol?.toUpperCase()
                                        )}
                                    </span>

                                </div>

                            </div>


                            <div class="compare-metrics">

                                <div>
                                    <span>Price</span>
                                    <strong>
                                        ${formatPrice(
                                            coin.market_data
                                                ?.current_price
                                                ?.usd ||
                                            coin.current_price
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>Market Cap</span>
                                    <strong>
                                        ${formatCompactMoney(
                                            coin.market_data
                                                ?.market_cap
                                                ?.usd ||
                                            coin.market_cap
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>24H</span>
                                    <strong class="${percentClass(
                                        coin.market_data
                                            ?.price_change_percentage_24h ||
                                        coin.price_change_percentage_24h
                                    )}">
                                        ${formatPercent(
                                            coin.market_data
                                                ?.price_change_percentage_24h ||
                                            coin.price_change_percentage_24h
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>Volume</span>
                                    <strong>
                                        ${formatCompactMoney(
                                            coin.market_data
                                                ?.total_volume
                                                ?.usd ||
                                            coin.total_volume
                                        )}
                                    </strong>
                                </div>

                            </div>

                        </div>
                        `
                ).join("")
            }

        </div>

    `;

}


/* =========================================================
   END PART 1
========================================================= */
/* =========================================================
   CRYPTO ONLINE
   MASTER SCRIPT
   STEP 10 → STEP 35
   PART 2 OF 4

   Coin Details
   Watchlist
   Portfolio
   Portfolio Intelligence
   Portfolio Pro
   Screener 2.0
========================================================= */


/* =========================================================
   COIN DETAILS
========================================================= */

async function loadCoinDetails(
    id
) {

    if (!id) {
        return;
    }


    currentDetailCoinId =
        id;


    const section =
        $("coin-details");


    if (section) {
        section.scrollIntoView({
            behavior: "smooth"
        });
    }


    let coin =
        coinCache[id];


    if (
        !coin ||
        !coin.market_data ||
        !coin.description
    ) {

        coin =
            await safeFetch(
                `${API}/coins/${id}` +
                `?localization=false` +
                `&tickers=false` +
                `&market_data=true` +
                `&community_data=false` +
                `&developer_data=false`
            );

        if (coin) {
            coinCache[id] =
                coin;
        }

    }


    if (!coin) {
        showToast(
            "Unable to load coin details."
        );
        return;
    }


    displayCoinDetails(
        coin
    );

    await loadCoinDetailChart(
        id
    );

    renderCoinTerminal28(
        coin
    );

    populateAISelector();
}


function displayCoinDetails(
    coin
) {

    const market =
        coin.market_data ||
        {};


    if ($("detailCoinImage")) {

        $("detailCoinImage")
            .src =
            coin.image?.large ||
            coin.image?.small ||
            "";

    }


    if ($("detailCoinName")) {

        $("detailCoinName")
            .textContent =
            coin.name ||
            "--";

    }


    if ($("detailCoinSymbol")) {

        $("detailCoinSymbol")
            .textContent =
            coin.symbol
                ? coin.symbol.toUpperCase()
                : "--";

    }


    if ($("detailCoinRank")) {

        $("detailCoinRank")
            .textContent =
            coin.market_cap_rank ||
            "--";

    }


    if ($("detailCoinPrice")) {

        $("detailCoinPrice")
            .textContent =
            formatPrice(
                market.current_price?.usd
            );

    }


    if ($("detailCoinChange")) {

        const change =
            market.price_change_percentage_24h;

        $("detailCoinChange")
            .textContent =
            formatPercent(
                change
            );

        $("detailCoinChange")
            .className =
            percentClass(
                change
            );

    }


    if ($("detailMarketCap")) {

        $("detailMarketCap")
            .textContent =
            formatCompactMoney(
                market.market_cap?.usd
            );

    }


    if ($("detailVolume")) {

        $("detailVolume")
            .textContent =
            formatCompactMoney(
                market.total_volume?.usd
            );

    }


    if ($("detailCirculating")) {

        $("detailCirculating")
            .textContent =
            formatSupply(
                market.circulating_supply
            );

    }


    if ($("detailTotalSupply")) {

        $("detailTotalSupply")
            .textContent =
            formatSupply(
                market.total_supply
            );

    }


    if ($("detailAth")) {

        $("detailAth")
            .textContent =
            formatPrice(
                market.ath?.usd
            );

    }


    if ($("detailAtl")) {

        $("detailAtl")
            .textContent =
            formatPrice(
                market.atl?.usd
            );

    }


    if ($("detailDescription")) {

        const description =
            coin.description?.en ||
            "No description available.";

        $("detailDescription")
            .innerHTML =
            description;

    }


    updateDetailWatchButton(
        coin.id
    );
}


async function loadCoinDetailChart(
    id
) {

    const data =
        await safeFetch(
            `${API}/coins/${id}` +
            `/market_chart?vs_currency=usd` +
            `&days=7`
        );


    if (!data) {
        return;
    }


    const canvas =
        $("coinDetailChart");


    if (!canvas) {
        return;
    }


    if (coinDetailChart) {
        coinDetailChart.destroy();
    }


    const prices =
        data.prices || [];


    coinDetailChart =
        new Chart(
            canvas.getContext("2d"),
            {
                type: "line",

                data: {

                    labels:
                        prices.map(
                            item =>
                                new Date(
                                    item[0]
                                ).toLocaleDateString()
                        ),

                    datasets: [

                        {
                            data:
                                prices.map(
                                    item =>
                                        item[1]
                                ),

                            borderWidth:
                                2,

                            pointRadius:
                                0,

                            tension:
                                0.25,

                            fill:
                                true

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {
                        legend: {
                            display:
                                false
                        }
                    }

                }

            }
        );
}


/* =========================================================
   WATCHLIST
========================================================= */

function saveWatchlist() {

    localStorage.setItem(
        "cryptoOnlineWatchlist",
        JSON.stringify(
            watchlist
        )
    );
}


function isWatched(
    id
) {

    return watchlist.includes(
        id
    );

}


function toggleWatchlist(
    id
) {

    if (!id) {
        return;
    }


    if (
        watchlist.includes(id)
    ) {

        watchlist =
            watchlist.filter(
                item =>
                    item !== id
            );

        showToast(
            "Removed from watchlist."
        );

    } else {

        watchlist.push(
            id
        );

        showToast(
            "Added to watchlist."
        );

    }


    saveWatchlist();

    renderWatchlist();

    updateDetailWatchButton(
        id
    );

    renderPortfolioPro29();
    renderMarketDashboard32();
}


function updateDetailWatchButton(
    id
) {

    const button =
        $("detailWatchButton");

    if (!button) {
        return;
    }


    button.textContent =
        isWatched(id)
            ? "Remove from Watchlist"
            : "Add to Watchlist";


    button.onclick =
        () => {

            toggleWatchlist(
                id
            );

        };
}


function renderWatchlist() {

    const container =
        $("watchlistContainer");


    const count =
        $("watchlistCount");


    if (count) {
        count.textContent =
            watchlist.length;
    }


    if (!container) {
        return;
    }


    const coins =
        watchlist
            .map(
                id =>
                    allCoins.find(
                        coin =>
                            coin.id === id
                    ) ||
                    coinCache[id]
            )
            .filter(Boolean);


    if (!coins.length) {

        container.innerHTML = `

            <div class="empty-state">

                <strong>
                    Your watchlist is empty
                </strong>

                <p>
                    Add cryptocurrencies from
                    the market explorer.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        coins
            .map(
                coin =>
                    `

                    <div
                        class="watchlist-card"
                        data-watch-id="${escapeHTML(
                            coin.id
                        )}"
                    >

                        <div class="watchlist-card-header">

                            <img
                                src="${escapeHTML(
                                    coin.image
                                )}"
                                alt=""
                            >

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        coin.name
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        coin.symbol.toUpperCase()
                                    )}
                                </span>

                            </div>

                        </div>


                        <div class="watchlist-price">

                            <strong>
                                ${formatPrice(
                                    coin.current_price
                                )}
                            </strong>

                            <span class="${percentClass(
                                coin.price_change_percentage_24h
                            )}">
                                ${formatPercent(
                                    coin.price_change_percentage_24h
                                )}
                            </span>

                        </div>


                        <button
                            class="secondary-button"
                            data-remove-watch="${escapeHTML(
                                coin.id
                            )}"
                        >
                            Remove
                        </button>

                    </div>

                    `
            )
            .join("");


    container
        .querySelectorAll(
            "[data-watch-id]"
        )
        .forEach(
            card => {

                card.onclick =
                    event => {

                        if (
                            event.target
                                .dataset
                                .removeWatch
                        ) {
                            return;
                        }

                        loadCoinDetails(
                            card.dataset.watchId
                        );

                    };

            }
        );


    container
        .querySelectorAll(
            "[data-remove-watch]"
        )
        .forEach(
            button => {

                button.onclick =
                    event => {

                        event.stopPropagation();

                        toggleWatchlist(
                            button.dataset
                                .removeWatch
                        );

                    };

            }
        );
}


/* =========================================================
   PORTFOLIO STORAGE
========================================================= */

function savePortfolio() {

    localStorage.setItem(
        "cryptoOnlinePortfolio",
        JSON.stringify(
            portfolio
        )
    );
}


function addPortfolioHolding() {

    const coinId =
        $("portfolioCoin")
            ?.value;

    const quantity =
        Number(
            $("portfolioQuantity")
                ?.value
        );

    const buyPrice =
        Number(
            $("portfolioBuyPrice")
                ?.value
        );


    if (
        !coinId ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(buyPrice) ||
        buyPrice < 0
    ) {

        showToast(
            "Enter valid portfolio information."
        );

        return;
    }


    const existing =
        portfolio.find(
            item =>
                item.coinId ===
                coinId
        );


    if (existing) {

        const oldCost =
            existing.quantity *
            existing.buyPrice;

        const newCost =
            quantity *
            buyPrice;

        const totalQuantity =
            existing.quantity +
            quantity;


        existing.buyPrice =
            (
                oldCost +
                newCost
            ) /
            totalQuantity;

        existing.quantity =
            totalQuantity;

    } else {

        portfolio.push({

            coinId,
            quantity,
            buyPrice

        });

    }


    savePortfolio();

    renderPortfolio();

    renderPortfolioPro29();

    updatePortfolioAnalytics();

    showToast(
        "Portfolio holding added."
    );


    if ($("portfolioQuantity")) {
        $("portfolioQuantity")
            .value = "";
    }

    if ($("portfolioBuyPrice")) {
        $("portfolioBuyPrice")
            .value = "";
    }
}


function removePortfolioHolding(
    coinId
) {

    portfolio =
        portfolio.filter(
            item =>
                item.coinId !==
                coinId
        );


    savePortfolio();

    renderPortfolio();

    renderPortfolioPro29();

    updatePortfolioAnalytics();

    showToast(
        "Holding removed."
    );
}


function renderPortfolio() {

    const container =
        $("portfolioTable");


    if (!container) {
        return;
    }


    if (!portfolio.length) {

        container.innerHTML = `

            <div class="empty-state">

                <strong>
                    No portfolio holdings yet.
                </strong>

                <p>
                    Add your first holding above.
                </p>

            </div>

        `;

        updatePortfolioSummary(
            0,
            0,
            0
        );

        return;
    }


    let currentValue = 0;
    let invested = 0;


    const rows =
        portfolio
            .map(
                item => {

                    const coin =
                        allCoins.find(
                            c =>
                                c.id ===
                                item.coinId
                        ) ||
                        coinCache[
                            item.coinId
                        ];


                    if (!coin) {
                        return "";
                    }


                    const current =
                        Number(
                            coin.current_price
                        ) *
                        Number(
                            item.quantity
                        );


                    const cost =
                        Number(
                            item.buyPrice
                        ) *
                        Number(
                            item.quantity
                        );


                    currentValue +=
                        current;

                    invested +=
                        cost;


                    const pnl =
                        current -
                        cost;


                    return `

                        <div class="portfolio-row">

                            <span>

                                <strong>
                                    ${escapeHTML(
                                        coin.name
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        coin.symbol.toUpperCase()
                                    )}
                                </small>

                            </span>


                            <span>
                                ${formatSupply(
                                    item.quantity
                                )}
                            </span>


                            <span>
                                ${formatPrice(
                                    item.buyPrice
                                )}
                            </span>


                            <span>
                                ${formatPrice(
                                    coin.current_price
                                )}
                            </span>


                            <span class="${percentClass(
                                pnl
                            )}">
                                ${formatMoney(
                                    pnl
                                )}
                            </span>


                            <span>

                                <button
                                    data-remove-portfolio="${escapeHTML(
                                        coin.id
                                    )}"
                                >
                                    Remove
                                </button>

                            </span>

                        </div>

                    `;

                }
            )
            .join("");


    container.innerHTML = `

        <div class="portfolio-row portfolio-head">

            <span>Asset</span>
            <span>Quantity</span>
            <span>Buy Price</span>
            <span>Current</span>
            <span>P/L</span>
            <span>Action</span>

        </div>

        ${rows}

    `;


    container
        .querySelectorAll(
            "[data-remove-portfolio]"
        )
        .forEach(
            button => {

                button.onclick =
                    () => {

                        removePortfolioHolding(
                            button.dataset
                                .removePortfolio
                        );

                    };

            }
        );


    updatePortfolioSummary(
        currentValue,
        invested,
        currentValue -
        invested
    );
}


function updatePortfolioSummary(
    current,
    invested,
    pnl
) {

    if ($("portfolioCurrentValue")) {

        $("portfolioCurrentValue")
            .textContent =
            formatMoney(current);

    }


    if ($("portfolioInvested")) {

        $("portfolioInvested")
            .textContent =
            formatMoney(invested);

    }


    if ($("portfolioProfitLoss")) {

        $("portfolioProfitLoss")
            .textContent =
            formatMoney(pnl);

        $("portfolioProfitLoss")
            .className =
            percentClass(
                pnl
            );

    }


    if ($("portfolioHoldingsCount")) {

        $("portfolioHoldingsCount")
            .textContent =
            portfolio.length;

    }
}


function populatePortfolioSelector() {

    const select =
        $("portfolioCoin");

    if (!select) {
        return;
    }


    const current =
        select.value;


    select.innerHTML =
        `<option value="">
            Select cryptocurrency
        </option>`;


    allCoins
        .slice(0, 100)
        .forEach(
            coin => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    coin.id;

                option.textContent =
                    coin.name +
                    " (" +
                    coin.symbol
                        .toUpperCase() +
                    ")";

                select.appendChild(
                    option
                );

            }
        );


    if (current) {
        select.value =
            current;
    }
}


/* =========================================================
   PORTFOLIO INTELLIGENCE 2.0
========================================================= */

function calculatePortfolio20() {

    let currentValue = 0;
    let invested = 0;

    const holdings = [];


    portfolio.forEach(
        item => {

            const coin =
                allCoins.find(
                    c =>
                        c.id ===
                        item.coinId
                ) ||
                coinCache[
                    item.coinId
                ];


            if (!coin) {
                return;
            }


            const current =
                Number(
                    coin.current_price
                ) *
                Number(
                    item.quantity
                );


            const cost =
                Number(
                    item.buyPrice
                ) *
                Number(
                    item.quantity
                );


            currentValue +=
                current;

            invested +=
                cost;


            holdings.push({

                coin,
                quantity:
                    item.quantity,

                current,
                cost,

                pnl:
                    current -
                    cost,

                returnPct:
                    cost > 0
                        ? (
                            (
                                current -
                                cost
                            ) /
                            cost
                        ) *
                        100
                        : 0

            });

        }
    );


    return {

        currentValue,
        invested,
        pnl:
            currentValue -
            invested,

        pnlPct:
            invested > 0
                ? (
                    (
                        currentValue -
                        invested
                    ) /
                    invested
                ) *
                100
                : 0,

        holdings

    };
}


function updatePortfolioAnalytics() {

    const data =
        calculatePortfolio20();


    const container =
        $("portfolio20");


    if (!container) {
        return;
    }


    if (!data.holdings.length) {

        container.innerHTML = `

            <div class="empty-state">

                <strong>
                    Portfolio Intelligence
                </strong>

                <p>
                    Add holdings to unlock
                    portfolio analytics.
                </p>

            </div>

        `;

        return;
    }


    const largest =
        [...data.holdings]
            .sort(
                (a, b) =>
                    b.current -
                    a.current
            )[0];


    const concentration =
        data.currentValue > 0 &&
        largest
            ? (
                largest.current /
                data.currentValue
            ) *
            100
            : 0;


    container.innerHTML = `

        <div class="portfolio20-grid">

            <div>
                <span>Current Value</span>
                <strong>
                    ${formatMoney(
                        data.currentValue
                    )}
                </strong>
            </div>

            <div>
                <span>Invested</span>
                <strong>
                    ${formatMoney(
                        data.invested
                    )}
                </strong>
            </div>

            <div>
                <span>Unrealized P/L</span>
                <strong class="${percentClass(
                    data.pnl
                )}">
                    ${formatMoney(
                        data.pnl
                    )}
                </strong>
            </div>

            <div>
                <span>Return</span>
                <strong class="${percentClass(
                    data.pnlPct
                )}">
                    ${formatPercent(
                        data.pnlPct
                    )}
                </strong>
            </div>

        </div>


        <div class="portfolio20-insight">

            <strong>
                Portfolio Insight
            </strong>

            <p>
                ${
                    largest
                        ? escapeHTML(
                            largest.coin.name
                        ) +
                        " represents approximately " +
                        concentration.toFixed(1) +
                        "% of current portfolio value."
                        : "No concentration data."
                }
            </p>

        </div>

    `;
}


/* =========================================================
   SCREENER 2.0
========================================================= */

let screener20Mode =
    "all";


function calculateScreener20Score(
    coin
) {

    let score = 50;


    const change24 =
        Number(
            coin.price_change_percentage_24h ||
            0
        );

    const change7 =
        Number(
            coin.price_change_percentage_7d_in_currency?.usd ||
            0
        );


    if (change24 > 0) {
        score += Math.min(
            15,
            change24 * 2
        );
    } else {
        score += Math.max(
            -15,
            change24 * 2
        );
    }


    if (change7 > 0) {
        score += 8;
    } else if (change7 < 0) {
        score -= 8;
    }


    const marketCap =
        Number(
            coin.market_cap ||
            0
        );


    const volume =
        Number(
            coin.total_volume ||
            0
        );


    if (marketCap > 0) {

        const ratio =
            volume /
            marketCap;


        if (ratio > 0.2) {
            score += 10;
        } else if (
            ratio > 0.1
        ) {
            score += 5;
        }

    }


    return Math.max(
        0,
        Math.min(
            100,
            Math.round(score)
        )
    );
}


function renderScreener20() {

    let container =
        $("screener20");


    if (!container) {

        const section =
            $("screener");

        if (!section) {
            return;
        }


        container =
            document.createElement(
                "div"
            );

        container.id =
            "screener20";

        container.className =
            "content-panel";


        section.appendChild(
            container
        );

    }


    let data =
        [...allCoins];


    if (
        screener20Mode ===
        "gainers"
    ) {

        data =
            data.filter(
                c =>
                    Number(
                        c.price_change_percentage_24h
                    ) > 0
            );

    }


    if (
        screener20Mode ===
        "losers"
    ) {

        data =
            data.filter(
                c =>
                    Number(
                        c.price_change_percentage_24h
                    ) < 0
            );

    }


    if (
        screener20Mode ===
        "top10"
    ) {

        data =
            data.slice(0, 10);

    }


    if (
        screener20Mode ===
        "momentum"
    ) {

        data =
            data
                .filter(
                    c =>
                        Number(
                            c.price_change_percentage_24h
                        ) > 0
                )
                .sort(
                    (a, b) =>
                        calculateScreener20Score(b) -
                        calculateScreener20Score(a)
                );

    }


    if (
        screener20Mode ===
        "volume"
    ) {

        data =
            data.sort(
                (a, b) =>
                    (
                        Number(
                            b.total_volume
                        ) /
                        Number(
                            b.market_cap ||
                            1
                        )
                    ) -
                    (
                        Number(
                            a.total_volume
                        ) /
                        Number(
                            a.market_cap ||
                            1
                        )
                    )
            );

    }


    container.innerHTML = `

        <div class="screener20-toolbar">

            <strong>
                Screener 2.0
            </strong>

            <div>

                ${[
                    ["all","All"],
                    ["momentum","Momentum"],
                    ["volume","Volume"],
                    ["gainers","Gainers"],
                    ["losers","Losers"],
                    ["top10","Top 10"]
                ].map(
                    item =>
                        `
                        <button
                            data-s20-mode="${item[0]}"
                            class="${
                                screener20Mode ===
                                item[0]
                                    ? "active"
                                    : ""
                            }"
                        >
                            ${item[1]}
                        </button>
                        `
                ).join("")}

            </div>

        </div>


        <div class="screener20-table">

            <div class="screener20-row screener20-head">

                <span>Asset</span>
                <span>Price</span>
                <span>24H</span>
                <span>Volume</span>
                <span>Market Cap</span>
                <span>Rank</span>
                <span>Signal Score</span>

            </div>


            ${
                data
                    .slice(0, 50)
                    .map(
                        coin =>
                            `

                            <div class="screener20-row">

                                <span>
                                    <strong>
                                        ${escapeHTML(
                                            coin.name
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            coin.symbol.toUpperCase()
                                        )}
                                    </small>
                                </span>

                                <span>
                                    ${formatPrice(
                                        coin.current_price
                                    )}
                                </span>

                                <span class="${percentClass(
                                    coin.price_change_percentage_24h
                                )}">
                                    ${formatPercent(
                                        coin.price_change_percentage_24h
                                    )}
                                </span>

                                <span>
                                    ${formatCompactMoney(
                                        coin.total_volume
                                    )}
                                </span>

                                <span>
                                    ${formatCompactMoney(
                                        coin.market_cap
                                    )}
                                </span>

                                <span>
                                    #${coin.market_cap_rank || "--"}
                                </span>

                                <span>
                                    ${calculateScreener20Score(
                                        coin
                                    )}
                                </span>

                            </div>

                            `
                    )
                    .join("")
            }

        </div>


        <small>
            Signal Score is a transparent market-data
            score based on current momentum and activity.
            It is not a prediction or trading signal.
        </small>

    `;


    container
        .querySelectorAll(
            "[data-s20-mode]"
        )
        .forEach(
            button => {

                button.onclick =
                    () => {

                        screener20Mode =
                            button.dataset
                                .s20Mode;

                        renderScreener20();

                    };

            }
        );
}


/* =========================================================
   END PART 2
========================================================= */
/* =========================================================
   CRYPTO ONLINE
   MASTER SCRIPT
   STEP 10 → STEP 35
   PART 3 OF 4

   News
   Market Intelligence
   AI Coin Analysis
   AI Assistant
   Crypto Tools
   Academy
   Alerts
   On-Chain Intelligence
   Categories
========================================================= */


/* =========================================================
   NEWS CENTER
========================================================= */

async function loadCryptoNews() {

    const data =
        await safeFetch(
            NEWS_API
        );


    if (
        !data ||
        !Array.isArray(data.Data)
    ) {
        return;
    }


    cryptoNews =
        data.Data.slice(
            0,
            50
        );


    renderCryptoNews();
}


function newsMatches(
    item
) {

    const text =
        (
            item.title +
            " " +
            (
                item.body ||
                ""
            )
        )
        .toLowerCase();


    if (newsSearch) {

        if (
            !text.includes(
                newsSearch
                    .toLowerCase()
            )
        ) {
            return false;
        }

    }


    if (
        newsCategory ===
        "latest"
    ) {
        return true;
    }


    if (
        newsCategory ===
        "bitcoin"
    ) {
        return text.includes(
            "bitcoin"
        );
    }


    if (
        newsCategory ===
        "ethereum"
    ) {
        return text.includes(
            "ethereum"
        );
    }


    if (
        newsCategory ===
        "altcoins"
    ) {

        return (
            text.includes("solana") ||
            text.includes("cardano") ||
            text.includes("xrp") ||
            text.includes("dogecoin") ||
            text.includes("altcoin")
        );

    }


    if (
        newsCategory ===
        "market"
    ) {

        return (
            text.includes("market") ||
            text.includes("price") ||
            text.includes("trading")
        );

    }


    return true;
}


function renderCryptoNews() {

    const grid =
        $("cryptoNewsGrid");

    const status =
        $("cryptoNewsStatus");


    if (!grid) {
        return;
    }


    const items =
        cryptoNews
            .filter(newsMatches)
            .slice(0, 30);


    if (status) {

        status.textContent =
            `${items.length} news stories`;

    }


    if (!items.length) {

        grid.innerHTML = `

            <div class="empty-state">

                No news matches your search.

            </div>

        `;

        return;
    }


    grid.innerHTML =
        items
            .map(
                item => {

                    const image =
                        item.imageurl ||
                        "";


                    const time =
                        item.published_on
                            ? new Date(
                                item.published_on *
                                1000
                            ).toLocaleString()
                            : "";


                    return `

                        <article
                            class="news-card"
                        >

                            ${
                                image
                                    ? `
                                        <img
                                            src="${escapeHTML(
                                                image
                                            )}"
                                            alt=""
                                        >
                                      `
                                    : ""
                            }


                            <div class="news-card-body">

                                <small>
                                    ${escapeHTML(
                                        item.source_info?.name ||
                                        item.source ||
                                        "Crypto News"
                                    )}
                                </small>

                                <h3>
                                    ${escapeHTML(
                                        item.title
                                    )}
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        (
                                            item.body ||
                                            ""
                                        ).slice(
                                            0,
                                            180
                                        )
                                    )}
                                </p>

                                <span>
                                    ${escapeHTML(
                                        time
                                    )}
                                </span>

                                <a
                                    href="${escapeHTML(
                                        item.url
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Read Article →
                                </a>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");
}


function setupNewsEvents() {

    $("cryptoNewsSearch")
        ?.addEventListener(
            "input",
            event => {

                newsSearch =
                    event.target.value;

                renderCryptoNews();

            }
        );


    document
        .querySelectorAll(
            ".news-category"
        )
        .forEach(
            button => {

                button.onclick =
                    () => {

                        newsCategory =
                            button.dataset
                                .category;


                        document
                            .querySelectorAll(
                                ".news-category"
                            )
                            .forEach(
                                b =>
                                    b.classList
                                        .remove(
                                            "active"
                                        )
                            );


                        button.classList.add(
                            "active"
                        );

                        renderCryptoNews();

                    };

            }
        );


    $("refreshCryptoNews")
        ?.addEventListener(
            "click",
            loadCryptoNews
        );
}


/* =========================================================
   MARKET INTELLIGENCE
========================================================= */

function getMarketBreadth() {

    if (!allCoins.length) {

        return {
            positive: 0,
            negative: 0,
            neutral: 0
        };

    }


    let positive = 0;
    let negative = 0;
    let neutral = 0;


    allCoins.forEach(
        coin => {

            const change =
                Number(
                    coin.price_change_percentage_24h ||
                    0
                );


            if (change > 0.05) {
                positive++;
            } else if (
                change < -0.05
            ) {
                negative++;
            } else {
                neutral++;
            }

        }
    );


    return {
        positive,
        negative,
        neutral
    };
}


function getFearGreedValue() {

    const value =
        Number(
            $("fearGreedValue")
                ?.textContent
        );


    return Number.isFinite(value)
        ? value
        : null;
}


function getMarketRegime() {

    const breadth =
        getMarketBreadth();


    const total =
        breadth.positive +
        breadth.negative +
        breadth.neutral;


    const ratio =
        total
            ? breadth.positive /
              total
            : 0.5;


    const btc =
        allCoins.find(
            coin =>
                coin.id ===
                "bitcoin"
        );


    const btcChange =
        Number(
            btc?.price_change_percentage_24h ||
            0
        );


    const fearGreed =
        getFearGreedValue();


    if (
        ratio > 0.58 &&
        btcChange > 0
    ) {

        return "Expansion";

    }


    if (
        ratio < 0.42 &&
        btcChange < 0
    ) {

        return "Defensive";

    }


    return "Mixed";
}


function renderAdvancedMarketIntelligence() {

    const container =
        $("advancedMarketIntelligence");


    if (!container) {
        return;
    }


    const btc =
        allCoins.find(
            coin =>
                coin.id ===
                "bitcoin"
        );


    const breadth =
        getMarketBreadth();


    const total =
        breadth.positive +
        breadth.negative +
        breadth.neutral;


    const breadthPercent =
        total
            ? (
                breadth.positive /
                total
            ) *
            100
            : 0;


    const fearGreed =
        getFearGreedValue();


    container.innerHTML = `

        <div class="intelligence-grid">

            <div class="intelligence-item">

                <span>
                    Fear & Greed
                </span>

                <strong>
                    ${
                        fearGreed === null
                            ? "--"
                            : fearGreed
                    }
                </strong>

            </div>


            <div class="intelligence-item">

                <span>
                    BTC 24H
                </span>

                <strong class="${percentClass(
                    btc?.price_change_percentage_24h
                )}">
                    ${formatPercent(
                        btc?.price_change_percentage_24h
                    )}
                </strong>

            </div>


            <div class="intelligence-item">

                <span>
                    BTC Dominance
                </span>

                <strong>
                    ${
                        cryptoOnlineGlobalData
                            ?.market_cap_percentage
                            ?.btc
                            ? Number(
                                cryptoOnlineGlobalData
                                    .market_cap_percentage
                                    .btc
                            ).toFixed(1) +
                              "%"
                            : "--"
                    }
                </strong>

            </div>


            <div class="intelligence-item">

                <span>
                    Positive Breadth
                </span>

                <strong>
                    ${breadthPercent.toFixed(1)}%
                </strong>

            </div>

        </div>


        <div class="intelligence-briefing">

            <h3>
                Market Briefing
            </h3>

            <p>
                Current market regime:
                <strong>
                    ${getMarketRegime()}
                </strong>.
                This description reflects current
                market data and does not predict future
                prices.
            </p>

            <p>
                ${breadth.positive}
                tracked assets are positive,
                ${breadth.negative}
                are negative and
                ${breadth.neutral}
                are near unchanged over the
                selected 24-hour market snapshot.
            </p>

        </div>

    `;
}


/* =========================================================
   AI COIN ANALYSIS
========================================================= */

async function runAICoinAnalysis() {

    const selector =
        $("aiCoinSelector");

    const result =
        $("aiAnalysisResult");


    const id =
        selector?.value;


    if (!id || !result) {
        return;
    }


    result.innerHTML = `

        <div class="loading-state">
            Analysing market data...
        </div>

    `;


    let coin =
        coinCache[id];


    if (
        !coin ||
        !coin.market_data
    ) {

        coin =
            await safeFetch(
                `${API}/coins/${id}` +
                `?localization=false` +
                `&tickers=false` +
                `&market_data=true`
            );


        if (coin) {
            coinCache[id] =
                coin;
        }

    }


    if (!coin) {

        result.innerHTML = `

            <div class="empty-state">
                Unable to retrieve asset data.
            </div>

        `;

        return;
    }


    const market =
        coin.market_data;


    const change24 =
        Number(
            market.price_change_percentage_24h ||
            0
        );


    const change7 =
        Number(
            market.price_change_percentage_7d ||
            0
        );


    const change30 =
        Number(
            market.price_change_percentage_30d ||
            0
        );


    const volume =
        Number(
            market.total_volume?.usd ||
            0
        );


    const cap =
        Number(
            market.market_cap?.usd ||
            0
        );


    const volumeRatio =
        cap > 0
            ? volume / cap
            : 0;


    const ath =
        Number(
            market.ath?.usd ||
            0
        );


    const current =
        Number(
            market.current_price?.usd ||
            0
        );


    const athDistance =
        ath > 0
            ? (
                (
                    current -
                    ath
                ) /
                ath
            ) *
            100
            : 0;


    let score = 50;


    if (change24 > 0) {
        score += 10;
    } else {
        score -= 10;
    }


    if (change7 > 0) {
        score += 10;
    } else {
        score -= 10;
    }


    if (change30 > 0) {
        score += 10;
    } else {
        score -= 10;
    }


    if (volumeRatio > 0.1) {
        score += 5;
    }


    score =
        Math.max(
            0,
            Math.min(
                100,
                score
            )
        );


    let signal =
        "Mixed";

    if (score >= 70) {
        signal =
            "Positive Momentum";
    } else if (
        score <= 30
    ) {
        signal =
            "Weak Momentum";
    }


    result.innerHTML = `

        <div class="ai-analysis-grid">

            <div>
                <span>Data Score</span>
                <strong>${score}/100</strong>
            </div>

            <div>
                <span>24H</span>
                <strong class="${percentClass(
                    change24
                )}">
                    ${formatPercent(
                        change24
                    )}
                </strong>
            </div>

            <div>
                <span>7D</span>
                <strong class="${percentClass(
                    change7
                )}">
                    ${formatPercent(
                        change7
                    )}
                </strong>
            </div>

            <div>
                <span>30D</span>
                <strong class="${percentClass(
                    change30
                )}">
                    ${formatPercent(
                        change30
                    )}
                </strong>
            </div>

        </div>


        <div class="ai-analysis-summary">

            <h3>
                ${escapeHTML(
                    coin.name
                )}
            </h3>

            <p>
                Current data shows
                <strong>
                    ${signal}
                </strong>.
                The asset is currently
                ${formatPercent(
                    athDistance
                )}
                from its recorded all-time high.
            </p>

            <p>
                24-hour trading volume is
                ${formatCompactMoney(
                    volume
                )},
                compared with a market capitalization
                of
                ${formatCompactMoney(
                    cap
                )}.
            </p>

            <small>
                This is a data-based market summary,
                not a guarantee of future performance
                and not personalized financial advice.
            </small>

        </div>

    `;
}


function populateAISelector() {

    const select =
        $("aiCoinSelector");

    if (!select) {
        return;
    }


    const current =
        select.value;


    select.innerHTML =
        `<option value="">
            Select a cryptocurrency
        </option>`;


    allCoins
        .slice(0, 100)
        .forEach(
            coin => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    coin.id;

                option.textContent =
                    coin.name +
                    " (" +
                    coin.symbol.toUpperCase() +
                    ")";

                select.appendChild(
                    option
                );

            }
        );


    if (current) {
        select.value =
            current;
    }
}


/* =========================================================
   AI ASSISTANT
========================================================= */

function saveAIHistory() {

    localStorage.setItem(
        "cryptoOnlineAIHistory",
        JSON.stringify(
            cryptoAIHistory
        )
    );
}


function getAIResponse(
    question
) {

    const q =
        question
            .toLowerCase()
            .trim();


    const btc =
        allCoins.find(
            coin =>
                coin.id ===
                "bitcoin"
        );


    const eth =
        allCoins.find(
            coin =>
                coin.id ===
                "ethereum"
        );


    const fearGreed =
        getFearGreedValue();


    if (
        q.includes("bitcoin") &&
        q.includes("price")
    ) {

        return btc
            ? `Bitcoin is currently around ${formatPrice(
                btc.current_price
            )}, with a 24-hour move of ${formatPercent(
                btc.price_change_percentage_24h
            )}.`
            : "Bitcoin data is currently unavailable.";

    }


    if (
        q.includes("fear") ||
        q.includes("greed") ||
        q.includes("sentiment")
    ) {

        return fearGreed === null
            ? "The Fear & Greed value is currently unavailable."
            : `The current Fear & Greed value is ${fearGreed}. The index is a market-sentiment indicator, not a guarantee of future price movement.`;

    }


    if (
        q.includes("market cap")
    ) {

        return cryptoOnlineGlobalData
            ? `The global crypto market capitalization is approximately ${formatCompactMoney(
                cryptoOnlineGlobalData
                    .total_market_cap
                    .usd
            )}.`
            : "Global market-cap data is currently unavailable.";

    }


    if (
        q.includes("ethereum")
    ) {

        return eth
            ? `Ethereum is currently around ${formatPrice(
                eth.current_price
            )}, with a 24-hour move of ${formatPercent(
                eth.price_change_percentage_24h
            )}.`
            : "Ethereum data is currently unavailable.";

    }


    if (
        q.includes("watchlist")
    ) {

        return `Your watchlist currently contains ${watchlist.length} asset(s).`;

    }


    if (
        q.includes("portfolio")
    ) {

        const data =
            calculatePortfolio20();

        return `Your tracked portfolio has ${data.holdings.length} holding(s), with a current value of ${formatMoney(
            data.currentValue
        )} and an unrealized P/L of ${formatMoney(
            data.pnl
        )}.`;

    }


    if (
        q.includes("gainer") ||
        q.includes("top gain")
    ) {

        const gainers =
            [...allCoins]
                .sort(
                    (a, b) =>
                        Number(
                            b.price_change_percentage_24h ||
                            0
                        ) -
                        Number(
                            a.price_change_percentage_24h ||
                            0
                        )
                )
                .slice(0, 5);


        return gainers.length
            ? "Current top gainers include: " +
              gainers
                  .map(
                      coin =>
                          `${coin.name} (${formatPercent(
                              coin.price_change_percentage_24h
                          )})`
                  )
                  .join(", ") +
              "."
            : "Gainer data is unavailable.";

    }


    if (
        q.includes("blockchain")
    ) {

        return "A blockchain is a distributed ledger where transactions are recorded and verified across a network. Different blockchains use different consensus and execution designs.";

    }


    if (
        q.includes("wallet") ||
        q.includes("private key")
    ) {

        return "A crypto wallet manages access to blockchain assets through cryptographic keys. A private key or seed phrase should never be shared with anyone.";

    }


    if (
        q.includes("analysis") ||
        q.includes("analyse")
    ) {

        return "You can use AI Coin Analysis to inspect current momentum, market position, volume activity and distance from historical highs.";

    }


    return "I can help you understand current crypto market data, Bitcoin, Ethereum, market capitalization, sentiment, movers, your watchlist, portfolio and basic blockchain concepts. Try asking a specific question.";
}


function setupCryptoAI22() {

    const container =
        $("cryptoAI22");

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="crypto-ai-layout">

            <div class="crypto-ai-chat">

                <div
                    id="cryptoAIChat"
                    class="crypto-ai-messages"
                ></div>


                <div class="crypto-ai-input">

                    <input
                        id="cryptoAIInput"
                        placeholder="Ask about the crypto market..."
                    >

                    <button
                        id="cryptoAISend"
                        class="primary-button"
                    >
                        Send
                    </button>

                </div>

            </div>


            <div class="crypto-ai-side">

                <strong>
                    Quick Questions
                </strong>

                <button
                    data-ai-prompt="What is the current Bitcoin price?"
                >
                    Bitcoin price
                </button>

                <button
                    data-ai-prompt="What is the current market sentiment?"
                >
                    Market sentiment
                </button>

                <button
                    data-ai-prompt="What is the global market cap?"
                >
                    Market cap
                </button>

                <button
                    data-ai-prompt="How is my portfolio doing?"
                >
                    Portfolio
                </button>

                <small>
                    This assistant uses the market data
                    available in this application. It is
                    not a remote general-purpose LLM.
                </small>

            </div>

        </div>

    `;


    renderAIChat();


    $("cryptoAISend")
        ?.addEventListener(
            "click",
            sendAIMessage
        );


    $("cryptoAIInput")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    sendAIMessage();

                }

            }
        );


    container
        .querySelectorAll(
            "[data-ai-prompt]"
        )
        .forEach(
            button => {

                button.onclick =
                    () => {

                        $("cryptoAIInput")
                            .value =
                            button.dataset
                                .aiPrompt;

                        sendAIMessage();

                    };

            }
        );
}


function renderAIChat() {

    const chat =
        $("cryptoAIChat");

    if (!chat) {
        return;
    }


    chat.innerHTML =
        cryptoAIHistory
            .slice(-30)
            .map(
                item =>
                    `

                    <div class="ai-message ${item.role}">

                        <strong>
                            ${
                                item.role ===
                                "user"
                                    ? "You"
                                    : "Crypto AI"
                            }
                        </strong>

                        <p>
                            ${escapeHTML(
                                item.text
                            )}
                        </p>

                    </div>

                    `
            )
            .join("");


    chat.scrollTop =
        chat.scrollHeight;
}


function sendAIMessage() {

    const input =
        $("cryptoAIInput");


    const text =
        input?.value.trim();


    if (!text) {
        return;
    }


    cryptoAIHistory.push({

        role:
            "user",

        text

    });


    cryptoAIHistory.push({

        role:
            "assistant",

        text:
            getAIResponse(
                text
            )

    });


    saveAIHistory();

    renderAIChat();

    input.value = "";
}


/* =========================================================
   CRYPTO TOOLS 2.0
========================================================= */

function setupCryptoTools20() {

    const container =
        $("cryptoTools20");

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="crypto-tools-grid">

            <div class="tool-card">

                <h3>
                    Profit / Loss
                </h3>

                <input
                    id="toolBuy"
                    type="number"
                    placeholder="Buy price"
                >

                <input
                    id="toolSell"
                    type="number"
                    placeholder="Sell/current price"
                >

                <input
                    id="toolQuantity"
                    type="number"
                    placeholder="Quantity"
                >

                <button
                    id="toolProfitButton"
                    class="primary-button"
                >
                    Calculate
                </button>

                <strong id="toolProfitResult">
                    --
                </strong>

            </div>


            <div class="tool-card">

                <h3>
                    Percentage Change
                </h3>

                <input
                    id="toolPercentStart"
                    type="number"
                    placeholder="Starting value"
                >

                <input
                    id="toolPercentEnd"
                    type="number"
                    placeholder="Ending value"
                >

                <button
                    id="toolPercentButton"
                    class="primary-button"
                >
                    Calculate
                </button>

                <strong id="toolPercentResult">
                    --
                </strong>

            </div>


            <div class="tool-card">

                <h3>
                    Market Cap
                </h3>

                <input
                    id="toolMarketPrice"
                    type="number"
                    placeholder="Price"
                >

                <input
                    id="toolMarketSupply"
                    type="number"
                    placeholder="Circulating supply"
                >

                <button
                    id="toolMarketButton"
                    class="primary-button"
                >
                    Calculate
                </button>

                <strong id="toolMarketResult">
                    --
                </strong>

            </div>


            <div class="tool-card">

                <h3>
                    DCA Calculator
                </h3>

                <input
                    id="toolDcaAmount"
                    type="number"
                    placeholder="Amount per purchase"
                >

                <input
                    id="toolDcaPurchases"
                    type="number"
                    placeholder="Number of purchases"
                >

                <button
                    id="toolDcaButton"
                    class="primary-button"
                >
                    Calculate
                </button>

                <strong id="toolDcaResult">
                    --
                </strong>

            </div>


            <div class="tool-card">

                <h3>
                    Position Size
                </h3>

                <input
                    id="toolAccountSize"
                    type="number"
                    placeholder="Account size"
                >

                <input
                    id="toolRiskPercent"
                    type="number"
                    placeholder="Risk %"
                >

                <input
                    id="toolStopDistance"
                    type="number"
                    placeholder="Stop distance %"
                >

                <button
                    id="toolPositionButton"
                    class="primary-button"
                >
                    Calculate
                </button>

                <strong id="toolPositionResult">
                    --
                </strong>

            </div>

        </div>

    `;


    $("toolProfitButton")
        ?.addEventListener(
            "click",
            () => {

                const buy =
                    Number(
                        $("toolBuy").value
                    );

                const sell =
                    Number(
                        $("toolSell").value
                    );

                const quantity =
                    Number(
                        $("toolQuantity").value
                    );


                const result =
                    (
                        sell -
                        buy
                    ) *
                    quantity;


                $("toolProfitResult")
                    .textContent =
                    formatMoney(
                        result
                    );

            }
        );


    $("toolPercentButton")
        ?.addEventListener(
            "click",
            () => {

                const start =
                    Number(
                        $("toolPercentStart")
                            .value
                    );

                const end =
                    Number(
                        $("toolPercentEnd")
                            .value
                    );


                const result =
                    start
                        ? (
                            (
                                end -
                                start
                            ) /
                            start
                        ) *
                        100
                        : 0;


                $("toolPercentResult")
                    .textContent =
                    formatPercent(
                        result
                    );

            }
        );


    $("toolMarketButton")
        ?.addEventListener(
            "click",
            () => {

                const price =
                    Number(
                        $("toolMarketPrice")
                            .value
                    );

                const supply =
                    Number(
                        $("toolMarketSupply")
                            .value
                    );


                $("toolMarketResult")
                    .textContent =
                    formatCompactMoney(
                        price *
                        supply
                    );

            }
        );


    $("toolDcaButton")
        ?.addEventListener(
            "click",
            () => {

                const amount =
                    Number(
                        $("toolDcaAmount")
                            .value
                    );

                const purchases =
                    Number(
                        $("toolDcaPurchases")
                            .value
                    );


                $("toolDcaResult")
                    .textContent =
                    formatMoney(
                        amount *
                        purchases
                    );

            }
        );


    $("toolPositionButton")
        ?.addEventListener(
            "click",
            () => {

                const account =
                    Number(
                        $("toolAccountSize")
                            .value
                    );

                const risk =
                    Number(
                        $("toolRiskPercent")
                            .value
                    );

                const stop =
                    Number(
                        $("toolStopDistance")
                            .value
                    );


                const riskAmount =
                    account *
                    (
                        risk /
                        100
                    );


                const position =
                    stop > 0
                        ? riskAmount /
                          (
                              stop /
                              100
                          )
                        : 0;


                $("toolPositionResult")
                    .textContent =
                    formatMoney(
                        position
                    );

            }
        );
}


/* =========================================================
   ACADEMY 2.0
========================================================= */

const cryptoAcademyLessons = [

    {
        id: "crypto-basics",
        level: "Beginner",
        title: "Crypto Basics",
        text: "Learn what cryptocurrency is, why digital assets exist and how crypto markets operate.",
        question: "What is cryptocurrency?",
        answers: [
            "A digital asset secured by cryptography",
            "A physical bank note",
            "A type of engine",
            "A computer monitor"
        ],
        correct: 0
    },

    {
        id: "blockchain",
        level: "Beginner",
        title: "Understanding Blockchain",
        text: "Learn how distributed ledgers record transactions.",
        question: "What does a blockchain primarily provide?",
        answers: [
            "A distributed ledger",
            "A fuel system",
            "A camera",
            "A spreadsheet printer"
        ],
        correct: 0
    },

    {
        id: "bitcoin",
        level: "Beginner",
        title: "Bitcoin",
        text: "Understand Bitcoin, mining and its decentralized design.",
        question: "Bitcoin is primarily designed as what?",
        answers: [
            "A decentralized digital currency",
            "A web browser",
            "A social network",
            "A video codec"
        ],
        correct: 0
    },

    {
        id: "wallets",
        level: "Beginner",
        title: "Crypto Wallets",
        text: "Learn public addresses, private keys and seed phrases.",
        question: "What must be kept secret?",
        answers: [
            "Private keys and seed phrases",
            "A public blockchain address",
            "A coin symbol",
            "A market-cap ranking"
        ],
        correct: 0
    },

    {
        id: "ethereum",
        level: "Intermediate",
        title: "Ethereum",
        text: "Explore Ethereum and its programmable blockchain.",
        question: "Ethereum is widely known for supporting what?",
        answers: [
            "Smart contracts",
            "Car engines",
            "Satellite television",
            "Physical bank cards"
        ],
        correct: 0
    },

    {
        id: "smart-contracts",
        level: "Intermediate",
        title: "Smart Contracts",
        text: "Understand blockchain programs that execute according to coded rules.",
        question: "What is a smart contract?",
        answers: [
            "A blockchain program",
            "A physical contract paper",
            "A bank employee",
            "A mining machine"
        ],
        correct: 0
    },

    {
        id: "defi",
        level: "Intermediate",
        title: "DeFi",
        text: "Learn the basics of decentralized finance.",
        question: "DeFi refers to what?",
        answers: [
            "Decentralized finance",
            "Digital files",
            "Device firmware",
            "Deferred finance"
        ],
        correct: 0
    },

    {
        id: "stablecoins",
        level: "Intermediate",
        title: "Stablecoins",
        text: "Understand crypto assets designed to track reference values.",
        question: "What is a common goal of stablecoins?",
        answers: [
            "Maintain a relatively stable reference value",
            "Increase volatility",
            "Replace computer processors",
            "Store photographs"
        ],
        correct: 0
    },

    {
        id: "onchain",
        level: "Advanced",
        title: "On-Chain Analysis",
        text: "Learn how public blockchain transaction data can be examined.",
        question: "What does on-chain analysis examine?",
        answers: [
            "Blockchain-recorded activity",
            "Private conversations",
            "Physical wallets",
            "Internet passwords"
        ],
        correct: 0
    },

    {
        id: "tokenomics",
        level: "Advanced",
        title: "Tokenomics",
        text: "Study supply, distribution, issuance and token utility.",
        question: "Tokenomics relates primarily to what?",
        answers: [
            "Token economic design",
            "Computer graphics",
            "Vehicle suspension",
            "Email systems"
        ],
        correct: 0
    },

    {
        id: "security",
        level: "Advanced",
        title: "Crypto Security",
        text: "Learn basic practices for protecting digital assets.",
        question: "What should never be shared publicly?",
        answers: [
            "A wallet seed phrase",
            "A coin's ticker",
            "A public address",
            "A market chart"
        ],
        correct: 0
    },

    {
        id: "market-analysis",
        level: "Advanced",
        title: "Crypto Market Analysis",
        text: "Learn how market capitalization, volume, price movement and sentiment can be interpreted.",
        question: "What does market capitalization generally represent?",
        answers: [
            "Price multiplied by circulating supply",
            "Only daily volume",
            "Number of exchanges",
            "Number of wallets"
        ],
        correct: 0
    }

];


function setupCryptoAcademy20() {

    const container =
        $("academy20");

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="academy-progress">

            <div>

                <strong>
                    Academy Progress
                </strong>

                <span id="academyProgressText">
                    0%
                </span>

            </div>

            <div class="academy-progress-bar">

                <span
                    id="academyProgressBar"
                ></span>

            </div>

            <strong id="academyXP">
                0 XP
            </strong>

        </div>


        <div class="academy-filters">

            <button
                data-academy-level="All"
                class="active"
            >
                All
            </button>

            <button
                data-academy-level="Beginner"
            >
                Beginner
            </button>

            <button
                data-academy-level="Intermediate"
            >
                Intermediate
            </button>

            <button
                data-academy-level="Advanced"
            >
                Advanced
            </button>

        </div>


        <div
            id="academyLessons"
            class="academy-grid"
        ></div>

    `;


    renderAcademy20();


    container
        .querySelectorAll(
            "[data-academy-level]"
        )
        .forEach(
            button => {

                button.onclick =
                    () => {

                        container
                            .querySelectorAll(
                                "[data-academy-level]"
                            )
                            .forEach(
                                b =>
                                    b.classList
                                        .remove(
                                            "active"
                                        )
                            );

                        button.classList.add(
                            "active"
                        );

                        renderAcademy20(
                            button.dataset
                                .academyLevel
                        );

                    };

            }
        );
}


function renderAcademy20(
    level = "All"
) {

    const container =
        $("academyLessons");

    if (!container) {
        return;
    }


    const lessons =
        level === "All"
            ? cryptoAcademyLessons
            : cryptoAcademyLessons.filter(
                lesson =>
                    lesson.level ===
                    level
            );


    container.innerHTML =
        lessons
            .map(
                lesson => {

                    const complete =
                        !!cryptoAcademyProgress[
                            lesson.id
                        ];


                    return `

                        <div class="academy-card">

                            <span>
                                ${escapeHTML(
                                    lesson.level
                                )}
                            </span>

                            <h3>
                                ${escapeHTML(
                                    lesson.title
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    lesson.text
                                )}
                            </p>

                            <button
                                data-academy-open="${escapeHTML(
                                    lesson.id
                                )}"
                                class="${
                                    complete
                                        ? "completed"
                                        : ""
                                }"
                            >
                                ${
                                    complete
                                        ? "Completed"
                                        : "Start Lesson"
                                }
                            </button>

                        </div>

                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-academy-open]"
        )
        .forEach(
            button => {

                button.onclick =
                    () => {

                        openAcademyLesson(
                            button.dataset
                                .academyOpen
                        );

                    };

            }
        );


    updateAcademyProgress();
}


function openAcademyLesson(
    id
) {

    const lesson =
        cryptoAcademyLessons.find(
            item =>
                item.id === id
        );


    if (!lesson) {
        return;
    }


    const modal =
        document.createElement(
            "div"
        );

    modal.className =
        "academy-modal";


    modal.innerHTML = `

        <div class="academy-modal-content">

            <button
                class="academy-modal-close"
                id="academyClose"
            >
                ×
            </button>

            <span>
                ${escapeHTML(
                    lesson.level
                )}
            </span>

            <h2>
                ${escapeHTML(
                    lesson.title
                )}
            </h2>

            <p>
                ${escapeHTML(
                    lesson.text
                )}
            </p>


            <div class="academy-question">

                <strong>
                    ${escapeHTML(
                        lesson.question
                    )}
                </strong>


                <div>

                    ${
                        lesson.answers
                            .map(
                                (
                                    answer,
                                    index
                                ) =>
                                    `
                                    <button
                                        data-answer="${index}"
                                    >
                                        ${escapeHTML(
                                            answer
                                        )}
                                    </button>
                                    `
                            )
                            .join("")
                    }

                </div>


                <p
                    id="academyAnswerResult"
                ></p>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    $("academyClose")
        ?.addEventListener(
            "click",
            () => {
                modal.remove();
            }
        );


    modal
        .querySelectorAll(
            "[data-answer]"
        )
        .forEach(
            button => {

                button.onclick =
                    () => {

                        const selected =
                            Number(
                                button.dataset
                                    .answer
                            );


                        const result =
                            $("academyAnswerResult");


                        if (
                            selected ===
                            lesson.correct
                        ) {

                            button.classList.add(
                                "correct"
                            );

                            result.textContent =
                                "Correct! Lesson completed.";

                            cryptoAcademyProgress[
                                lesson.id
                            ] = true;


                            localStorage.setItem(
                                "cryptoOnlineAcademyProgress",
                                JSON.stringify(
                                    cryptoAcademyProgress
                                )
                            );


                            updateAcademyProgress();

                        } else {

                            button.classList.add(
                                "wrong"
                            );

                            result.textContent =
                                "Not quite. Try again.";

                        }

                    };

            }
        );
}


function updateAcademyProgress() {

    const total =
        cryptoAcademyLessons.length;


    const completed =
        cryptoAcademyLessons
            .filter(
                lesson =>
                    cryptoAcademyProgress[
                        lesson.id
                    ]
            ).length;


    const percentage =
        total
            ? Math.round(
                (
                    completed /
                    total
                ) *
                100
            )
            : 0;


    if ($("academyProgressText")) {

        $("academyProgressText")
            .textContent =
            percentage +
            "%";

    }


    if ($("academyProgressBar")) {

        $("academyProgressBar")
            .style.width =
            percentage +
            "%";

    }


    if ($("academyXP")) {

        $("academyXP")
            .textContent =
            (
                completed *
                100
            ) +
            " XP";

    }
}


/* =========================================================
   ALERTS 2.0
========================================================= */

function saveAlerts() {

    localStorage.setItem(
        "cryptoOnlineAlerts",
        JSON.stringify(
            cryptoAlerts
        )
    );
}


function setupAlerts23() {

    const container =
        $("cryptoAlerts23");

    if (!container) {
        return;
    }


    renderAlerts23();


    if (
        "Notification" in window &&
        Notification.permission ===
        "default"
    ) {

        Notification.requestPermission()
            .catch(
                () => {}
            );

    }
}


function renderAlerts23() {

    const container =
        $("cryptoAlerts23");

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="alerts-form">

            <select id="alertCoin">

                <option value="">
                    Select cryptocurrency
                </option>

            </select>


            <select id="alertType">

                <option value="above">
                    Price Above
                </option>

                <option value="below">
                    Price Below
                </option>

                <option value="changeAbove">
                    24H Change Above
                </option>

                <option value="changeBelow">
                    24H Change Below
                </option>

            </select>


            <input
                id="alertValue"
                type="number"
                step="any"
                placeholder="Threshold"
            >


            <button
                id="addAlert"
                class="primary-button"
            >
                Add Alert
            </button>

        </div>


        <div class="alerts-list">

            ${
                cryptoAlerts.length
                    ? cryptoAlerts
                        .map(
                            alert =>
                                `

                                <div class="alert-row">

                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                alert.coinName ||
                                                alert.coinId
                                            )}
                                        </strong>

                                        <span>
                                            ${escapeHTML(
                                                alert.type
                                            )}
                                           :
                                            ${escapeHTML(
                                                alert.value
                                            )}
                                        </span>

                                    </div>

                                    <button
                                        data-delete-alert="${escapeHTML(
                                            alert.id
                                        )}"
                                    >
                                        Delete
                                    </button>

                                </div>

                                `
                        )
                        .join("")
                    : `
                        <div class="empty-state">
                            No alerts created.
                        </div>
                    `
            }

        </div>


        <small>
            Alerts are monitored while this website is
            open. GitHub Pages cannot guarantee background
            notifications after the page is closed.
        </small>

    `;


    populateAlertSelector();


    $("addAlert")
        ?.addEventListener(
            "click",
            addAlert23
        );


    container
        .querySelectorAll(
            "[data-delete-alert]"
        )
        .forEach(
            button => {

                button.onclick =
                    () => {

                        cryptoAlerts =
                            cryptoAlerts.filter(
                                alert =>
                                    alert.id !==
                                    button.dataset
                                        .deleteAlert
                            );

                        saveAlerts();

                        renderAlerts23();

                    };

            }
        );
}


function populateAlertSelector() {

    const select =
        $("alertCoin");

    if (!select) {
        return;
    }


    select.innerHTML =
        `<option value="">
            Select cryptocurrency
        </option>`;


    allCoins
        .slice(0, 100)
        .forEach(
            coin => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    coin.id;

                option.textContent =
                    coin.name +
                    " (" +
                    coin.symbol.toUpperCase() +
                    ")";

                select.appendChild(
                    option
                );

            }
        );
}


function addAlert23() {

    const coinId =
        $("alertCoin")
            ?.value;

    const type =
        $("alertType")
            ?.value;

    const value =
        Number(
            $("alertValue")
                ?.value
        );


    if (
        !coinId ||
        !Number.isFinite(value)
    ) {

        showToast(
            "Enter a valid alert."
        );

        return;
    }


    const coin =
        allCoins.find(
            item =>
                item.id ===
                coinId
        );


    cryptoAlerts.push({

        id:
            Date.now().toString(),

        coinId,

        coinName:
            coin?.name ||
            coinId,

        type,

        value,

        triggered:
            false,

        createdAt:
            new Date().toISOString()

    });


    saveAlerts();

    renderAlerts23();

    showToast(
        "Alert created."
    );
}


function updateAlerts23() {

    if (!allCoins.length) {
        return;
    }


    cryptoAlerts.forEach(
        alert => {

            const coin =
                allCoins.find(
                    item =>
                        item.id ===
                        alert.coinId
                );


            if (!coin ||
                alert.triggered) {
                return;
            }


            const price =
                Number(
                    coin.current_price
                );


            const change =
                Number(
                    coin.price_change_percentage_24h ||
                    0
                );


            let hit = false;


            if (
                alert.type ===
                "above"
            ) {

                hit =
                    price >=
                    Number(
                        alert.value
                    );

            }


            if (
                alert.type ===
                "below"
            ) {

                hit =
                    price <=
                    Number(
                        alert.value
                    );

            }


            if (
                alert.type ===
                "changeAbove"
            ) {

                hit =
                    change >=
                    Number(
                        alert.value
                    );

            }


            if (
                alert.type ===
                "changeBelow"
            ) {

                hit =
                    change <=
                    Number(
                        alert.value
                    );

            }


            if (hit) {

                alert.triggered =
                    true;

                triggerCryptoAlert(
                    alert,
                    coin
                );

            }

        }
    );


    saveAlerts();

    renderAlerts23();
}


function triggerCryptoAlert(
    alert,
    coin
) {

    const message =
        `${coin.name} alert triggered.`;


    showToast(
        message
    );


    if (
        "Notification" in window &&
        Notification.permission ===
        "granted"
    ) {

        new Notification(
            "Crypto Online Alert",
            {
                body:
                    message
            }
        );

    }
}


/* =========================================================
   ON-CHAIN INTELLIGENCE
========================================================= */

async function loadOnChain24() {

    const container =
        $("cryptoOnChain24");

    if (!container) {
        return;
    }


    const [
        mempool,
        fees,
        blocks,
        recent
    ] =
        await Promise.all([

            safeFetch(
                `${MEMPOOL_API}/mempool`
            ),

            safeFetch(
                `${MEMPOOL_API}/v1/fees/recommended`
            ),

            safeFetch(
                `${MEMPOOL_API}/blocks`
            ),

            safeFetch(
                `${MEMPOOL_API}/mempool/recent`
            )

        ]);


    const btc =
        allCoins.find(
            coin =>
                coin.id ===
                "bitcoin"
        );


    const btcPrice =
        Number(
            btc?.current_price ||
            0
        );


    const transactions =
        Array.isArray(recent)
            ? recent
            : [];


    const large =
        transactions
            .filter(
                tx =>
                    Number(
                        tx.value ||
                        0
                    ) >=
                    1000000000
            )
            .slice(0, 10);


    onChainTransactions =
        large.map(
            tx => ({

                txid:
                    tx.txid,

                valueBTC:
                    Number(
                        tx.value
                    ) /
                    100000000,

                usd:
                    (
                        Number(
                            tx.value
                        ) /
                        100000000
                    ) *
                    btcPrice,

                timestamp:
                    Date.now()

            })
        );


    localStorage.setItem(
        "cryptoOnlineOnChainTransactions",
        JSON.stringify(
            onChainTransactions
        )
    );


    container.innerHTML = `

        <div class="onchain-summary">

            <div>
                <span>Block Height</span>
                <strong>
                    ${
                        blocks?.[0]?.height ||
                        "--"
                    }
                </strong>
            </div>

            <div>
                <span>Recommended Fee</span>
                <strong>
                    ${
                        fees?.fastestFee ||
                        "--"
                    }
                    sat/vB
                </strong>
            </div>

            <div>
                <span>Mempool Transactions</span>
                <strong>
                    ${
                        mempool?.count ||
                        "--"
                    }
                </strong>
            </div>

            <div>
                <span>Large Transactions</span>
                <strong>
                    ${large.length}
                </strong>
            </div>

        </div>


        <div class="onchain-table">

            <div class="onchain-row onchain-head">

                <span>Transaction</span>
                <span>BTC</span>
                <span>USD Estimate</span>
                <span>Explorer</span>

            </div>


            ${
                large.length
                    ? large
                        .map(
                            tx =>
                                `

                                <div class="onchain-row">

                                    <span>
                                        ${escapeHTML(
                                            (
                                                tx.txid ||
                                                ""
                                            ).slice(
                                                0,
                                                14
                                            )
                                        )}...
                                    </span>

                                    <span>
                                        ${
                                            (
                                                Number(
                                                    tx.value
                                                ) /
                                                100000000
                                            ).toFixed(4)
                                        }
                                        BTC
                                    </span>

                                    <span>
                                        ${formatMoney(
                                            (
                                                Number(
                                                    tx.value
                                                ) /
                                                100000000
                                            ) *
                                            btcPrice
                                        )}
                                    </span>

                                    <a
                                        href="https://mempool.space/tx/${encodeURIComponent(
                                            tx.txid
                                        )}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View
                                    </a>

                                </div>

                                `
                        )
                        .join("")
                    : `
                        <div class="empty-state">
                            No large recent transactions available.
                        </div>
                    `
            }

        </div>


        <small>
            A large transaction does not by itself prove
            that a whale is buying or selling, and public
            transaction data does not establish identity
            or intent.
        </small>

    `;
}


/* =========================================================
   CATEGORY INTELLIGENCE
========================================================= */

let cryptoCategories26 = [];


async function loadCryptoCategories26() {

    const container =
        $("cryptoCategory26");

    if (!container) {
        return;
    }


    const data =
        await safeFetch(
            `${API}/coins/categories?order=market_cap_desc`
        );


    if (!Array.isArray(data)) {
        return;
    }


    cryptoCategories26 =
        data;


    renderCryptoCategories26();
}


function renderCryptoCategories26() {

    const container =
        $("cryptoCategory26");

    if (!container) {
        return;
    }


    const search =
        container
            .querySelector(
                "#category26Search"
            )
            ?.value
            .toLowerCase() ||
        "";


    const data =
        cryptoCategories26
            .filter(
                category =>
                    !search ||
                    category.name
                        .toLowerCase()
                        .includes(search)
            );


    const largest =
        cryptoCategories26
            .slice()
            .sort(
                (a, b) =>
                    Number(
                        b.market_cap || 0
                    ) -
                    Number(
                        a.market_cap || 0
                    )
            )[0];


    const strongest =
        cryptoCategories26
            .slice()
            .sort(
                (a, b) =>
                    Number(
                        b.market_cap_change_24h || 0
                    ) -
                    Number(
                        a.market_cap_change_24h || 0
                    )
            )[0];


    container.innerHTML = `

        <div class="category26-header">

            <div>

                <strong>
                    Crypto Sector Intelligence
                </strong>

                <p>
                    Compare tracked cryptocurrency
                    categories by market size and
                    24-hour movement.
                </p>

            </div>

        </div>


        <div class="category26-summary">

            <div>
                <span>Categories</span>
                <strong>
                    ${cryptoCategories26.length}
                </strong>
            </div>

            <div>
                <span>Largest</span>
                <strong>
                    ${
                        largest?.name ||
                        "--"
                    }
                </strong>
            </div>

            <div>
                <span>Strongest 24H</span>
                <strong>
                    ${
                        strongest?.name ||
                        "--"
                    }
                </strong>
            </div>

        </div>


        <input
            id="category26Search"
            placeholder="Search categories..."
            value="${escapeHTML(
                search
            )}"
        >


        <div class="category26-table">

            <div class="category26-row category26-head">

                <span>Rank</span>
                <span>Category</span>
                <span>Market Cap</span>
                <span>24H</span>
                <span>Assets</span>

            </div>


            ${
                data
                    .slice(0, 100)
                    .map(
                        (
                            category,
                            index
                        ) =>
                            `

                            <div class="category26-row">

                                <span>
                                    #${index + 1}
                                </span>

                                <span>
                                    ${escapeHTML(
                                        category.name
                                    )}
                                </span>

                                <span>
                                    ${formatCompactMoney(
                                        category.market_cap
                                    )}
                                </span>

                                <span class="${percentClass(
                                    category.market_cap_change_24h
                                )}">
                                    ${formatPercent(
                                        category.market_cap_change_24h
                                    )}
                                </span>

                                <span>
                                    ${
                                        category
                                            .top_3_coins
                                            ?.length ||
                                        "--"
                                    }
                                </span>

                            </div>

                            `
                    )
                    .join("")
            }

        </div>


        <small>
            Category performance represents the tracked
            category market-cap change and does not
            necessarily represent every asset in the sector.
        </small>

    `;


    const searchInput =
        $("category26Search");


    searchInput?.addEventListener(
        "input",
        () => {

            const value =
                searchInput.value;

            renderCryptoCategories26();

            const newInput =
                $("category26Search");

            if (newInput) {
                newInput.value =
                    value;
            }

        }
    );
}


/* =========================================================
   END PART 3
========================================================= */
/* =========================================================
   CRYPTO ONLINE
   MASTER SCRIPT
   STEP 10 → STEP 35
   PART 4 OF 4

   Portfolio Pro
   Transaction Ledger
   Watchlist / Alerts Pro
   Dashboard 2.0
   UX / Performance
   Security / Production Cleanup
   Final Initialization
========================================================= */


/* =========================================================
   PORTFOLIO PRO 29
========================================================= */

function savePortfolioTransactions() {

    localStorage.setItem(
        "cryptoOnlineTransactions",
        JSON.stringify(
            portfolioTransactions
        )
    );
}


function addPortfolioTransaction(
    transaction
) {

    portfolioTransactions.push(
        transaction
    );

    savePortfolioTransactions();

    renderPortfolioPro29();
}


function calculatePortfolioPro29() {

    const data =
        calculatePortfolio20();


    const totalValue =
        data.currentValue;


    const totalInvested =
        data.invested;


    let largestValue = 0;


    data.holdings.forEach(
        holding => {

            if (
                holding.current >
                largestValue
            ) {

                largestValue =
                    holding.current;

            }

        }
    );


    const largestPercentage =
        totalValue > 0
            ? (
                largestValue /
                totalValue
            ) *
            100
            : 0;


    let hhi = 0;


    data.holdings.forEach(
        holding => {

            const weight =
                totalValue > 0
                    ? (
                        holding.current /
                        totalValue
                    ) *
                    100
                    : 0;


            hhi +=
                Math.pow(
                    weight,
                    2
                );

        }
    );


    const gainers =
        data.holdings.filter(
            holding =>
                holding.pnl > 0
        );


    const losers =
        data.holdings.filter(
            holding =>
                holding.pnl < 0
        );


    return {

        ...data,

        largestPercentage,

        hhi,

        gainers:

            gainers.length,

        losers:

            losers.length

    };
}


function renderPortfolioPro29() {

    const container =
        $("portfolioPro29");

    if (!container) {
        return;
    }


    const data =
        calculatePortfolioPro29();


    if (!data.holdings.length) {

        container.innerHTML = `

            <div class="empty-state">

                <strong>
                    Portfolio Pro
                </strong>

                <p>
                    Add holdings to unlock advanced
                    portfolio analytics.
                </p>

            </div>

        `;

        return;
    }


    const allocation =
        data.holdings
            .map(
                holding => {

                    const weight =
                        data.currentValue > 0
                            ? (
                                holding.current /
                                data.currentValue
                            ) *
                            100
                            : 0;


                    return `

                        <div class="portfolio-pro-allocation">

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        holding.coin.name
                                    )}
                                </strong>

                                <span>
                                    ${weight.toFixed(1)}%
                                </span>

                            </div>

                            <div class="allocation-bar">

                                <span
                                    style="width:${Math.min(
                                        100,
                                        weight
                                    )}%"
                                ></span>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    container.innerHTML = `

        <div class="portfolio-pro-header">

            <div>

                <span class="section-kicker">
                    PORTFOLIO PRO
                </span>

                <h3>
                    Advanced Portfolio Analytics
                </h3>

            </div>

        </div>


        <div class="portfolio-pro-metrics">

            <div>
                <span>Current Value</span>
                <strong>
                    ${formatMoney(
                        data.currentValue
                    )}
                </strong>
            </div>

            <div>
                <span>Cost Basis</span>
                <strong>
                    ${formatMoney(
                        data.invested
                    )}
                </strong>
            </div>

            <div>
                <span>Unrealized P/L</span>
                <strong class="${percentClass(
                    data.pnl
                )}">
                    ${formatMoney(
                        data.pnl
                    )}
                </strong>
            </div>

            <div>
                <span>Return</span>
                <strong class="${percentClass(
                    data.pnlPct
                )}">
                    ${formatPercent(
                        data.pnlPct
                    )}
                </strong>
            </div>

            <div>
                <span>Largest Holding</span>
                <strong>
                    ${data.largestPercentage.toFixed(
                        1
                    )}%
                </strong>
            </div>

            <div>
                <span>Holdings</span>
                <strong>
                    ${data.holdings.length}
                </strong>
            </div>

        </div>


        <div class="portfolio-pro-columns">

            <div>

                <h4>
                    Allocation
                </h4>

                ${allocation}

            </div>


            <div>

                <h4>
                    Performance
                </h4>

                <div class="portfolio-pro-performance">

                    <span>
                        Gaining holdings:
                        <strong>
                            ${data.gainers}
                        </strong>
                    </span>

                    <span>
                        Losing holdings:
                        <strong>
                            ${data.losers}
                        </strong>
                    </span>

                    <span>
                        Concentration index:
                        <strong>
                            ${data.hhi.toFixed(0)}
                        </strong>
                    </span>

                </div>


                <p>
                    Concentration metrics describe how
                    portfolio value is distributed among
                    the holdings currently entered into
                    this application.
                </p>

            </div>

        </div>


        <div class="portfolio-pro-transactions">

            <h4>
                Transaction Ledger
            </h4>

            ${
                portfolioTransactions.length
                    ? portfolioTransactions
                        .slice()
                        .reverse()
                        .slice(0, 20)
                        .map(
                            transaction =>
                                `

                                <div class="transaction-row">

                                    <span>
                                        ${escapeHTML(
                                            transaction.type
                                        )}
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            transaction.coinName ||
                                            transaction.coinId
                                        )}
                                    </strong>

                                    <span>
                                        ${formatSupply(
                                            transaction.quantity
                                        )}
                                    </span>

                                    <span>
                                        ${formatPrice(
                                            transaction.price
                                        )}
                                    </span>

                                    <small>
                                        ${new Date(
                                            transaction.timestamp
                                        ).toLocaleDateString()}
                                    </small>

                                </div>

                                `
                        )
                        .join("")
                    : `
                        <p>
                            No transaction history has been
                            recorded yet.
                        </p>
                    `
            }

        </div>

    `;
}


/* =========================================================
   STEP 30 — TRANSACTION LEDGER
========================================================= */

function setupTransactionLedger30() {

    const container =
        $("portfolioPro29");

    if (!container) {
        return;
    }


    if (
        container.querySelector(
            "#transactionLedger30"
        )
    ) {
        return;
    }


    const ledger =
        document.createElement(
            "div"
        );

    ledger.id =
        "transactionLedger30";

    ledger.className =
        "transaction-ledger";


    ledger.innerHTML = `

        <h4>
            Record Transaction
        </h4>


        <div class="transaction-form">

            <select id="transactionCoin">

                <option value="">
                    Select asset
                </option>

            </select>


            <select id="transactionType">

                <option value="BUY">
                    Buy
                </option>

                <option value="SELL">
                    Sell
                </option>

                <option value="DEPOSIT">
                    Deposit
                </option>

                <option value="WITHDRAWAL">
                    Withdrawal
                </option>

            </select>


            <input
                id="transactionQuantity"
                type="number"
                step="any"
                placeholder="Quantity"
            >


            <input
                id="transactionPrice"
                type="number"
                step="any"
                placeholder="Price"
            >


            <button
                id="saveTransaction"
                class="primary-button"
            >
                Save Transaction
            </button>

        </div>


        <div
            id="transactionHistory30"
        ></div>

    `;


    container.appendChild(
        ledger
    );


    populateTransactionCoins30();

    renderTransactionHistory30();


    $("saveTransaction")
        ?.addEventListener(
            "click",
            saveTransaction30
        );
}


function populateTransactionCoins30() {

    const select =
        $("transactionCoin");

    if (!select) {
        return;
    }


    select.innerHTML =
        `<option value="">
            Select asset
        </option>`;


    allCoins
        .slice(0, 100)
        .forEach(
            coin => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    coin.id;

                option.textContent =
                    coin.name +
                    " (" +
                    coin.symbol.toUpperCase() +
                    ")";

                select.appendChild(
                    option
                );

            }
        );
}


function saveTransaction30() {

    const coinId =
        $("transactionCoin")
            ?.value;

    const type =
        $("transactionType")
            ?.value;

    const quantity =
        Number(
            $("transactionQuantity")
                ?.value
        );

    const price =
        Number(
            $("transactionPrice")
                ?.value
        );


    if (
        !coinId ||
        !type ||
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {

        showToast(
            "Enter valid transaction data."
        );

        return;
    }


    const coin =
        allCoins.find(
            c =>
                c.id ===
                coinId
        );


    portfolioTransactions.push({

        id:
            Date.now().toString(),

        coinId,

        coinName:
            coin?.name ||
            coinId,

        type,

        quantity,

        price:
            Number.isFinite(price)
                ? price
                : 0,

        timestamp:
            new Date().toISOString()

    });


    savePortfolioTransactions();

    renderTransactionHistory30();

    renderPortfolioPro29();

    showToast(
        "Transaction recorded."
    );


    if ($("transactionQuantity")) {
        $("transactionQuantity")
            .value = "";
    }

    if ($("transactionPrice")) {
        $("transactionPrice")
            .value = "";
    }
}


function renderTransactionHistory30() {

    const container =
        $("transactionHistory30");

    if (!container) {
        return;
    }


    const transactions =
        portfolioTransactions
            .slice()
            .reverse();


    container.innerHTML = `

        <div class="transaction-history">

            ${
                transactions.length
                    ? transactions
                        .slice(0, 30)
                        .map(
                            transaction =>
                                `

                                <div class="transaction-row">

                                    <strong>
                                        ${escapeHTML(
                                            transaction.type
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            transaction.coinName
                                        )}
                                    </span>

                                    <span>
                                        ${formatSupply(
                                            transaction.quantity
                                        )}
                                    </span>

                                    <span>
                                        ${
                                            transaction.price
                                                ? formatPrice(
                                                    transaction.price
                                                )
                                                : "--"
                                        }
                                    </span>

                                    <small>
                                        ${new Date(
                                            transaction.timestamp
                                        ).toLocaleString()}
                                    </small>

                                </div>

                                `
                        )
                        .join("")
                    : `
                        <div class="empty-state">
                            No transactions recorded.
                        </div>
                    `
            }

        </div>

    `;
}


/* =========================================================
   STEP 31 — WATCHLIST / ALERTS PRO
========================================================= */

function renderWatchlistPro31() {

    const container =
        $("watchlistIntelligence");

    if (!container) {
        return;
    }


    const coins =
        watchlist
            .map(
                id =>
                    allCoins.find(
                        coin =>
                            coin.id === id
                    )
            )
            .filter(Boolean);


    if (!coins.length) {

        container.innerHTML = `

            <div class="empty-state">

                Add assets to your watchlist to see
                Watchlist Intelligence.

            </div>

        `;

        return;
    }


    const averageChange =
        coins.reduce(
            (
                total,
                coin
            ) =>
                total +
                Number(
                    coin.price_change_percentage_24h ||
                    0
                ),
            0
        ) /
        coins.length;


    const strongest =
        [...coins].sort(
            (a, b) =>
                Number(
                    b.price_change_percentage_24h ||
                    0
                ) -
                Number(
                    a.price_change_percentage_24h ||
                    0
                )
        )[0];


    const weakest =
        [...coins].sort(
            (a, b) =>
                Number(
                    a.price_change_percentage_24h ||
                    0
                ) -
                Number(
                    b.price_change_percentage_24h ||
                    0
                )
        )[0];


    container.innerHTML = `

        <div class="watchlist-pro">

            <div>

                <span>
                    Watchlist Assets
                </span>

                <strong>
                    ${coins.length}
                </strong>

            </div>


            <div>

                <span>
                    Average 24H Move
                </span>

                <strong class="${percentClass(
                    averageChange
                )}">
                    ${formatPercent(
                        averageChange
                    )}
                </strong>

            </div>


            <div>

                <span>
                    Strongest
                </span>

                <strong>
                    ${escapeHTML(
                        strongest?.name ||
                        "--"
                    )}
                </strong>

            </div>


            <div>

                <span>
                    Weakest
                </span>

                <strong>
                    ${escapeHTML(
                        weakest?.name ||
                        "--"
                    )}
                </strong>

            </div>

        </div>

    `;
}


/* =========================================================
   STEP 32 — DASHBOARD 2.0
========================================================= */

function renderMarketDashboard32() {

    const dashboard =
        $("dashboard");

    if (!dashboard) {
        return;
    }


    let panel =
        $("dashboard32");


    if (!panel) {

        panel =
            document.createElement(
                "div"
            );

        panel.id =
            "dashboard32";

        panel.className =
            "content-panel";


        dashboard.appendChild(
            panel
        );

    }


    const btc =
        allCoins.find(
            coin =>
                coin.id ===
                "bitcoin"
        );


    const eth =
        allCoins.find(
            coin =>
                coin.id ===
                "ethereum"
        );


    const breadth =
        getMarketBreadth();


    const total =
        breadth.positive +
        breadth.negative +
        breadth.neutral;


    const positivePct =
        total
            ? (
                breadth.positive /
                total
            ) *
            100
            : 0;


    const fearGreed =
        getFearGreedValue();


    const gainers =
        [...allCoins]
            .sort(
                (a, b) =>
                    Number(
                        b.price_change_percentage_24h ||
                        0
                    ) -
                    Number(
                        a.price_change_percentage_24h ||
                        0
                    )
            )
            .slice(0, 5);


    const losers =
        [...allCoins]
            .sort(
                (a, b) =>
                    Number(
                        a.price_change_percentage_24h ||
                        0
                    ) -
                    Number(
                        b.price_change_percentage_24h ||
                        0
                    )
            )
            .slice(0, 5);


    panel.innerHTML = `

        <div class="dashboard32-header">

            <div>

                <span class="section-kicker">
                    COMMAND CENTER
                </span>

                <h3>
                    Crypto Market Dashboard 2.0
                </h3>

            </div>

            <button
                id="dashboard32Refresh"
                class="secondary-button"
            >
                Refresh
            </button>

        </div>


        <div class="dashboard32-grid">

            <div class="dashboard32-card">

                <span>
                    Bitcoin
                </span>

                <strong>
                    ${formatPrice(
                        btc?.current_price
                    )}
                </strong>

                <small class="${percentClass(
                    btc?.price_change_percentage_24h
                )}">
                    ${formatPercent(
                        btc?.price_change_percentage_24h
                    )}
                </small>

            </div>


            <div class="dashboard32-card">

                <span>
                    Ethereum
                </span>

                <strong>
                    ${formatPrice(
                        eth?.current_price
                    )}
                </strong>

                <small class="${percentClass(
                    eth?.price_change_percentage_24h
                )}">
                    ${formatPercent(
                        eth?.price_change_percentage_24h
                    )}
                </small>

            </div>


            <div class="dashboard32-card">

                <span>
                    Fear & Greed
                </span>

                <strong>
                    ${
                        fearGreed === null
                            ? "--"
                            : fearGreed
                    }
                </strong>

                <small>
                    Current sentiment
                </small>

            </div>


            <div class="dashboard32-card">

                <span>
                    Positive Breadth
                </span>

                <strong>
                    ${positivePct.toFixed(1)}%
                </strong>

                <small>
                    Of tracked assets
                </small>

            </div>

        </div>


        <div class="dashboard32-movers">

            <div>

                <h4>
                    Top Gainers
                </h4>

                ${
                    gainers
                        .map(
                            coin =>
                                `
                                <div>

                                    <span>
                                        ${escapeHTML(
                                            coin.name
                                        )}
                                    </span>

                                    <strong class="positive">
                                        ${formatPercent(
                                            coin.price_change_percentage_24h
                                        )}
                                    </strong>

                                </div>
                                `
                        )
                        .join("")
                }

            </div>


            <div>

                <h4>
                    Top Losers
                </h4>

                ${
                    losers
                        .map(
                            coin =>
                                `
                                <div>

                                    <span>
                                        ${escapeHTML(
                                            coin.name
                                        )}
                                    </span>

                                    <strong class="negative">
                                        ${formatPercent(
                                            coin.price_change_percentage_24h
                                        )}
                                    </strong>

                                </div>
                                `
                        )
                        .join("")
                }

            </div>

        </div>

    `;


    $("dashboard32Refresh")
        ?.addEventListener(
            "click",
            () => {

                loadMarket();
                loadCoins();
                loadFearGreed();

            }
        );
}


/* =========================================================
   STEP 33 — UX / PERFORMANCE
========================================================= */

function setupUX33() {

    document
        .querySelectorAll(
            "a[href^='#']"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    event => {

                        const target =
                            document.querySelector(
                                link.getAttribute(
                                    "href"
                                )
                            );


                        if (!target) {
                            return;
                        }


                        event.preventDefault();


                        target.scrollIntoView({
                            behavior:
                                "smooth",
                            block:
                                "start"
                        });


                        document
                            .querySelectorAll(
                                ".nav-link"
                            )
                            .forEach(
                                nav =>
                                    nav.classList
                                        .remove(
                                            "active"
                                        )
                            );


                        link.classList.add(
                            "active"
                        );

                    }
                );

            }
        );


    window.addEventListener(
        "scroll",
        () => {

            const sections =
                document.querySelectorAll(
                    ".page-section"
                );


            let current = "";


            sections.forEach(
                section => {

                    const top =
                        section
                            .getBoundingClientRect()
                            .top;


                    if (
                        top <= 150 &&
                        top >= -300
                    ) {

                        current =
                            section.id;

                    }

                }
            );


            if (!current) {
                return;
            }


            document
                .querySelectorAll(
                    ".nav-link"
                )
                .forEach(
                    link => {

                        const href =
                            link.getAttribute(
                                "href"
                            );


                        link.classList.toggle(
                            "active",
                            href ===
                            "#" +
                            current
                        );

                    }
                );

        }
    );
}


/* =========================================================
   STEP 34 — PRODUCTION / SECURITY CLEANUP
========================================================= */

function validateExternalURL(
    value
) {

    try {

        const url =
            new URL(
                value
            );


        if (
            url.protocol ===
                "https:" ||
            url.protocol ===
                "http:"
        ) {

            return url.href;

        }

    } catch (error) {
        return "";
    }


    return "";
}


function setupProductionSafety34() {

    document
        .querySelectorAll(
            "a[target='_blank']"
        )
        .forEach(
            link => {

                link.setAttribute(
                    "rel",
                    "noopener noreferrer"
                );

            }
        );


    window.addEventListener(
        "error",
        event => {

            console.log(
                "Crypto Online runtime error:",
                event.error ||
                event.message
            );

        }
    );


    window.addEventListener(
        "unhandledrejection",
        event => {

            console.log(
                "Crypto Online promise error:",
                event.reason
            );

        }
    );


    if (
        typeof Chart ===
        "undefined"
    ) {

        console.log(
            "Chart.js is unavailable."
        );

    }
}


/* =========================================================
   MOBILE NAVIGATION
========================================================= */

function setupMobileNavigation() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    if (!sidebar) {
        return;
    }


    let button =
        $("mobileMenuButton");


    if (!button) {

        button =
            document.createElement(
                "button"
            );

        button.id =
            "mobileMenuButton";

        button.className =
            "mobile-menu-button";

        button.textContent =
            "☰";


        document
            .querySelector(
                ".topbar"
            )
            ?.prepend(
                button
            );

    }


    button.onclick =
        () => {

            sidebar.classList.toggle(
                "mobile-open"
            );

        };


    sidebar
        .querySelectorAll(
            "a"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        sidebar.classList
                            .remove(
                                "mobile-open"
                            );

                    }
                );

            }
        );
}


/* =========================================================
   GLOBAL SEARCH
========================================================= */

function setupGlobalSearch() {

    const input =
        $("globalSearch");

    if (!input) {
        return;
    }


    let resultsBox =
        $("globalSearchResults");


    if (!resultsBox) {

        resultsBox =
            document.createElement(
                "div"
            );

        resultsBox.id =
            "globalSearchResults";

        resultsBox.className =
            "global-search-results";


        input.parentElement
            ?.appendChild(
                resultsBox
            );

    }


    input.addEventListener(
        "input",
        () => {

            const query =
                input.value
                    .trim()
                    .toLowerCase();


            if (!query) {

                resultsBox.innerHTML =
                    "";

                return;

            }


            const results =
                allCoins
                    .filter(
                        coin =>
                            coin.name
                                .toLowerCase()
                                .includes(
                                    query
                                ) ||
                            coin.symbol
                                .toLowerCase()
                                .includes(
                                    query
                                )
                    )
                    .slice(
                        0,
                        8
                    );


            resultsBox.innerHTML =
                results
                    .map(
                        coin =>
                            `

                            <button
                                data-search-coin="${escapeHTML(
                                    coin.id
                                )}"
                            >

                                <img
                                    src="${escapeHTML(
                                        coin.image
                                    )}"
                                    alt=""
                                >

                                <span>
                                    ${escapeHTML(
                                        coin.name
                                    )}
                                </span>

                                <small>
                                    ${escapeHTML(
                                        coin.symbol.toUpperCase()
                                    )}
                                </small>

                            </button>

                            `
                    )
                    .join("");


            resultsBox
                .querySelectorAll(
                    "[data-search-coin]"
                )
                .forEach(
                    button => {

                        button.onclick =
                            () => {

                                loadCoinDetails(
                                    button.dataset
                                        .searchCoin
                                );

                                resultsBox.innerHTML =
                                    "";

                                input.value =
                                    "";

                            };

                    }
                );

        }
    );
}


/* =========================================================
   SELECTOR SETUP
========================================================= */

function populateSelectors() {

    populateCompareSelectors();

    populatePortfolioSelector();

    populateAISelector();

    populateAlertSelector();

    populateTransactionCoins30();
}


/* =========================================================
   EVENT SETUP
========================================================= */

function setupEvents() {

    setupScreenerEvents();

    setupNewsEvents();

    $("compareButton")
        ?.addEventListener(
            "click",
            compareCoins
        );


    $("addPortfolioAsset")
        ?.addEventListener(
            "click",
            addPortfolioHolding
        );


    $("refreshMarket")
        ?.addEventListener(
            "click",
            () => {

                loadMarket();
                loadCoins();
                loadFearGreed();
                loadBitcoinChart();
                loadCryptoNews();
                loadOnChain24();

                showToast(
                    "Market refreshed."
                );

            }
        );


    $("closeCoinDetails")
        ?.addEventListener(
            "click",
            () => {

                $("coin-details")
                    ?.scrollIntoView({
                        behavior:
                            "smooth"
                    });

            }
        );


    $("runAIAnalysis")
        ?.addEventListener(
            "click",
            runAICoinAnalysis
        );
}


/* =========================================================
   FINAL INITIALIZATION — STEP 35
========================================================= */

async function initializeCryptoOnline() {

    console.log(
        "Crypto Online initializing..."
    );


    setupProductionSafety34();

    setupMobileNavigation();

    setupGlobalSearch();

    setupEvents();

    setupUX33();


    setupCryptoAI22();

    setupCryptoTools20();

    setupCryptoAcademy20();

    setupAlerts23();


    setupTransactionLedger30();


    await loadMarket();

    await loadCoins();

    await loadFearGreed();


    injectAdvancedChartControls();

    await loadBitcoinChart();


    await loadCryptoNews();

    await loadOnChain24();

    await loadCryptoCategories26();


    renderWatchlist();

    renderWatchlistPro31();

    renderPortfolio();

    renderPortfolioPro29();

    renderScreener20();

    renderAdvancedMarketIntelligence();

    renderMarketDashboard32();


    console.log(
        "Crypto Online initialized successfully."
    );

}


/* =========================================================
   AUTOMATIC REFRESH SYSTEM
========================================================= */

/*
   Market:
   60 seconds

   Fear & Greed:
   5 minutes

   Charts:
   5 minutes

   News:
   10 minutes

   On-chain:
   2 minutes

   Categories:
   5 minutes

   Alerts:
   60 seconds

   Portfolio:
   60 seconds
*/


setInterval(
    async () => {

        await loadMarket();

        await loadCoins();

        renderWatchlistPro31();

        renderPortfolioPro29();

        renderMarketDashboard32();

    },
    60000
);


setInterval(
    loadFearGreed,
    300000
);


setInterval(
    loadBitcoinChart,
    300000
);


setInterval(
    loadCryptoNews,
    600000
);


setInterval(
    loadOnChain24,
    120000
);


setInterval(
    loadCryptoCategories26,
    300000
);


setInterval(
    updateAlerts23,
    60000
);


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeCryptoOnline
    );

} else {

    initializeCryptoOnline();

}


/* =========================================================
   END OF MASTER SCRIPT
   STEP 10 → STEP 35
========================================================= */
