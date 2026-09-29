const API = "https://api.coingecko.com/api/v3";

let btcChart = null;
let coinDetailChart = null;
let compareChart = null;

let allCoins = [];
let coinPage = 1;

const coinsPerPage = 25;

let watchlist = JSON.parse(
    localStorage.getItem("cryptoOnlineWatchlist") || "[]"
);

let compareSelection = JSON.parse(
    localStorage.getItem("cryptoOnlineCompare") || "[]"
);

const coinCache = {};


/* =========================
   BASIC HELPERS
========================= */

function formatMoney(value){

    if(value === null || value === undefined || isNaN(value)){
        return "--";
    }

    if(value >= 1e12){
        return "$" + (value / 1e12).toFixed(2) + "T";
    }

    if(value >= 1e9){
        return "$" + (value / 1e9).toFixed(2) + "B";
    }

    if(value >= 1e6){
        return "$" + (value / 1e6).toFixed(2) + "M";
    }

    if(value >= 1000){
        return "$" + value.toLocaleString(undefined,{
            maximumFractionDigits:2
        });
    }

    if(value >= 1){
        return "$" + value.toFixed(2);
    }

    return "$" + value.toFixed(6);
}


function formatNumber(value){

    if(value === null || value === undefined || isNaN(value)){
        return "--";
    }

    return Number(value).toLocaleString(undefined,{
        maximumFractionDigits:2
    });
}


function formatSupply(value){

    if(value === null || value === undefined){
        return "--";
    }

    if(value >= 1e9){
        return (value / 1e9).toFixed(2) + "B";
    }

    if(value >= 1e6){
        return (value / 1e6).toFixed(2) + "M";
    }

    if(value >= 1e3){
        return (value / 1e3).toFixed(2) + "K";
    }

    return Number(value).toLocaleString();
}


function escapeHTML(text){

    if(!text){
        return "";
    }

    return String(text)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}


function getChangeClass(value){

    return Number(value) >= 0 ? "positive" : "negative";
}


/* =========================
   GLOBAL MARKET
========================= */

async function loadMarket(){

    try{

        const response = await fetch(`${API}/global`);

        if(!response.ok){
            throw new Error("Market request failed");
        }

        const data = await response.json();
        const market = data.data;

        const statValues =
            document.querySelectorAll(".stat-value");

        if(statValues[0]){
            statValues[0].textContent =
                formatMoney(market.total_market_cap.usd);
        }

        if(statValues[1]){
            statValues[1].textContent =
                formatMoney(market.total_volume.usd);
        }

        if(statValues[2]){
            statValues[2].textContent =
                Number(
                    market.market_cap_percentage.btc
                ).toFixed(1) + "%";
        }

        if(statValues[3]){
            statValues[3].textContent =
                Number(
                    market.market_cap_percentage.eth
                ).toFixed(1) + "%";
        }

        loadCoins();

    }catch(error){

        console.log("Market data error:",error);

    }

}


/* =========================
   MARKET COINS
========================= */

async function loadCoins(){

    try{

        const response = await fetch(
            `${API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`
        );

        if(!response.ok){
            throw new Error("Coins request failed");
        }

        const coins = await response.json();

        allCoins = coins;

        coins.forEach(coin => {
            coinCache[coin.id] = coin;
        });

        const btc = coins.find(
            coin => coin.id === "bitcoin"
        );

        if(btc){

            const chartPrice =
                document.querySelector(".chart-price strong");

            const chartChange =
                document.querySelector(".chart-price span");

            const assetTitle =
                document.querySelector(".asset-title h3");

            const assetSymbol =
                document.querySelector(".asset-title span");

            if(chartPrice){
                chartPrice.textContent =
                    formatMoney(btc.current_price);
            }

            if(chartChange){
                chartChange.textContent =
                    Number(
                        btc.price_change_percentage_24h
                    ).toFixed(2) + "%";

                chartChange.className =
                    getChangeClass(
                        btc.price_change_percentage_24h
                    );
            }

            if(assetTitle){
                assetTitle.textContent = btc.name;
            }

            if(assetSymbol){
                assetSymbol.textContent =
                    btc.symbol.toUpperCase();
            }

            const intelligence =
                document.getElementById("btcIntelligence");

            if(intelligence){
                intelligence.textContent =
                    formatMoney(btc.current_price) +
                    " / " +
                    Number(
                        btc.price_change_percentage_24h
                    ).toFixed(2) +
                    "%";
            }

        }

        renderMovers(coins);

        updateWatchlistFromMarket(coins);

        populateCompareSelectors();

    }catch(error){

        console.log("Coin data error:",error);

    }

}


/* =========================
   MARKET MOVERS
========================= */

function renderMovers(coins){

    const gainers =
        [...coins]
        .filter(c =>
            typeof c.price_change_percentage_24h === "number"
        )
        .sort(
            (a,b) =>
                b.price_change_percentage_24h -
                a.price_change_percentage_24h
        )
        .slice(0,5);


    const losers =
        [...coins]
        .filter(c =>
            typeof c.price_change_percentage_24h === "number"
        )
        .sort(
            (a,b) =>
                a.price_change_percentage_24h -
                b.price_change_percentage_24h
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

}


function renderMoverList(elementId,coins){

    const container =
        document.getElementById(elementId);

    if(!container){
        return;
    }

    if(!coins.length){
        container.innerHTML =
            `<div class="loading">No data available.</div>`;
        return;
    }

    container.innerHTML = coins.map(coin => {

        const change =
            Number(
                coin.price_change_percentage_24h || 0
            );

        return `
            <div
                class="coin-list-item"
                data-coin-id="${coin.id}"
            >

                <img
                    src="${coin.image}"
                    alt="${escapeHTML(coin.name)}"
                >

                <div class="coin-name">

                    <strong>
                        ${escapeHTML(coin.name)}
                    </strong>

                    <small>
                        ${coin.symbol.toUpperCase()}
                    </small>

                </div>

                <div class="coin-change ${getChangeClass(change)}">
                    ${change >= 0 ? "+" : ""}
                    ${change.toFixed(2)}%
                </div>

            </div>
        `;

    }).join("");

    setupMoverClicks();

}


/* =========================
   TRENDING
========================= */

async function loadTrending(){

    try{

        const response =
            await fetch(`${API}/search/trending`);

        if(!response.ok){
            throw new Error("Trending request failed");
        }

        const data = await response.json();

        const coins =
            data.coins.slice(0,5);

        const container =
            document.getElementById("trendingList");

        if(!container){
            return;
        }

        container.innerHTML = coins.map(item => {

            const coin = item.item;

            return `
                <div
                    class="coin-list-item"
                    data-coin-id="${coin.id}"
                >

                    <img
                        src="${coin.small}"
                        alt="${escapeHTML(coin.name)}"
                    >

                    <div class="coin-name">

                        <strong>
                            ${escapeHTML(coin.name)}
                        </strong>

                        <small>
                            ${coin.symbol}
                        </small>

                    </div>

                    <div class="coin-change">
                        #${coin.market_cap_rank || "--"}
                    </div>

                </div>
            `;

        }).join("");

        setupMoverClicks();

    }catch(error){

        console.log("Trending error:",error);

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

        if(!response.ok){
            throw new Error("BTC chart request failed");
        }

        const data = await response.json();

        const canvas =
            document.getElementById("btcChart");

        if(!canvas){
            return;
        }

        const labels =
            data.prices.map(item =>
                new Date(item[0]).toLocaleDateString(
                    [],
                    {
                        month:"short",
                        day:"numeric"
                    }
                )
            );

        const prices =
            data.prices.map(item => item[1]);


        if(btcChart){
            btcChart.destroy();
        }


        btcChart = new Chart(
            canvas.getContext("2d"),
            {
                type:"line",

                data:{
                    labels:labels,

                    datasets:[
                        {
                            label:"Bitcoin",
                            data:prices,
                            borderColor:"#1769e0",
                            backgroundColor:"rgba(23,105,224,.08)",
                            borderWidth:2,
                            fill:true,
                            tension:.35,
                            pointRadius:0
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
                                callback:function(value){
                                    return formatMoney(value);
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

        console.log("Bitcoin chart error:",error);

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

        if(!response.ok){
            throw new Error("Fear and Greed request failed");
        }

        const data =
            await response.json();

        const result =
            data.data[0];

        const value =
            parseInt(result.value);

        const classification =
            result.value_classification;


        const valueElement =
            document.getElementById("fearGreedValue");

        const labelElement =
            document.getElementById("fearGreedLabel");

        const intelligenceElement =
            document.getElementById("sentimentIntelligence");


        if(valueElement){
            valueElement.textContent = value;
        }

        if(labelElement){
            labelElement.textContent =
                classification;
        }

        if(intelligenceElement){
            intelligenceElement.textContent =
                classification +
                " (" +
                value +
                ")";
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

        const response =
            await fetch(
                `${API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`
            );

        if(!response.ok){
            throw new Error("Explorer request failed");
        }

        const coins =
            await response.json();

        allCoins = coins;

        coins.forEach(coin => {
            coinCache[coin.id] = coin;
        });

        coinPage = 1;

        renderCoins();

        populateCompareSelectors();

    }catch(error){

        console.log(
            "Coin explorer error:",
            error
        );

    }

}


function renderCoins(){

    const tbody =
        document.getElementById("coinTableBody");

    if(!tbody){
        return;
    }

    const searchInput =
        document.getElementById("coinSearch");

    const search =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";


    const filtered =
        allCoins.filter(coin => {

            return (
                coin.name.toLowerCase().includes(search) ||
                coin.symbol.toLowerCase().includes(search)
            );

        });


    const visible =
        filtered.slice(
            0,
            coinPage * coinsPerPage
        );


    if(!visible.length){

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    No cryptocurrency found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        visible.map(coin => {

            const change =
                Number(
                    coin.price_change_percentage_24h || 0
                );

            const watchActive =
                isInWatchlist(coin.id);

            return `
                <tr
                    class="coin-row"
                    data-coin-id="${coin.id}"
                >

                    <td class="rank-number">
                        #${coin.market_cap_rank || "--"}
                    </td>

                    <td>

                        <div class="table-asset">

                            <img
                                src="${coin.image}"
                                alt="${escapeHTML(coin.name)}"
                            >

                            <div>

                                <strong>
                                    ${escapeHTML(coin.name)}
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

                    <td class="${getChangeClass(change)}">
                        ${change >= 0 ? "+" : ""}
                        ${change.toFixed(2)}%
                    </td>

                    <td>
                        ${formatMoney(coin.market_cap)}
                    </td>

                    <td>
                        ${formatMoney(coin.total_volume)}
                    </td>

                    <td>

                        <button
                            class="watch-small ${watchActive ? "active" : ""}"
                            data-watch-id="${coin.id}"
                            title="Watchlist"
                        >
                            ${watchActive ? "★" : "☆"}
                        </button>

                    </td>

                </tr>
            `;

        }).join("");


    setupCoinRowClicks();
    setupWatchButtons();


    const loadMore =
        document.getElementById("loadMoreCoins");

    if(loadMore){

        loadMore.style.display =
            visible.length < filtered.length
                ? "inline-flex"
                : "none";

    }

}


function setupCoinExplorer(){

    const search =
        document.getElementById("coinSearch");

    const loadMore =
        document.getElementById("loadMoreCoins");


    if(search){

        search.addEventListener(
            "input",
            () => {

                coinPage = 1;

                renderCoins();

            }
        );

    }


    if(loadMore){

        loadMore.addEventListener(
            "click",
            () => {

                coinPage++;

                renderCoins();

            }
        );

    }

}


/* =========================
   COIN DETAILS
========================= */

async function loadCoinDetails(id){

    if(!id){
        return;
    }

    const section =
        document.getElementById("coin-details");

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

        if(!response.ok){
            throw new Error("Coin details request failed");
        }

        const coin =
            await response.json();

        coinCache[id] = coin;

        displayCoinDetails(coin);

        loadCoinDetailChart(id);

        updateDetailWatchButton();

    }catch(error){

        console.log(
            "Coin details error:",
            error
        );

    }

}


function displayCoinDetails(coin){

    const image =
        document.getElementById("detailCoinImage");

    const name =
        document.getElementById("detailCoinName");

    const symbol =
        document.getElementById("detailCoinSymbol");

    const rank =
        document.getElementById("detailCoinRank");

    const price =
        document.getElementById("detailCoinPrice");

    const change =
        document.getElementById("detailCoinChange");

    const marketCap =
        document.getElementById("detailMarketCap");

    const volume =
        document.getElementById("detailVolume");

    const circulating =
        document.getElementById("detailCirculating");

    const totalSupply =
        document.getElementById("detailTotalSupply");

    const ath =
        document.getElementById("detailAth");

    const atl =
        document.getElementById("detailAtl");

    const description =
        document.getElementById("detailDescription");


    if(image){
        image.src = coin.image.large;
        image.alt = coin.name;
    }

    if(name){
        name.textContent = coin.name;
    }

    if(symbol){
        symbol.textContent =
            coin.symbol.toUpperCase();
    }

    if(rank){
        rank.textContent =
            "Rank #" +
            (coin.market_cap_rank || "--");
    }


    const currentPrice =
        coin.market_data?.current_price?.usd;

    const change24 =
        coin.market_data?.price_change_percentage_24h;


    if(price){
        price.textContent =
            formatMoney(currentPrice);
    }

    if(change){

        change.textContent =
            Number(change24 || 0).toFixed(2) + "%";

        change.className =
            getChangeClass(change24);

    }


    if(marketCap){
        marketCap.textContent =
            formatMoney(
                coin.market_data?.market_cap?.usd
            );
    }

    if(volume){
        volume.textContent =
            formatMoney(
                coin.market_data?.total_volume?.usd
            );
    }

    if(circulating){
        circulating.textContent =
            formatSupply(
                coin.market_data?.circulating_supply
            );
    }

    if(totalSupply){
        totalSupply.textContent =
            formatSupply(
                coin.market_data?.total_supply
            );
    }

    if(ath){
        ath.textContent =
            formatMoney(
                coin.market_data?.ath?.usd
            );
    }

    if(atl){
        atl.textContent =
            formatMoney(
                coin.market_data?.atl?.usd
            );
    }


    if(description){

        let text =
            coin.description?.en || "";

        text =
            text.replace(/<[^>]*>/g,"");

        if(text.length > 900){
            text =
                text.substring(0,900) +
                "...";
        }

        description.textContent =
            text ||
            "No description available for this cryptocurrency.";

    }

}


async function loadCoinDetailChart(id){

    try{

        const response =
            await fetch(
                `${API}/coins/${id}/market_chart?vs_currency=usd&days=7&interval=daily`
            );

        if(!response.ok){
            throw new Error("Detail chart request failed");
        }

        const data =
            await response.json();

        const canvas =
            document.getElementById("coinDetailChart");

        if(!canvas){
            return;
        }


        const labels =
            data.prices.map(item =>
                new Date(item[0]).toLocaleDateString(
                    [],
                    {
                        month:"short",
                        day:"numeric"
                    }
                )
            );


        const prices =
            data.prices.map(item => item[1]);


        if(coinDetailChart){
            coinDetailChart.destroy();
        }


        coinDetailChart =
            new Chart(
                canvas.getContext("2d"),
                {
                    type:"line",

                    data:{
                        labels:labels,

                        datasets:[
                            {
                                data:prices,
                                borderColor:"#1769e0",
                                backgroundColor:"rgba(23,105,224,.08)",
                                fill:true,
                                tension:.35,
                                pointRadius:2,
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
                                grid:{
                                    display:false
                                },

                                ticks:{
                                    font:{
                                        size:9
                                    }
                                }
                            },

                            y:{
                                grid:{
                                    color:"#edf0f4"
                                },

                                ticks:{
                                    callback:value =>
                                        formatMoney(value),

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
            "Coin detail chart error:",
            error
        );

    }

}


/* =========================
   WATCHLIST
========================= */

function isInWatchlist(id){

    return watchlist.includes(id);

}


function saveWatchlist(){

    localStorage.setItem(
        "cryptoOnlineWatchlist",
        JSON.stringify(watchlist)
    );

}


function toggleWatchlist(id){

    if(!id){
        return;
    }


    if(isInWatchlist(id)){

        watchlist =
            watchlist.filter(
                item => item !== id
            );

    }else{

        watchlist.push(id);

    }


    saveWatchlist();

    renderWatchlist();

    updateWatchlistCount();

    updateDetailWatchButton();

    renderCoins();

}


function updateWatchlistCount(){

    const count =
        document.getElementById("watchlistCount");

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
            watchlist.length +
            (
                watchlist.length === 1
                    ? " asset"
                    : " assets"
            );

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


    updateWatchlistCount();


    if(!watchlist.length){

        container.innerHTML = `
            <div class="watchlist-empty">

                <div class="empty-icon">
                    ★
                </div>

                <h3>Your watchlist is empty</h3>

                <p>
                    Add cryptocurrencies from the Coin Explorer
                    to monitor them here.
                </p>

                <a
                    href="#coin-explorer"
                    class="primary-button"
                >
                    Explore Coins
                </a>

            </div>
        `;

        return;
    }


    const cards =
        watchlist.map(id => {

            const coin =
                coinCache[id];

            if(!coin){
                return "";
            }

            const change =
                Number(
                    coin.price_change_percentage_24h || 0
                );


            return `
                <div class="watch-card">

                    <div class="watch-card-top">

                        <div class="watch-identity">

                            <img
                                src="${coin.image}"
                                alt="${escapeHTML(coin.name)}"
                            >

                            <div>

                                <strong>
                                    ${escapeHTML(coin.name)}
                                </strong>

                                <span>
                                    ${coin.symbol.toUpperCase()}
                                </span>

                            </div>

                        </div>


                        <button
                            class="remove-watch"
                            data-remove-watch="${coin.id}"
                            title="Remove"
                        >
                            ×
                        </button>

                    </div>


                    <div class="watch-price">

                        <strong>
                            ${formatMoney(coin.current_price)}
                        </strong>

                        <span class="${getChangeClass(change)}">
                            ${change >= 0 ? "+" : ""}
                            ${change.toFixed(2)}% today
                        </span>

                    </div>

                </div>
            `;

        }).join("");


    container.innerHTML =
        cards ||
        `
            <div class="watchlist-empty">
                <h3>Loading watchlist...</h3>
            </div>
        `;


    setupRemoveWatchButtons();

}


function setupWatchButtons(){

    document
        .querySelectorAll("[data-watch-id]")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    toggleWatchlist(
                        button.dataset.watchId
                    );

                }
            );

        });

}


function setupRemoveWatchButtons(){

    document
        .querySelectorAll("[data-remove-watch]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    toggleWatchlist(
                        button.dataset.removeWatch
                    );

                }
            );

        });

}


function updateWatchlistFromMarket(coins){

    coins.forEach(coin => {

        if(isInWatchlist(coin.id)){
            coinCache[coin.id] = coin;
        }

    });

    renderWatchlist();

}


function updateDetailWatchButton(){

    const button =
        document.getElementById(
            "detailWatchButton"
        );

    if(!button){
        return;
    }


    const nameElement =
        document.getElementById(
            "detailCoinName"
        );

    if(!nameElement){
        return;
    }


    const name =
        nameElement.textContent;


    const coin =
        allCoins.find(
            item =>
                item.name === name
        );


    if(!coin){
        return;
    }


    if(isInWatchlist(coin.id)){

        button.textContent =
            "★ In Watchlist";

        button.classList.add("active");

    }else{

        button.textContent =
            "☆ Add to Watchlist";

        button.classList.remove("active");

    }

}


/* =========================
   COIN CLICK HANDLERS
========================= */

function setupCoinRowClicks(){

    document
        .querySelectorAll(".coin-row")
        .forEach(row => {

            row.addEventListener(
                "click",
                event => {

                    if(
                        event.target.closest(
                            "[data-watch-id]"
                        )
                    ){
                        return;
                    }

                    const id =
                        row.dataset.coinId;

                    loadCoinDetails(id);

                }
            );

        });

}


function setupMoverClicks(){

    document
        .querySelectorAll(
            ".coin-list-item[data-coin-id]"
        )
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    loadCoinDetails(
                        item.dataset.coinId
                    );

                }
            );

        });

}


/* =========================
   CLOSE DETAILS
========================= */

function setupCloseDetails(){

    const button =
        document.getElementById(
            "closeCoinDetails"
        );

    if(!button){
        return;
    }


    button.addEventListener(
        "click",
        () => {

            const section =
                document.getElementById(
                    "coin-details"
                );

            if(section){
                section.scrollIntoView({
                    behavior:"smooth"
                });
            }

        }
    );

}


/* =========================
   DETAIL WATCH BUTTON
========================= */

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
        () => {

            const nameElement =
                document.getElementById(
                    "detailCoinName"
                );

            if(!nameElement){
                return;
            }


            const coin =
                allCoins.find(
                    item =>
                        item.name ===
                        nameElement.textContent
                );


            if(coin){
                toggleWatchlist(coin.id);
            }

        }
    );

}


/* =========================
   COMPARE
========================= */

function populateCompareSelectors(){

    const selectors = [
        document.getElementById("compareCoin1"),
        document.getElementById("compareCoin2"),
        document.getElementById("compareCoin3")
    ];

    if(!allCoins.length){
        return;
    }


    selectors.forEach(
        (select,index) => {

            if(!select){
                return;
            }

            const currentValue =
                select.value;


            let html =
                index === 2
                    ? `<option value="">None</option>`
                    : `<option value="">Select a coin</option>`;


            html += allCoins.map(coin => {

                return `
                    <option value="${coin.id}">
                        ${coin.name} (${coin.symbol.toUpperCase()})
                    </option>
                `;

            }).join("");


            select.innerHTML = html;


            if(currentValue){
                select.value = currentValue;
            }

        }
    );


    if(compareSelection.length){

        if(selectors[0]){
            selectors[0].value =
                compareSelection[0] || "";
        }

        if(selectors[1]){
            selectors[1].value =
                compareSelection[1] || "";
        }

        if(selectors[2]){
            selectors[2].value =
                compareSelection[2] || "";
        }

    }

}


function saveCompareSelection(){

    localStorage.setItem(
        "cryptoOnlineCompare",
        JSON.stringify(compareSelection)
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
        runComparison
    );


    [
        "compareCoin1",
        "compareCoin2",
        "compareCoin3"
    ].forEach(id => {

        const select =
            document.getElementById(id);

        if(select){

            select.addEventListener(
                "change",
                () => {

                    const ids = [
                        document.getElementById("compareCoin1")?.value,
                        document.getElementById("compareCoin2")?.value,
                        document.getElementById("compareCoin3")?.value
                    ].filter(Boolean);

                    compareSelection = ids;

                    saveCompareSelection();

                }
            );

        }

    });

}


async function runComparison(){

    const ids = [
        document.getElementById("compareCoin1")?.value,
        document.getElementById("compareCoin2")?.value,
        document.getElementById("compareCoin3")?.value
    ].filter(Boolean);


    const status =
        document.getElementById(
            "compareStatus"
        );


    if(ids.length < 2){

        if(status){

            status.textContent =
                "Please select at least two cryptocurrencies.";

            status.className =
                "compare-status error";

        }

        return;
    }


    compareSelection = ids;

    saveCompareSelection();


    if(status){

        status.textContent =
            "Loading comparison data...";

        status.className =
            "compare-status";

    }


    try{

        const coins =
            await Promise.all(
                ids.map(id =>
                    getFullCoinData(id)
                )
            );


        renderComparison(coins);


        if(status){

            status.textContent =
                "Comparison updated successfully.";

            status.className =
                "compare-status success";

        }

    }catch(error){

        console.log(
            "Comparison error:",
            error
        );


        if(status){

            status.textContent =
                "Unable to load comparison data. Please try again.";

            status.className =
                "compare-status error";

        }

    }

}


async function getFullCoinData(id){

    if(
        coinCache[id] &&
        coinCache[id].market_data
    ){
        return coinCache[id];
    }


    const response =
        await fetch(
            `${API}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
        );


    if(!response.ok){
        throw new Error(
            "Unable to load " + id
        );
    }


    const coin =
        await response.json();


    coinCache[id] = coin;

    return coin;

}


function renderComparison(coins){

    const container =
        document.getElementById(
            "compareResults"
        );

    if(!container){
        return;
    }


    const cards =
        coins.map(coin => {

            const market =
                coin.market_data;

            const change =
                Number(
                    market?.price_change_percentage_24h || 0
                );


            return `
                <div class="compare-card">

                    <div class="compare-card-header">

                        <img
                            src="${coin.image.small}"
                            alt="${escapeHTML(coin.name)}"
                        >

                        <div>

                            <strong>
                                ${escapeHTML(coin.name)}
                            </strong>

                            <span>
                                ${coin.symbol.toUpperCase()}
                            </span>

                        </div>

                    </div>


                    <div class="compare-card-price">

                        <strong>
                            ${formatMoney(
                                market?.current_price?.usd
                            )}
                        </strong>

                        <span class="${getChangeClass(change)}">
                            ${change >= 0 ? "+" : ""}
                            ${change.toFixed(2)}% / 24H
                        </span>

                    </div>


                    <div class="compare-metrics">

                        <div class="compare-metric">
                            <span>Market Cap</span>
                            <strong>
                                ${formatMoney(
                                    market?.market_cap?.usd
                                )}
                            </strong>
                        </div>

                        <div class="compare-metric">
                            <span>24H Volume</span>
                            <strong>
                                ${formatMoney(
                                    market?.total_volume?.usd
                                )}
                            </strong>
                        </div>

                        <div class="compare-metric">
                            <span>Market Rank</span>
                            <strong>
                                #${coin.market_cap_rank || "--"}
                            </strong>
                        </div>

                        <div class="compare-metric">
                            <span>Circulating Supply</span>
                            <strong>
                                ${formatSupply(
                                    market?.circulating_supply
                                )}
                            </strong>
                        </div>

                        <div class="compare-metric">
                            <span>All-Time High</span>
                            <strong>
                                ${formatMoney(
                                    market?.ath?.usd
                                )}
                            </strong>
                        </div>

                        <div class="compare-metric">
                            <span>All-Time Low</span>
                            <strong>
                                ${formatMoney(
                                    market?.atl?.usd
                                )}
                            </strong>
                        </div>

                    </div>

                </div>
            `;

        }).join("");


    const table =
        renderComparisonTable(coins);


    container.innerHTML = `

        <div class="compare-cards">
            ${cards}
        </div>

        <div class="compare-chart-panel">

            <div class="compare-chart-header">

                <div>
                    <h3>7-Day Performance</h3>

                    <p>
                        Each asset starts at 100 so relative
                        performance can be compared fairly.
                    </p>
                </div>

            </div>


            <div class="compare-chart-container">

                <canvas id="compareChart"></canvas>

            </div>

        </div>

        ${table}

    `;


    renderCompareChart(coins);

}


function renderComparisonTable(coins){

    const rows = [
        ["Current Price","current_price","price"],
        ["24H Change","price_change_percentage_24h","percent"],
        ["Market Cap","market_cap","money"],
        ["24H Volume","total_volume","money"],
        ["Circulating Supply","circulating_supply","supply"],
        ["Total Supply","total_supply","supply"],
        ["All-Time High","ath","money"],
        ["All-Time Low","atl","money"]
    ];


    let header = `
        <th>Metric</th>
    `;


    coins.forEach(coin => {

        header += `
            <th>
                ${escapeHTML(coin.name)}
            </th>
        `;

    });


    let body = "";


    rows.forEach(row => {

        body += `<tr><td>${row[0]}</td>`;


        coins.forEach(coin => {

            const market =
                coin.market_data;


            let value = "--";


            if(row[1] === "current_price"){

                value =
                    formatMoney(
                        market?.current_price?.usd
                    );

            }else if(
                row[1] ===
                "price_change_percentage_24h"
            ){

                const change =
                    Number(
                        market?.price_change_percentage_24h || 0
                    );

                value =
                    `<span class="${getChangeClass(change)}">
                        ${change >= 0 ? "+" : ""}
                        ${change.toFixed(2)}%
                    </span>`;

            }else if(
                row[1] === "market_cap"
            ){

                value =
                    formatMoney(
                        market?.market_cap?.usd
                    );

            }else if(
                row[1] === "total_volume"
            ){

                value =
                    formatMoney(
                        market?.total_volume?.usd
                    );

            }else if(
                row[1] === "circulating_supply"
            ){

                value =
                    formatSupply(
                        market?.circulating_supply
                    );

            }else if(
                row[1] === "total_supply"
            ){

                value =
                    formatSupply(
                        market?.total_supply
                    );

            }else if(
                row[1] === "ath"
            ){

                value =
                    formatMoney(
                        market?.ath?.usd
                    );

            }else if(
                row[1] === "atl"
            ){

                value =
                    formatMoney(
                        market?.atl?.usd
                    );

            }


            body += `
                <td>${value}</td>
            `;

        });


        body += "</tr>";

    });


    return `

        <div class="compare-table-wrapper">

            <table class="compare-table">

                <thead>
                    <tr>
                        ${header}
                    </tr>
                </thead>

                <tbody>
                    ${body}
                </tbody>

            </table>

        </div>

    `;

}


/* =========================
   COMPARE CHART
========================= */

async function renderCompareChart(coins){

    const canvas =
        document.getElementById(
            "compareChart"
        );

    if(!canvas){
        return;
    }


    try{

        const results =
            await Promise.all(

                coins.map(
                    async coin => {

                        const response =
                            await fetch(
                                `${API}/coins/${coin.id}/market_chart?vs_currency=usd&days=7&interval=daily`
                            );

                        if(!response.ok){
                            throw new Error(
                                "Chart request failed"
                            );
                        }

                        const data =
                            await response.json();

                        return {
                            coin:coin,
                            prices:data.prices
                        };

                    }
                )

            );


        const labels =
            results[0].prices.map(item =>
                new Date(item[0]).toLocaleDateString(
                    [],
                    {
                        month:"short",
                        day:"numeric"
                    }
                )
            );


        const datasets =
            results.map((result,index) => {

                const firstPrice =
                    result.prices[0]?.[1] || 1;


                const normalized =
                    result.prices.map(item =>
                        ((item[1] / firstPrice) * 100) - 100
                    );


                const colors = [
                    "#1769e0",
                    "#7a4ee8",
                    "#20a96b"
                ];


                return {
                    label:
                        result.coin.name,

                    data:
                        normalized,

                    borderColor:
                        colors[index],

                    borderWidth:2,

                    tension:.35,

                    pointRadius:2,

                    fill:false
                };

            });


        if(compareChart){
            compareChart.destroy();
        }


        compareChart =
            new Chart(
                canvas.getContext("2d"),
                {
                    type:"line",

                    data:{
                        labels:labels,
                        datasets:datasets
                    },

                    options:{
                        responsive:true,
                        maintainAspectRatio:false,

                        plugins:{
                            legend:{
                                position:"top",

                                labels:{
                                    font:{
                                        size:10
                                    }
                                }
                            },

                            tooltip:{
                                callbacks:{
                                    label:function(context){

                                        const value =
                                            Number(
                                                context.parsed.y
                                            );

                                        return (
                                            context.dataset.label +
                                            ": " +
                                            (value >= 0 ? "+" : "") +
                                            value.toFixed(2) +
                                            "%"
                                        );

                                    }
                                }
                            }
                        },

                        scales:{
                            x:{
                                grid:{
                                    display:false
                                },

                                ticks:{
                                    font:{
                                        size:9
                                    }
                                }
                            },

                            y:{
                                grid:{
                                    color:"#edf0f4"
                                },

                                ticks:{
                                    callback:function(value){

                                        return (
                                            value >= 0
                                                ? "+"
                                                : ""
                                        ) +
                                        value +
                                        "%";

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
            "Compare chart error:",
            error
        );

    }

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
        () => {

            const query =
                input.value
                    .toLowerCase()
                    .trim();


            if(query.length < 2){

                results.style.display =
                    "none";

                results.innerHTML =
                    "";

                return;

            }


            const matches =
                allCoins
                    .filter(coin =>
                        coin.name
                            .toLowerCase()
                            .includes(query) ||
                        coin.symbol
                            .toLowerCase()
                            .includes(query)
                    )
                    .slice(0,7);


            if(!matches.length){

                results.innerHTML = `
                    <div class="loading">
                        No coin found.
                    </div>
                `;

                results.style.display =
                    "block";

                return;

            }


            results.innerHTML =
                matches.map(coin => {

                    return `
                        <div
                            class="global-search-item"
                            data-search-id="${coin.id}"
                        >

                            <img
                                src="${coin.image}"
                                alt=""
                            >

                            <div>
                                <strong>
                                    ${escapeHTML(coin.name)}
                                </strong>

                                <span>
                                    ${coin.symbol.toUpperCase()}
                                </span>
                            </div>

                        </div>
                    `;

                }).join("");


            results.style.display =
                "block";


            document
                .querySelectorAll(
                    "[data-search-id]"
                )
                .forEach(item => {

                    item.addEventListener(
                        "click",
                        () => {

                            input.value =
                                "";

                            results.style.display =
                                "none";

                            loadCoinDetails(
                                item.dataset.searchId
                            );

                        }
                    );

                });

        }
    );


    document.addEventListener(
        "click",
        event => {

            if(
                !event.target.closest(
                    ".top-search"
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
            "mobileMenu"
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
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );


    document
        .querySelectorAll(".nav-link")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    sidebar.classList.remove(
                        "open"
                    );

                }
            );

        });

}


/* =========================
   REFRESH BUTTON
========================= */

function setupRefresh(){

    const button =
        document.getElementById(
            "refreshButton"
        );

    if(!button){
        return;
    }


    button.addEventListener(
        "click",
        () => {

            loadMarket();
            loadTrending();
            loadBitcoinChart();
            loadFearGreed();
            loadCoinExplorer();

        }
    );

}


/* =========================
   NAVIGATION ACTIVE STATE
========================= */

function setupNavigation(){

    const links =
        document.querySelectorAll(
            ".nav-link"
        );


    links.forEach(link => {

        link.addEventListener(
            "click",
            () => {

                links.forEach(item =>
                    item.classList.remove(
                        "active"
                    )
                );

                link.classList.add(
                    "active"
                );

            }
        );

    });

}


/* =========================
   START APPLICATION
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

setupMobileMenu();

setupRefresh();

setupNavigation();

renderWatchlist();

updateWatchlistCount();


/* =========================
   AUTOMATIC REFRESH
========================= */

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

setInterval(
    loadCoinExplorer,
    300000
);
