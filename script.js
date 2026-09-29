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
            (value / 1e12)
                .toFixed(2)
            + "T";

    }


    if(Math.abs(value) >= 1e9){

        return "$" +
            (value / 1e9)
                .toFixed(2)
            + "B";

    }


    if(Math.abs(value) >= 1e6){

        return "$" +
            (value / 1e6)
                .toFixed(2)
            + "M";

    }


    if(Math.abs(value) >= 1e3){

        return "$" +
            (value / 1e3)
                .toFixed(2)
            + "K";

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
        value === undefined
    ){
        return "--";
    }

    return Number(value).toLocaleString();

}


function formatSupply(value){

    if(
        value === null ||
        value === undefined
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


/* =========================
   MARKET
========================= */

async function loadMarket(){

    try{

        const response =
            await fetch(
                `${API}/global`
            );


        const data =
            await response.json();


        const market =
            data.data;


        const statValues =
            document.querySelectorAll(
                ".stat-value"
            );


        if(statValues[0]){

            statValues[0]
                .textContent =
                    formatMoney(
                        market
                            .total_market_cap
                            .usd
                    );

        }


        if(statValues[1]){

            statValues[1]
                .textContent =
                    formatMoney(
                        market
                            .total_volume
                            .usd
                    );

        }


        if(statValues[2]){

            statValues[2]
                .textContent =
                    market
                        .market_cap_percentage
                        .btc
                        .toFixed(1)
                    + "%";

        }


        if(statValues[3]){

            statValues[3]
                .textContent =
                    market
                        .market_cap_percentage
                        .eth
                        .toFixed(1)
                    + "%";

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


        const coins =
            await response.json();


        if(!Array.isArray(coins)){
            return;
        }


        allCoins =
            coins;


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


        updateWatchlistFromMarket(
            coins
        );


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

        changeElement.textContent =
            (
                btc.price_change_percentage_24h >= 0
                    ? "+"
                    : ""
            )
            +
            btc.price_change_percentage_24h
                .toFixed(2)
            +
            "%";


        changeElement.className =
            getChangeClass(
                btc.price_change_percentage_24h
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
                (
                    b.price_change_percentage_24h || 0
                )
                -
                (
                    a.price_change_percentage_24h || 0
                )
        );


    const gainers =
        sorted
            .filter(
                coin =>
                    (
                        coin.price_change_percentage_24h
                        || 0
                    ) > 0
            )
            .slice(0,5);


    const losers =
        sorted
            .filter(
                coin =>
                    (
                        coin.price_change_percentage_24h
                        || 0
                    ) < 0
            )
            .slice(-5)
            .reverse();


    const trending =
        [...coins]
            .sort(
                (a,b) =>
                    (
                        b.total_volume || 0
                    )
                    -
                    (
                        a.total_volume || 0
                    )
            )
            .slice(0,5);


    renderMoverList(
        "gainersList",
        gainers
    );


    renderMoverList(
        "losersList",
        losers
    );


    renderMoverList(
        "trendingList",
        trending
    );


    setupMoverClicks();

}


function renderMoverList(
    elementId,
    coins
){

    const container =
        document.getElementById(
            elementId
        );


    if(!container){
        return;
    }


    container.innerHTML =
        coins
            .map(
                coin => {

                    const change =
                        coin.price_change_percentage_24h
                        || 0;


                    return `

                        <div
                            class="mover-row"
                            data-coin-id="${coin.id}"
                        >

                            <img
                                src="${coin.image}"
                                alt="${escapeHTML(
                                    coin.name
                                )}"
                            >


                            <div class="mover-info">

                                <strong>
                                    ${escapeHTML(
                                        coin.name
                                    )}
                                </strong>

                                <span>
                                    ${coin.symbol.toUpperCase()}
                                </span>

                            </div>


                            <div class="mover-price">

                                <strong>
                                    ${formatMoney(
                                        coin.current_price
                                    )}
                                </strong>

                                <span
                                    class="${getChangeClass(
                                        change
                                    )}"
                                >
                                    ${change >= 0 ? "+" : ""}
                                    ${change.toFixed(2)}%
                                </span>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


async function loadTrending(){

    try{

        const response =
            await fetch(
                `${API}/search/trending`
            );


        const data =
            await response.json();


        const container =
            document.getElementById(
                "trendingList"
            );


        if(!container){
            return;
        }


        const coins =
            data.coins || [];


        container.innerHTML =
            coins
                .slice(0,5)
                .map(
                    item => {

                        const coin =
                            item.item;


                        return `

                            <div
                                class="mover-row"
                                data-coin-id="${coin.id}"
                            >

                                <img
                                    src="${
                                        coin.large
                                        ||
                                        coin.thumb
                                    }"
                                    alt="${escapeHTML(
                                        coin.name
                                    )}"
                                >


                                <div class="mover-info">

                                    <strong>
                                        ${escapeHTML(
                                            coin.name
                                        )}
                                    </strong>

                                    <span>
                                        ${coin.symbol}
                                    </span>

                                </div>


                                <div class="mover-price">

                                    <strong>
                                        #${
                                            coin.market_cap_rank
                                            || "--"
                                        }
                                    </strong>

                                    <span>
                                        Trending
                                    </span>

                                </div>

                            </div>

                        `;

                    }
                )
                .join("");


        setupMoverClicks();


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


        const canvas =
            document.getElementById(
                "btcChart"
            );


        if(!canvas){
            return;
        }


        const labels =
            data.prices.map(
                item =>
                    new Date(
                        item[0]
                    ).toLocaleDateString(
                        [],
                        {
                            month:"short",
                            day:"numeric"
                        }
                    )
            );


        const prices =
            data.prices.map(
                item =>
                    item[1]
            );


        if(btcChart){

            btcChart.destroy();

        }


        btcChart =
            new Chart(
                canvas,
                {

                    type:"line",


                    data:{

                        labels,


                        datasets:[
                            {

                                label:"Bitcoin",

                                data:prices,

                                borderColor:"#1769e0",

                                backgroundColor:
                                    "rgba(23,105,224,0.08)",

                                fill:true,

                                tension:.35,

                                pointRadius:0,

                                borderWidth:2

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

                                grid:{
                                    color:"#edf0f4"
                                },


                                ticks:{

                                    callback:
                                        function(value){

                                            return formatMoney(
                                                value
                                            );

                                        },

                                    font:{
                                        size:9
                                    }

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


        const item =
            data.data[0];


        const value =
            parseInt(
                item.value
            );


        const classification =
            item.value_classification;


        const valueElement =
            document.getElementById(
                "fearGreedValue"
            );


        const labelElement =
            document.getElementById(
                "fearGreedLabel"
            );


        const sentimentElement =
            document.getElementById(
                "marketSentiment"
            );


        const intelligenceElement =
            document.getElementById(
                "sentimentIntelligence"
            );


        if(valueElement){

            valueElement.textContent =
                value;

        }


        if(labelElement){

            labelElement.textContent =
                classification;

        }


        if(sentimentElement){

            sentimentElement.textContent =
                classification;

        }


        if(intelligenceElement){

            intelligenceElement.textContent =
                classification
                + " ("
                + value
                + ")";

        }


    }catch(error){

        console.log(
            "Fear & Greed error:",
            error
        );

    }

}


/* =========================
   COIN EXPLORER
========================= */

async function loadCoinExplorer(){

    try{

        if(allCoins.length === 0){

            const response =
                await fetch(
                    `${API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`
                );


            const coins =
                await response.json();


            if(Array.isArray(coins)){

                allCoins =
                    coins;

            }

        }


        renderCoins();


    }catch(error){

        console.log(
            "Explorer error:",
            error
        );

    }

}


function renderCoins(){

    const body =
        document.getElementById(
            "coinTableBody"
        );


    const count =
        document.getElementById(
            "coinCount"
        );


    if(!body){
        return;
    }


    const searchInput =
        document.getElementById(
            "coinSearch"
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const filtered =
        allCoins.filter(
            coin =>
                coin.name
                    .toLowerCase()
                    .includes(search)
                ||
                coin.symbol
                    .toLowerCase()
                    .includes(search)
        );


    const visible =
        filtered.slice(
            0,
            coinPage * coinsPerPage
        );


    if(count){

        count.textContent =
            filtered.length
            + " assets";

    }


    body.innerHTML =
        visible
            .map(
                coin => {

                    const change =
                        coin.price_change_percentage_24h
                        || 0;


                    return `

                        <tr
                            data-coin-id="${coin.id}"
                        >

                            <td>
                                ${coin.market_cap_rank || "--"}
                            </td>


                            <td>

                                <div class="coin-name">

                                    <img
                                        src="${coin.image}"
                                        alt="${escapeHTML(
                                            coin.name
                                        )}"
                                    >


                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                coin.name
                                            )}
                                        </strong>

                                        <span>
                                            ${coin.symbol.toUpperCase()}
                                        </span>

                                    </div>

                                </div>

                            </td>


                            <td>
                                ${formatMoney(
                                    coin.current_price
                                )}
                            </td>


                            <td
                                class="${getChangeClass(
                                    change
                                )}"
                            >
                                ${change >= 0 ? "+" : ""}
                                ${change.toFixed(2)}%
                            </td>


                            <td>
                                ${formatMoney(
                                    coin.market_cap
                                )}
                            </td>


                            <td>
                                ${formatMoney(
                                    coin.total_volume
                                )}
                            </td>


                            <td>

                                <button
                                    class="table-watch ${
                                        isInWatchlist(
                                            coin.id
                                        )
                                            ? "active"
                                            : ""
                                    }"
                                    data-watch-id="${coin.id}"
                                >
                                    ${
                                        isInWatchlist(
                                            coin.id
                                        )
                                            ? "★"
                                            : "☆"
                                    }
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    setupCoinRowClicks();


    const loadMore =
        document.getElementById(
            "loadMoreCoins"
        );


    if(loadMore){

        loadMore.style.display =
            visible.length <
            filtered.length
                ? "block"
                : "none";

    }


    setupWatchButtons();

}


function setupCoinExplorer(){

    const search =
        document.getElementById(
            "coinSearch"
        );


    const loadMore =
        document.getElementById(
            "loadMoreCoins"
        );


    if(search){

        search.addEventListener(
            "input",
            function(){

                coinPage =
                    1;

                renderCoins();

            }
        );

    }


    if(loadMore){

        loadMore.addEventListener(
            "click",
            function(){

                coinPage++;

                renderCoins();

            }
        );

    }

}


/* =========================
   COIN DETAILS
========================= */

async function loadCoinDetails(
    id
){

    if(!id){
        return;
    }


    const section =
        document.getElementById(
            "coin-details"
        );


    if(section){

        section.scrollIntoView({
            behavior:"smooth"
        });

    }


    try{

        const response =
            await fetch(
                `${API}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
            );


        const coin =
            await response.json();


        coinCache[id] =
            coin;


        displayCoinDetails(
            coin
        );


        await loadCoinDetailChart(
            id
        );


    }catch(error){

        console.log(
            "Coin detail error:",
            error
        );

    }

}


function displayCoinDetails(
    coin
){

    const market =
        coin.market_data || {};


    const image =
        document.getElementById(
            "detailCoinImage"
        );


    const name =
        document.getElementById(
            "detailCoinName"
        );


    const symbol =
        document.getElementById(
            "detailCoinSymbol"
        );


    const rank =
        document.getElementById(
            "detailCoinRank"
        );


    if(image){

        image.src =
            coin.image.large
            ||
            coin.image.small
            ||
            "";

    }


    if(name){

        name.textContent =
            coin.name;

    }


    if(symbol){

        symbol.textContent =
            coin.symbol.toUpperCase();

    }


    if(rank){

        rank.textContent =
            "Rank "
            +
            (
                coin.market_cap_rank
                || "--"
            );

    }


    const price =
        document.getElementById(
            "detailCoinPrice"
        );


    const change =
        document.getElementById(
            "detailCoinChange"
        );


    const currentPrice =
        market.current_price?.usd;


    const changeValue =
        market.price_change_percentage_24h;


    if(price){

        price.textContent =
            formatMoney(
                currentPrice
            );

    }


    if(change){

        change.textContent =
            (
                changeValue >= 0
                    ? "+"
                    : ""
            )
            +
            (
                changeValue || 0
            ).toFixed(2)
            +
            "%";


        change.className =
            getChangeClass(
                changeValue
            );

    }


    const values = {

        detailMarketCap:
            formatMoney(
                market.market_cap?.usd
            ),

        detailVolume:
            formatMoney(
                market.total_volume?.usd
            ),

        detailCirculating:
            formatSupply(
                market.circulating_supply
            ),

        detailTotalSupply:
            formatSupply(
                market.total_supply
            ),

        detailAth:
            formatMoney(
                market.ath?.usd
            ),

        detailAtl:
            formatMoney(
                market.atl?.usd
            )

    };


    Object.keys(
        values
    ).forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if(element){

                element.textContent =
                    values[id];

            }

        }
    );


    const description =
        document.getElementById(
            "detailDescription"
        );


    if(description){

        const clean =
            (
                coin.description?.en
                || ""
            )
                .replace(
                    /<[^>]*>/g,
                    ""
                )
                .trim();


        description.textContent =
            clean
            ||
            "No description available.";

    }


    updateDetailWatchButton(
        coin.id
    );

}


async function loadCoinDetailChart(
    id
){

    try{

        const response =
            await fetch(
                `${API}/coins/${id}/market_chart?vs_currency=usd&days=7&interval=daily`
            );


        const data =
            await response.json();


        const canvas =
            document.getElementById(
                "coinDetailChart"
            );


        if(!canvas){
            return;
        }


        const labels =
            data.prices.map(
                item =>
                    new Date(
                        item[0]
                    ).toLocaleDateString(
                        [],
                        {
                            month:"short",
                            day:"numeric"
                        }
                    )
            );


        const prices =
            data.prices.map(
                item =>
                    item[1]
            );


        if(coinDetailChart){

            coinDetailChart.destroy();

        }


        coinDetailChart =
            new Chart(
                canvas,
                {

                    type:"line",


                    data:{

                        labels,


                        datasets:[
                            {

                                data:prices,

                                borderColor:"#1769e0",

                                backgroundColor:
                                    "rgba(23,105,224,.08)",

                                fill:true,

                                tension:.35,

                                pointRadius:2

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
            "Detail chart error:",
            error
        );

    }

}


/* =========================
   WATCHLIST
========================= */

function isInWatchlist(
    id
){

    return watchlist.includes(
        id
    );

}


function saveWatchlist(){

    localStorage.setItem(
        "cryptoOnlineWatchlist",
        JSON.stringify(
            watchlist
        )
    );

}


function toggleWatchlist(
    id
){

    if(
        isInWatchlist(id)
    ){

        watchlist =
            watchlist.filter(
                item =>
                    item !== id
            );

    }else{

        watchlist.push(
            id
        );

    }


    saveWatchlist();

    renderWatchlist();

    updateWatchlistCount();

    renderCoins();

    renderScreener();

    updateDetailWatchButton(
        id
    );

}


function updateWatchlistCount(){

    const count =
        document.getElementById(
            "watchlistCount"
        );


    const intelligence =
        document.getElementById(
            "watchlistIntelligence"
        );


    if(count){

        count.textContent =
            watchlist.length;

    }


    if(intelligence){

        intelligence.textContent =
            watchlist.length;

    }

}


function renderWatchlist(){

    const container =
        document.getElementById(
            "watchlistContainer"
        );


    if(!container){
        return;
    }


    if(
        watchlist.length === 0
    ){

        container.innerHTML = `

            <div class="watchlist-empty">

                <div class="empty-icon">
                    ★
                </div>

                <h3>
                    Your watchlist is empty
                </h3>

                <p>
                    Add cryptocurrencies from the explorer or screener.
                </p>

            </div>

        `;

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


    container.innerHTML =
        coins
            .map(
                coin => {

                    const change =
                        coin.price_change_percentage_24h
                        || 0;


                    return `

                        <div class="watchlist-card">

                            <div class="watchlist-card-header">

                                <div class="watchlist-identity">

                                    <img
                                        src="${coin.image}"
                                        alt="${escapeHTML(
                                            coin.name
                                        )}"
                                    >


                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                coin.name
                                            )}
                                        </strong>

                                        <span>
                                            ${coin.symbol.toUpperCase()}
                                        </span>

                                    </div>

                                </div>


                                <button
                                    class="remove-watch"
                                    onclick="
                                        toggleWatchlist(
                                            '${coin.id}'
                                        )
                                    "
                                >
                                    ×
                                </button>

                            </div>


                            <div class="watchlist-price">

                                <strong>
                                    ${formatMoney(
                                        coin.current_price
                                    )}
                                </strong>


                                <span
                                    class="${getChangeClass(
                                        change
                                    )}"
                                >
                                    ${change >= 0 ? "+" : ""}
                                    ${change.toFixed(2)}%
                                </span>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


function setupWatchButtons(){

    document
        .querySelectorAll(
            "[data-watch-id]"
        )
        .forEach(
            button => {

                button.onclick =
                    function(event){

                        event.stopPropagation();

                        toggleWatchlist(
                            button.dataset.watchId
                        );

                    };

            }
        );

}


function updateWatchlistFromMarket(
    coins
){

    watchlist =
        watchlist.filter(
            id =>
                coins.some(
                    coin =>
                        coin.id === id
                )
        );


    saveWatchlist();

    renderWatchlist();

    updateWatchlistCount();

}


function updateDetailWatchButton(
    id
){

    const button =
        document.getElementById(
            "detailWatchButton"
        );


    if(!button){
        return;
    }


    if(
        isInWatchlist(id)
    ){

        button.textContent =
            "★ In Watchlist";

        button.classList.add(
            "in-watchlist"
        );

    }else{

        button.textContent =
            "☆ Add to Watchlist";

        button.classList.remove(
            "in-watchlist"
        );

    }

}


/* =========================
   ROW CLICKS
========================= */

function setupCoinRowClicks(){

    document
        .querySelectorAll(
            "#coinTableBody tr[data-coin-id]"
        )
        .forEach(
            row => {

                row.onclick =
                    function(){

                        loadCoinDetails(
                            row.dataset.coinId
                        );

                    };

            }
        );

}


function setupMoverClicks(){

    document
        .querySelectorAll(
            ".mover-row[data-coin-id]"
        )
        .forEach(
            row => {

                row.onclick =
                    function(){

                        loadCoinDetails(
                            row.dataset.coinId
                        );

                    };

            }
        );

}


/* =========================
   DETAILS BUTTON
========================= */

function setupCloseDetails(){

    const button =
        document.getElementById(
            "closeCoinDetails"
        );


    if(button){

        button.addEventListener(
            "click",
            function(){

                document
                    .getElementById(
                        "coin-details"
                    )
                    ?.scrollIntoView({
                        behavior:"smooth"
                    });

            }
        );

    }

}


function setupDetailWatchButton(){

    const button =
        document.getElementById(
            "detailWatchButton"
        );


    if(!button){
        return;
    }


    button.addEventListener(
        "click",
        function(){

            const name =
                document.getElementById(
                    "detailCoinName"
                );


            if(!name){
                return;
            }


            const coin =
                allCoins.find(
                    item =>
                        item.name ===
                        name.textContent
                );


            if(coin){

                toggleWatchlist(
                    coin.id
                );

            }

        }
    );

}


/* =========================
   SCREENER
========================= */

function renderScreener(){

    const body =
        document.getElementById(
            "screenerTableBody"
        );


    const count =
        document.getElementById(
            "screenerCount"
        );


    if(!body){
        return;
    }


    let coins =
        [...allCoins];


    if(
        screenerQuickFilter ===
        "gainers"
    ){

        coins =
            coins.filter(
                coin =>
                    (
                        coin.price_change_percentage_24h
                        || 0
                    ) > 0
            );

    }


    if(
        screenerQuickFilter ===
        "losers"
    ){

        coins =
            coins.filter(
                coin =>
                    (
                        coin.price_change_percentage_24h
                        || 0
                    ) < 0
            );

    }


    if(
        screenerQuickFilter ===
        "top10"
    ){

        coins =
            coins.filter(
                coin =>
                    coin.market_cap_rank <= 10
            );

    }


    if(
        screenerQuickFilter ===
        "top50"
    ){

        coins =
            coins.filter(
                coin =>
                    coin.market_cap_rank <= 50
            );

    }


    const searchInput =
        document.getElementById(
            "screenerSearch"
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    if(search){

        coins =
            coins.filter(
                coin =>
                    coin.name
                        .toLowerCase()
                        .includes(search)
                    ||
                    coin.symbol
                        .toLowerCase()
                        .includes(search)
            );

    }


    const minChange =
        parseFloat(
            document.getElementById(
                "minChange"
            )?.value
        );


    if(!Number.isNaN(minChange)){

        coins =
            coins.filter(
                coin =>
                    (
                        coin.price_change_percentage_24h
                        || 0
                    ) >= minChange
            );

    }


    const maxChange =
        parseFloat(
            document.getElementById(
                "maxChange"
            )?.value
        );


    if(!Number.isNaN(maxChange)){

        coins =
            coins.filter(
                coin =>
                    (
                        coin.price_change_percentage_24h
                        || 0
                    ) <= maxChange
            );

    }


    const minMarketCap =
        parseFloat(
            document.getElementById(
                "minMarketCap"
            )?.value
        );


    if(!Number.isNaN(minMarketCap)){

        coins =
            coins.filter(
                coin =>
                    (
                        coin.market_cap
                        || 0
                    ) >= minMarketCap
            );

    }


    const maxMarketCap =
        parseFloat(
            document.getElementById(
                "maxMarketCap"
            )?.value
        );


    if(!Number.isNaN(maxMarketCap)){

        coins =
            coins.filter(
                coin =>
                    (
                        coin.market_cap
                        || 0
                    ) <= maxMarketCap
            );

    }


    const sortBy =
        document.getElementById(
            "screenerSort"
        )?.value
        ||
        "market_cap_rank";


    const direction =
        document.getElementById(
            "screenerDirection"
        )?.value
        ||
        "desc";


    coins.sort(
        (a,b) => {

            let aValue =
                a[sortBy];


            let bValue =
                b[sortBy];


            if(
                aValue === null ||
                aValue === undefined
            ){

                aValue = 0;

            }


            if(
                bValue === null ||
                bValue === undefined
            ){

                bValue = 0;

            }


            return direction === "asc"
                ? aValue - bValue
                : bValue - aValue;

        }
    );


    if(count){

        count.textContent =
            coins.length;

    }


    if(
        coins.length === 0
    ){

        body.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="loading-state"
                >
                    No assets match these filters.
                </td>

            </tr>

        `;

        return;

    }


    body.innerHTML =
        coins
            .map(
                coin => {

                    const change =
                        coin.price_change_percentage_24h
                        || 0;


                    return `

                        <tr
                            data-screener-coin="${coin.id}"
                        >

                            <td>
                                #${coin.market_cap_rank || "--"}
                            </td>


                            <td>

                                <div class="screener-asset">

                                    <img
                                        src="${coin.image}"
                                        alt="${escapeHTML(
                                            coin.name
                                        )}"
                                    >


                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                coin.name
                                            )}
                                        </strong>

                                        <span>
                                            ${coin.symbol.toUpperCase()}
                                        </span>

                                    </div>

                                </div>

                            </td>


                            <td>
                                ${formatMoney(
                                    coin.current_price
                                )}
                            </td>


                            <td
                                class="${getChangeClass(
                                    change
                                )}"
                            >
                                ${change >= 0 ? "+" : ""}
                                ${change.toFixed(2)}%
                            </td>


                            <td>
                                ${formatMoney(
                                    coin.market_cap
                                )}
                            </td>


                            <td>
                                ${formatMoney(
                                    coin.total_volume
                                )}
                            </td>


                            <td>

                                <button
                                    class="table-watch ${
                                        isInWatchlist(
                                            coin.id
                                        )
                                            ? "active"
                                            : ""
                                    }"
                                    data-screener-watch="${coin.id}"
                                >
                                    ${
                                        isInWatchlist(
                                            coin.id
                                        )
                                            ? "★"
                                            : "☆"
                                    }
                                </button>

                            </td>


                            <td>

                                <button
                                    class="detail-link"
                                    data-screener-detail="${coin.id}"
                                >
                                    View
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    setupScreenerInteractions();

}


function setupScreenerInteractions(){

    document
        .querySelectorAll(
            "[data-screener-watch]"
        )
        .forEach(
            button => {

                button.onclick =
                    function(event){

                        event.stopPropagation();

                        toggleWatchlist(
                            button.dataset
                                .screenerWatch
                        );

                    };

            }
        );


    document
        .querySelectorAll(
            "[data-screener-detail]"
        )
        .forEach(
            button => {

                button.onclick =
                    function(event){

                        event.stopPropagation();

                        loadCoinDetails(
                            button.dataset
                                .screenerDetail
                        );

                    };

            }
        );


    document
        .querySelectorAll(
            "#screenerTableBody tr[data-screener-coin]"
        )
        .forEach(
            row => {

                row.onclick =
                    function(){

                        loadCoinDetails(
                            row.dataset
                                .screenerCoin
                        );

                    };

            }
        );

}


function setupScreener(){

    const elements = [

        document.getElementById(
            "screenerSearch"
        ),

        document.getElementById(
            "screenerSort"
        ),

        document.getElementById(
            "screenerDirection"
        ),

        document.getElementById(
            "minChange"
        ),

        document.getElementById(
            "maxChange"
        ),

        document.getElementById(
            "minMarketCap"
        ),

        document.getElementById(
            "maxMarketCap"
        )

    ].filter(Boolean);


    elements.forEach(
        element => {

            element.addEventListener(
                "input",
                renderScreener
            );

            element.addEventListener(
                "change",
                renderScreener
            );

        }
    );


    document
        .querySelectorAll(
            ".quick-filter"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function(){

                        document
                            .querySelectorAll(
                                ".quick-filter"
                            )
                            .forEach(
                                item =>
                                    item.classList.remove(
                                        "active"
                                    )
                            );


                        button.classList.add(
                            "active"
                        );


                        screenerQuickFilter =
                            button.dataset.filter;


                        renderScreener();

                    }
                );

            }
        );


    const reset =
        document.getElementById(
            "resetScreener"
        );


    if(reset){

        reset.addEventListener(
            "click",
            function(){

                elements.forEach(
                    element => {

                        if(
                            element.tagName ===
                            "SELECT"
                        ){

                            if(
                                element.id ===
                                "screenerSort"
                            ){

                                element.value =
                                    "market_cap_rank";

                            }else{

                                element.value =
                                    "desc";

                            }

                        }else{

                            element.value =
                                "";

                        }

                    }
                );


                screenerQuickFilter =
                    "all";


                document
                    .querySelectorAll(
                        ".quick-filter"
                    )
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                document
                    .querySelector(
                        '.quick-filter[data-filter="all"]'
                    )
                    ?.classList.add(
                        "active"
                    );


                renderScreener();

            }
        );

    }

}


/* =========================
   COMPARE
========================= */

function populateCompareSelectors(){

    const selectors = [

        document.getElementById(
            "compareCoin1"
        ),

        document.getElementById(
            "compareCoin2"
        ),

        document.getElementById(
            "compareCoin3"
        )

    ];


    selectors.forEach(
        selector => {

            if(!selector){
                return;
            }


            const previous =
                selector.value;


            const optional =
                selector.id ===
                "compareCoin3";


            selector.innerHTML =
                `<option value="">
                    ${
                        optional
                            ? "Optional"
                            : "Select coin"
                    }
                </option>`;


            allCoins.forEach(
                coin => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        coin.id;


                    option.textContent =
                        coin.name
                        +
                        " ("
                        +
                        coin.symbol.toUpperCase()
                        +
                        ")";


                    selector.appendChild(
                        option
                    );

                }
            );


            if(
                previous
            ){

                selector.value =
                    previous;

            }

        }
    );


    if(
        compareSelection.length
    ){

        selectors.forEach(
            (
                selector,
                index
            ) => {

                if(
                    selector &&
                    compareSelection[index]
                ){

                    selector.value =
                        compareSelection[index];

                }

            }
        );

    }

}


function saveCompareSelection(){

    const selection = [

        document.getElementById(
            "compareCoin1"
        )?.value,

        document.getElementById(
            "compareCoin2"
        )?.value,

        document.getElementById(
            "compareCoin3"
        )?.value

    ].filter(Boolean);


    compareSelection =
        selection;


    localStorage.setItem(
        "cryptoOnlineCompare",
        JSON.stringify(
            compareSelection
        )
    );

}


function setupCompare(){

    const button =
        document.getElementById(
            "compareButton"
        );


    if(!button){
        return;
    }


    button.addEventListener(
        "click",
        function(){

            saveCompareSelection();

            runComparison();

        }
    );

}


async function runComparison(){

    const status =
        document.getElementById(
            "compareStatus"
        );


    const results =
        document.getElementById(
            "compareResults"
        );


    if(
        compareSelection.length < 2
    ){

        if(status){

            status.textContent =
                "Select at least two cryptocurrencies to compare.";

        }

        return;

    }


    if(status){

        status.textContent =
            "Loading comparison data...";

    }


    try{

        const coins =
            await Promise.all(
                compareSelection.map(
                    id =>
                        getFullCoinData(
                            id
                        )
                )
            );


        renderComparison(
            coins
        );


        if(status){

            status.textContent =
                "Comparison updated using live market data.";

        }


    }catch(error){

        console.log(
            "Comparison error:",
            error
        );


        if(results){

            results.innerHTML = `

                <div class="compare-empty">
                    Unable to load comparison data right now.
                    Please try again.
                </div>

            `;

        }


        if(status){

            status.textContent =
                "Comparison data could not be loaded.";

        }

    }

}


async function getFullCoinData(
    id
){

    if(
        coinCache[id]
    ){

        return coinCache[id];

    }


    const response =
        await fetch(
            `${API}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
        );


    const coin =
        await response.json();


    coinCache[id] =
        coin;


    return coin;

}


function renderComparison(
    coins
){

    const results =
        document.getElementById(
            "compareResults"
        );


    if(!results){
        return;
    }


    results.innerHTML = `

        <div class="compare-cards">

            ${
                coins.map(
                    coin => {

                        const market =
                            coin.market_data
                            || {};


                        const change =
                            market
                                .price_change_percentage_24h
                            || 0;


                        return `

                            <div class="compare-card">

                                <div class="compare-card-header">

                                    <img
                                        src="${
                                            coin.image.small
                                            ||
                                            coin.image.thumb
                                        }"
                                        alt="${escapeHTML(
                                            coin.name
                                        )}"
                                    >


                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                coin.name
                                            )}
                                        </strong>

                                        <span>
                                            ${coin.symbol.toUpperCase()}
                                        </span>

                                    </div>

                                </div>


                                <div class="compare-metrics">

                                    <div>

                                        <span>
                                            Price
                                        </span>

                                        <strong>
                                            ${formatMoney(
                                                market
                                                    .current_price
                                                    ?.usd
                                            )}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            24H
                                        </span>

                                        <strong
                                            class="${getChangeClass(
                                                change
                                            )}"
                                        >
                                            ${change >= 0 ? "+" : ""}
                                            ${change.toFixed(2)}%
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Market Cap
                                        </span>

                                        <strong>
                                            ${formatMoney(
                                                market
                                                    .market_cap
                                                    ?.usd
                                            )}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Volume
                                        </span>

                                        <strong>
                                            ${formatMoney(
                                                market
                                                    .total_volume
                                                    ?.usd
                                            )}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Rank
                                        </span>

                                        <strong>
                                            #${
                                                coin.market_cap_rank
                                                || "--"
                                            }
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Supply
                                        </span>

                                        <strong>
                                            ${formatSupply(
                                                market
                                                    .circulating_supply
                                            )}
                                        </strong>

                                    </div>

                                </div>

                            </div>

                        `;

                    }
                ).join("")
            }

        </div>


        <div class="panel">

            ${
                renderComparisonTable(
                    coins
                )
            }

        </div>


        <div class="compare-chart-panel">

            <h3>
                7-Day Performance Comparison
            </h3>


            <div class="compare-chart-container">

                <canvas id="compareChart"></canvas>

            </div>

        </div>

    `;


    renderCompareChart(
        coins
    );

}


function renderComparisonTable(
    coins
){

    const rows = [

        [
            "Price",
            coin =>
                formatMoney(
                    coin.market_data
                        ?.current_price
                        ?.usd
                )
        ],

        [
            "24H Change",
            coin =>
                (
                    coin.market_data
                        ?.price_change_percentage_24h
                    || 0
                ).toFixed(2)
                + "%"
        ],

        [
            "Market Cap",
            coin =>
                formatMoney(
                    coin.market_data
                        ?.market_cap
                        ?.usd
                )
        ],

        [
            "24H Volume",
            coin =>
                formatMoney(
                    coin.market_data
                        ?.total_volume
                        ?.usd
                )
        ],

        [
            "Market Cap Rank",
            coin =>
                "#"
                +
                (
                    coin.market_cap_rank
                    || "--"
                )
        ],

        [
            "Circulating Supply",
            coin =>
                formatSupply(
                    coin.market_data
                        ?.circulating_supply
                )
        ],

        [
            "All-Time High",
            coin =>
                formatMoney(
                    coin.market_data
                        ?.ath
                        ?.usd
                )
        ],

        [
            "All-Time Low",
            coin =>
                formatMoney(
                    coin.market_data
                        ?.atl
                        ?.usd
                )
        ]

    ];


    return `

        <div class="table-wrapper">

            <table class="compare-table">

                <thead>

                    <tr>

                        <th>
                            Metric
                        </th>

                        ${
                            coins.map(
                                coin =>
                                    `<th>
                                        ${escapeHTML(
                                            coin.name
                                        )}
                                    </th>`
                            ).join("")
                        }

                    </tr>

                </thead>


                <tbody>

                    ${
                        rows.map(
                            row => `

                                <tr>

                                    <td>
                                        <strong>
                                            ${row[0]}
                                        </strong>
                                    </td>


                                    ${
                                        coins.map(
                                            coin =>
                                                `<td>
                                                    ${row[1](coin)}
                                                </td>`
                                        ).join("")
                                    }

                                </tr>

                            `
                        ).join("")
                    }

                </tbody>

            </table>

        </div>

    `;

}


async function renderCompareChart(
    coins
){

    try{

        const datasets =
            [];


        const labelsSet =
            new Set();


        for(
            let index = 0;
            index < coins.length;
            index++
        ){

            const coin =
                coins[index];


            const response =
                await fetch(
                    `${API}/coins/${coin.id}/market_chart?vs_currency=usd&days=7&interval=daily`
                );


            const data =
                await response.json();


            const prices =
                data.prices || [];


            if(
                prices.length === 0
            ){

                continue;

            }


            const base =
                prices[0][1];


            const normalized =
                prices.map(
                    item => {

                        const date =
                            new Date(
                                item[0]
                            ).toLocaleDateString(
                                [],
                                {
                                    month:"short",
                                    day:"numeric"
                                }
                            );


                        labelsSet.add(
                            date
                        );


                        return (
                            (
                                item[1] /
                                base
                            ) - 1
                        ) * 100;

                    }
                );


            datasets.push({

                label:
                    coin.symbol.toUpperCase(),

                data:
                    normalized,

                borderColor:
                    [
                        "#1769e0",
                        "#7a4ee8",
                        "#20a96b"
                    ][index]
                    ||
                    "#1769e0",

                tension:.3,

                pointRadius:2

            });

        }


        const canvas =
            document.getElementById(
                "compareChart"
            );


        if(!canvas){
            return;
        }


        if(compareChart){

            compareChart.destroy();

        }


        compareChart =
            new Chart(
                canvas,
                {

                    type:"line",


                    data:{

                        labels:
                            Array.from(
                                labelsSet
                            ),

                        datasets

                    },


                    options:{

                        responsive:true,

                        maintainAspectRatio:false,


                        plugins:{

                            legend:{
                                position:"top"
                            }

                        },


                        scales:{

                            y:{

                                ticks:{

                                    callback:
                                        value =>
                                            value
                                            + "%"

                                }

                            }

                        }

                    }

                }
            );


    }catch(error){

        console.log(
            "Compare chart error:",
            error
        );

    }

}


/* =========================
   PORTFOLIO
========================= */

function savePortfolio(){

    localStorage.setItem(
        "cryptoOnlinePortfolio",
        JSON.stringify(
            portfolio
        )
    );

}


function populatePortfolioSelector(){

    const select =
        document.getElementById(
            "portfolioCoin"
        );


    if(!select){
        return;
    }


    const current =
        select.value;


    select.innerHTML =
        `
        <option value="">
            Select cryptocurrency
        </option>
        `;


    allCoins.forEach(
        coin => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                coin.id;


            option.textContent =
                coin.name
                +
                " ("
                +
                coin.symbol.toUpperCase()
                +
                ")";


            select.appendChild(
                option
            );

        }
    );


    if(current){

        select.value =
            current;

    }

}


function setupPortfolio(){

    const openButton =
        document.getElementById(
            "openPortfolioForm"
        );


    const cancelButton =
        document.getElementById(
            "cancelPortfolioForm"
        );


    const saveButton =
        document.getElementById(
            "savePortfolioAsset"
        );


    const panel =
        document.getElementById(
            "portfolioFormPanel"
        );


    if(openButton){

        openButton.addEventListener(
            "click",
            function(){

                panel?.classList.remove(
                    "hidden"
                );

                panel?.scrollIntoView({
                    behavior:"smooth",
                    block:"center"
                });

            }
        );

    }


    if(cancelButton){

        cancelButton.addEventListener(
            "click",
            function(){

                panel?.classList.add(
                    "hidden"
                );

                clearPortfolioForm();

            }
        );

    }


    if(saveButton){

        saveButton.addEventListener(
            "click",
            addPortfolioAsset
        );

    }

}


function addPortfolioAsset(){

    const coinId =
        document.getElementById(
            "portfolioCoin"
        )?.value;


    const quantity =
        parseFloat(
            document.getElementById(
                "portfolioQuantity"
            )?.value
        );


    const buyPrice =
        parseFloat(
            document.getElementById(
                "portfolioBuyPrice"
            )?.value
        );


    const message =
        document.getElementById(
            "portfolioFormMessage"
        );


    if(
        !coinId ||
        Number.isNaN(quantity) ||
        quantity <= 0 ||
        Number.isNaN(buyPrice) ||
        buyPrice < 0
    ){

        if(message){

            message.textContent =
                "Please select an asset and enter valid quantity and purchase price.";

        }

        return;

    }


    const coin =
        allCoins.find(
            item =>
                item.id === coinId
        );


    if(!coin){

        if(message){

            message.textContent =
                "The selected asset could not be found.";

        }

        return;

    }


    const existing =
        portfolio.find(
            item =>
                item.coinId === coinId
        );


    if(existing){

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


    }else{

        portfolio.push({

            coinId,

            quantity,

            buyPrice

        });

    }


    savePortfolio();

    clearPortfolioForm();

    document
        .getElementById(
            "portfolioFormPanel"
        )
        ?.classList.add(
            "hidden"
        );


    renderPortfolio();

}


function clearPortfolioForm(){

    const coin =
        document.getElementById(
            "portfolioCoin"
        );


    const quantity =
        document.getElementById(
            "portfolioQuantity"
        );


    const price =
        document.getElementById(
            "portfolioBuyPrice"
        );


    const message =
        document.getElementById(
            "portfolioFormMessage"
        );


    if(coin){
        coin.value = "";
    }


    if(quantity){
        quantity.value = "";
    }


    if(price){
        price.value = "";
    }


    if(message){
        message.textContent = "";
    }

}


function removePortfolioAsset(
    coinId
){

    portfolio =
        portfolio.filter(
            item =>
                item.coinId !== coinId
        );


    savePortfolio();

    renderPortfolio();

}


function getPortfolioData(){

    return portfolio
        .map(
            holding => {

                const coin =
                    allCoins.find(
                        item =>
                            item.id ===
                            holding.coinId
                    );


                if(!coin){
                    return null;
                }


                const currentPrice =
                    coin.current_price
                    || 0;


                const currentValue =
                    holding.quantity *
                    currentPrice;


                const invested =
                    holding.quantity *
                    holding.buyPrice;


                const profit =
                    currentValue -
                    invested;


                const profitPercent =
                    invested > 0
                        ? (
                            profit /
                            invested
                        ) * 100
                        : 0;


                return {

                    ...holding,

                    coin,

                    currentPrice,

                    currentValue,

                    invested,

                    profit,

                    profitPercent

                };

            }
        )
        .filter(Boolean);

}


function renderPortfolio(){

    const tableBody =
        document.getElementById(
            "portfolioTableBody"
        );


    if(!tableBody){
        return;
    }


    const data =
        getPortfolioData();


    let totalValue = 0;

    let totalInvested = 0;


    data.forEach(
        item => {

            totalValue +=
                item.currentValue;

            totalInvested +=
                item.invested;

        }
    );


    const totalProfit =
        totalValue -
        totalInvested;


    const totalProfitPercent =
        totalInvested > 0
            ? (
                totalProfit /
                totalInvested
            ) * 100
            : 0;


    const valueElement =
        document.getElementById(
            "portfolioValue"
        );


    const investedElement =
        document.getElementById(
            "portfolioInvested"
        );


    const profitElement =
        document.getElementById(
            "portfolioProfit"
        );


    const profitPercentElement =
        document.getElementById(
            "portfolioProfitPercent"
        );


    const countElement =
        document.getElementById(
            "portfolioHoldingsCount"
        );


    const intelligenceElement =
        document.getElementById(
            "portfolioIntelligence"
        );


    if(valueElement){

        valueElement.textContent =
            formatMoney(
                totalValue
            );

    }


    if(investedElement){

        investedElement.textContent =
            formatMoney(
                totalInvested
            );

    }


    if(profitElement){

        profitElement.textContent =
            formatMoney(
                totalProfit
            );


        profitElement.className =
            "stat-value "
            +
            getChangeClass(
                totalProfit
            );

    }


    if(profitPercentElement){

        profitPercentElement.textContent =
            (
                totalProfitPercent >= 0
                    ? "+"
                    : ""
            )
            +
            totalProfitPercent.toFixed(2)
            +
            "%";


        profitPercentElement.className =
            "stat-sub "
            +
            getChangeClass(
                totalProfitPercent
            );

    }


    if(countElement){

        countElement.textContent =
            data.length;

    }


    if(intelligenceElement){

        intelligenceElement.textContent =
            formatMoney(
                totalValue
            );

    }


    if(data.length === 0){

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="loading-state"
                >
                    Your portfolio is empty.
                    Click "+ Add Asset" to begin.
                </td>

            </tr>

        `;

        renderPortfolioChart(
            []
        );

        renderPortfolioAllocation(
            []
        );

        return;

    }


    tableBody.innerHTML =
        data
            .map(
                item => {

                    return `

                        <tr>

                            <td>

                                <div class="portfolio-asset">

                                    <img
                                        src="${item.coin.image}"
                                        alt="${escapeHTML(
                                            item.coin.name
                                        )}"
                                    >


                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                item.coin.name
                                            )}
                                        </strong>

                                        <span>
                                            ${item.coin.symbol.toUpperCase()}
                                        </span>

                                    </div>

                                </div>

                            </td>


                            <td>
                                ${Number(
                                    item.quantity
                                ).toLocaleString(
                                    undefined,
                                    {
                                        maximumFractionDigits:8
                                    }
                                )}
                            </td>


                            <td>
                                ${formatMoney(
                                    item.buyPrice
                                )}
                            </td>


                            <td>
                                ${formatMoney(
                                    item.currentPrice
                                )}
                            </td>


                            <td>
                                ${formatMoney(
                                    item.currentValue
                                )}
                            </td>


                            <td
                                class="portfolio-profit ${
                                    getChangeClass(
                                        item.profit
                                    )
                                }"
                            >

                                <strong>
                                    ${item.profit >= 0 ? "+" : ""}
                                    ${formatMoney(
                                        item.profit
                                    )}
                                </strong>

                                <br>

                                <small>
                                    ${
                                        item.profitPercent >= 0
                                            ? "+"
                                            : ""
                                    }
                                    ${item.profitPercent.toFixed(2)}%
                                </small>

                            </td>


                            <td>

                                <button
                                    class="remove-portfolio"
                                    data-remove-portfolio="${item.coinId}"
                                >
                                    Remove
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    document
        .querySelectorAll(
            "[data-remove-portfolio]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function(){

                        removePortfolioAsset(
                            button.dataset
                                .removePortfolio
                        );

                    }
                );

            }
        );


    renderPortfolioChart(
        data
    );


    renderPortfolioAllocation(
        data
    );

}


function renderPortfolioChart(
    data
){

    const canvas =
        document.getElementById(
            "portfolioChart"
        );


    if(!canvas){
        return;
    }


    if(portfolioChart){

        portfolioChart.destroy();

    }


    if(data.length === 0){

        portfolioChart = null;

        return;

    }


    const labels =
        data.map(
            item =>
                item.coin.symbol.toUpperCase()
        );


    const values =
        data.map(
            item =>
                item.currentValue
        );


    portfolioChart =
        new Chart(
            canvas,
            {

                type:"doughnut",


                data:{

                    labels,

                    datasets:[

                        {

                            data:values,

                            backgroundColor:[
                                "#1769e0",
                                "#7a4ee8",
                                "#20a96b",
                                "#f2a93b",
                                "#dc5a68",
                                "#36a6a6",
                                "#8a6bd1",
                                "#5577aa"
                            ]

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

}


function renderPortfolioAllocation(
    data
){

    const container =
        document.getElementById(
            "portfolioAllocationList"
        );


    if(!container){
        return;
    }


    if(data.length === 0){

        container.innerHTML =
            `
            <div class="loading-state">
                No allocation data yet.
            </div>
            `;

        return;

    }


    const total =
        data.reduce(
            (
                sum,
                item
            ) =>
                sum +
                item.currentValue,
            0
        );


    container.innerHTML =
        data
            .sort(
                (a,b) =>
                    b.currentValue -
                    a.currentValue
            )
            .map(
                item => {

                    const percentage =
                        total > 0
                            ? (
                                item.currentValue /
                                total
                            ) * 100
                            : 0;


                    return `

                        <div class="allocation-row">

                            <div class="allocation-name">

                                <img
                                    src="${item.coin.image}"
                                    alt=""
                                >

                                <span>
                                    ${item.coin.symbol.toUpperCase()}
                                </span>

                            </div>


                            <strong>
                                ${percentage.toFixed(2)}%
                            </strong>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================
   GLOBAL SEARCH
========================= */

function setupGlobalSearch(){

    const input =
        document.getElementById(
            "globalSearch"
        );


    const results =
        document.getElementById(
            "globalSearchResults"
        );


    if(!input || !results){
        return;
    }


    input.addEventListener(
        "input",
        function(){

            const query =
                input.value
                    .trim()
                    .toLowerCase();


            if(!query){

                results.style.display =
                    "none";

                results.innerHTML =
                    "";

                return;

            }


            const matches =
                allCoins
                    .filter(
                        coin =>
                            coin.name
                                .toLowerCase()
                                .includes(query)
                            ||
                            coin.symbol
                                .toLowerCase()
                                .includes(query)
                    )
                    .slice(0,8);


            if(
                matches.length === 0
            ){

                results.innerHTML =
                    `
                    <div class="loading-state">
                        No assets found.
                    </div>
                    `;


                results.style.display =
                    "block";


                return;

            }


            results.innerHTML =
                matches
                    .map(
                        coin => `

                            <div
                                class="global-result"
                                data-search-id="${coin.id}"
                            >

                                <img
                                    src="${coin.image}"
                                    alt="${escapeHTML(
                                        coin.name
                                    )}"
                                >


                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            coin.name
                                        )}
                                    </strong>

                                    <span>
                                        ${coin.symbol.toUpperCase()}
                                    </span>

                                </div>

                            </div>

                        `
                    )
                    .join("");


            results.style.display =
                "block";


            document
                .querySelectorAll(
                    "[data-search-id]"
                )
                .forEach(
                    item => {

                        item.onclick =
                            function(){

                                results.style.display =
                                    "none";


                                input.value =
                                    "";


                                loadCoinDetails(
                                    item.dataset
                                        .searchId
                                );

                            };

                    }
                );

        }
    );


    document.addEventListener(
        "click",
        function(event){

            if(
                !event.target.closest(
                    ".global-search"
                )
            ){

                results.style.display =
                    "none";

            }

        }
    );

}


/* =========================
   MOBILE MENU
========================= */

function setupMobileMenu(){

    const button =
        document.getElementById(
            "mobileMenuButton"
        );


    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    if(!button || !sidebar){
        return;
    }


    button.addEventListener(
        "click",
        function(){

            sidebar.classList.toggle(
                "open"
            );

        }
    );


    document
        .querySelectorAll(
            ".nav-link"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    function(){

                        sidebar.classList.remove(
                            "open"
                        );

                    }
                );

            }
        );

}


/* =========================
   REFRESH
========================= */

function setupRefresh(){

    const button =
        document.getElementById(
            "refreshButton"
        );


    if(button){

        button.addEventListener(
            "click",
            async function(){

                button.textContent =
                    "⟳";


                await loadMarket();

                await loadTrending();

                await loadFearGreed();

                await loadBitcoinChart();


                button.textContent =
                    "↻";

            }
        );

    }

}


/* =========================
   NAVIGATION
========================= */

function setupNavigation(){

    const links =
        document.querySelectorAll(
            ".nav-link"
        );


    links.forEach(
        link => {

            link.addEventListener(
                "click",
                function(){

                    links.forEach(
                        item =>
                            item.classList.remove(
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

}


/* =========================
   START
========================= */

loadMarket();

loadTrending();

loadBitcoinChart();

loadFearGreed();

loadCoinExplorer();


setupCoinExplorer();

setupGlobalSearch();

setupCloseDetails();

setupDetailWatchButton();

setupCompare();

setupScreener();

setupPortfolio();

setupMobileMenu();

setupRefresh();

setupNavigation();


renderWatchlist();

updateWatchlistCount();

renderPortfolio();


/* AUTO REFRESH */

setInterval(
    loadMarket,
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
