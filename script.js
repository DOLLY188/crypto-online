const API =
"https://api.coingecko.com/api/v3";

let btcChart = null;
let coinDetailChart = null;
let compareChart = null;
let portfolioChart = null;

let allCoins = [];

let coinPage = 1;

const coinsPerPage = 25;

let watchlist =
JSON.parse(
localStorage.getItem(
"cryptoOnlineWatchlist"
) || "[]"
);

let compareSelection =
JSON.parse(
localStorage.getItem(
"cryptoOnlineCompare"
) || "[]"
);

let portfolio =
JSON.parse(
localStorage.getItem(
"cryptoOnlinePortfolio"
) || "[]"
);

let coinCache = {};

let screenerQuickFilter = "all";

let currentDetailCoinId = null;


/* =========================
HELPERS
========================= */

function formatMoney(value){

    if(
        value === null ||
        value === undefined ||
        Number.isNaN(value)
    ){
        return "--";
    }

    if(Math.abs(value) >= 1e12){

        return "$" +
            (value / 1e12).toFixed(2) +
            "T";

    }

    if(Math.abs(value) >= 1e9){

        return "$" +
            (value / 1e9).toFixed(2) +
            "B";

    }

    if(Math.abs(value) >= 1e6){

        return "$" +
            (value / 1e6).toFixed(2) +
            "M";

    }

    if(Math.abs(value) >= 1e3){

        return "$" +
            (value / 1e3).toFixed(2) +
            "K";

    }

    if(value >= 1){

        return "$" +
            Number(value).toLocaleString(
                undefined,
                {
                    maximumFractionDigits:2
                }
            );

    }

    return "$" +
        Number(value).toPrecision(4);
}


function formatNumber(value){

    if(
        value === null ||
        value === undefined ||
        Number.isNaN(value)
    ){
        return "--";
    }

    return Number(value).toLocaleString();
}


function formatSupply(value){

    if(
        value === null ||
        value === undefined ||
        Number.isNaN(value)
    ){
        return "--";
    }

    if(value >= 1e12){

        return (
            value / 1e12
        ).toFixed(2) + "T";

    }

    if(value >= 1e9){

        return (
            value / 1e9
        ).toFixed(2) + "B";

    }

    if(value >= 1e6){

        return (
            value / 1e6
        ).toFixed(2) + "M";

    }

    return Number(value).toLocaleString();
}


function escapeHTML(value){

    if(
        value === null ||
        value === undefined
    ){
        return "";
    }

    return String(value)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}


function getChangeClass(value){

    if(value > 0){
        return "positive";
    }

    if(value < 0){
        return "negative";
    }

    return "";
}


function getCoinChange(coin){

    const value =
        Number(
            coin?.price_change_percentage_24h
        );

    return Number.isFinite(value)
        ? value
        : 0;
}


/* =========================
MARKET
========================= */

async function loadMarket(){

    try{

        const response =
            await fetch(
                `${API}/global`
            );

        if(!response.ok){
            throw new Error(
                "Global market request failed"
            );
        }

        const data =
            await response.json();

        const market =
            data.data;

        const statValues =
            document.querySelectorAll(
                ".stat-value"
            );

        if(statValues[0]){

            statValues[0].textContent =
                formatMoney(
                    market
                        ?.total_market_cap
                        ?.usd
                );

        }

        if(statValues[1]){

            statValues[1].textContent =
                formatMoney(
                    market
                        ?.total_volume
                        ?.usd
                );

        }

        if(statValues[2]){

            statValues[2].textContent =
                Number(
                    market
                        ?.market_cap_percentage
                        ?.btc || 0
                ).toFixed(1) + "%";

        }

        if(statValues[3]){

            statValues[3].textContent =
                Number(
                    market
                        ?.market_cap_percentage
                        ?.eth || 0
                ).toFixed(1) + "%";

        }

        await loadCoins();

    }catch(error){

        console.log(
            "Market data error:",
            error
        );

    }
}


async function loadCoins(){

    try{

        const response =
            await fetch(
                `${API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`
            );

        if(!response.ok){
            throw new Error(
                "Coin market request failed"
            );
        }

        const coins =
            await response.json();

        if(!Array.isArray(coins)){
            return;
        }

        allCoins =
            coins;

        allCoins.forEach(
            coin => {
                coinCache[coin.id] = coin;
            }
        );

        updateBitcoinHeader(
            coins
        );

        renderMovers(
            coins
        );

        renderCoins();

        renderScreener();

        populateCompareSelectors();

        populatePortfolioSelector();

        renderWatchlist();

        updateWatchlistCount();

        renderPortfolio();

    }catch(error){

        console.log(
            "Coin loading error:",
            error
        );

    }
}


function updateBitcoinHeader(
    coins
){

    const btc =
        coins.find(
            coin =>
                coin.id === "bitcoin"
        );

    if(!btc){
        return;
    }

    const priceElement =
        document.querySelector(
            ".chart-price strong"
        );

    const changeElement =
        document.querySelector(
            ".chart-price span"
        );

    const titleElement =
        document.querySelector(
            ".asset-title h3"
        );

    const symbolElement =
        document.querySelector(
            ".asset-title span"
        );

    if(priceElement){

        priceElement.textContent =
            formatMoney(
                btc.current_price
            );

    }

    if(changeElement){

        const change =
            getCoinChange(btc);

        changeElement.textContent =
            (change >= 0 ? "+" : "") +
            change.toFixed(2) +
            "%";

        changeElement.className =
            getChangeClass(
                change
            );

    }

    if(titleElement){

        titleElement.textContent =
            btc.name;

    }

    if(symbolElement){

        symbolElement.textContent =
            btc.symbol.toUpperCase();

    }
}


/* =========================
MOVERS
========================= */

function renderMovers(
    coins
){

    const sorted =
        [...coins].sort(
            (a,b) =>
                getCoinChange(b) -
                getCoinChange(a)
        );

    const gainers =
