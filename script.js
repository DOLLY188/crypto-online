const API = "https://api.coingecko.com/api/v3";

let btcChart = null;
let compareChart = null;
let detailChart = null;

let allCoins = [];
let coinPage = 1;

const coinsPerPage = 25;

let watchlist = JSON.parse(
    localStorage.getItem("cryptoOnlineWatchlist") || "[]"
);


/* =========================
   HELPERS
========================= */

function formatMoney(value){

    if(value === null || value === undefined){
        return "—";
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

    if(value === null || value === undefined){
        return "—";
    }

    return Number(value).toLocaleString(undefined,{
        maximumFractionDigits:2
    });
}


function formatSupply(value){

    if(value === null || value === undefined){
        return "∞ / Unknown";
    }

    if(value >= 1e9){
        return (value / 1e9).toFixed(2) + "B";
    }

    if(value >= 1e6){
        return (value / 1e6).toFixed(2) + "M";
    }

    if(value >= 1000){
        return (value / 1000).toFixed(2) + "K";
    }

    return value.toLocaleString();
}


function formatPercent(value){

    if(value === null || value === undefined){
        return "—";
    }

    return (value >= 0 ? "+" : "") +
        value.toFixed(2) + "%";
}


/* =========================
   GLOBAL MARKET
========================= */

async function loadMarket(){

    try{

        const response = await fetch(
            `${API}/global`
        );

        const data = await response.json();

        const market = data.data;

        const statValues =
            document.querySelectorAll(".stat-value");

        if(statValues[0]){
            statValues[0].textContent =
                "$" +
                (
                    market.total_market_cap.usd / 1e12
                ).toFixed(2) +
                "T";
        }

        if(statValues[1]){
            statValues[1].textContent =
                "$" +
                (
                    market.total_volume.usd / 1e9
                ).toFixed(1) +
                "B";
        }

        if(statValues[2]){
            statValues[2].textContent =
                market.market_cap_percentage.btc.toFixed(1) +
                "%";
        }

        if(statValues[3]){
            statValues[3].textContent =
                market.market_cap_percentage.eth.toFixed(1) +
                "%";
        }

        loadCoins();

    }catch(error){

        console.log(
            "Market data error:",
            error
        );

    }

}


/* =========================
   COINS
========================= */

async function loadCoins(){

    try{

        const response = await fetch(
            `${API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`
        );

        const coins = await response.json();

        allCoins = coins;

        const btc =
            coins.find(
                coin => coin.id === "bitcoin"
            );

        if(btc){

            const chartPrice =
                document.querySelector(
                    ".chart-price strong"
                );

            const chartChange =
                document.querySelector(
                    ".chart-price span"
                );

            const assetName =
                document.querySelector(
                    ".asset-title h3"
                );

            const assetSymbol =
                document.querySelector(
                    ".asset-title span"
                );

            if(chartPrice){
                chartPrice.textContent =
                    formatMoney(btc.current_price);
            }

            if(chartChange){
                chartChange.textContent =
                    formatPercent(
                        btc.price_change_percentage_24h
                    );
            }

            if(
                btc.price_change_percentage_24h >= 0
            ){
                chartChange?.classList.add(
                    "positive"
                );

                chartChange?.classList.remove(
                    "negative"
                );
            }else{

                chartChange?.classList.add(
                    "negative"
                );

                chartChange?.classList.remove(
                    "positive"
                );

            }

            if(assetName){
                assetName.textContent = btc.name;
            }

            if(assetSymbol){
                assetSymbol.textContent =
                    btc.symbol.toUpperCase();
            }

            const intelligence =
                document.getElementById(
                    "btcIntelligence"
                );

            if(intelligence){
                intelligence.textContent =
                    formatMoney(
                        btc.current_price
                    );
            }

        }

        renderMovers(coins);

        updateWatchlistFromMarket(coins);

        setupCompareSelectors();

    }catch(error){

        console.log(
            "Coin loading error:",
            error
        );

    }

}


/* =========================
   MARKET MOVERS
========================= */

function renderMovers(coins){

    const sorted = [...coins]
        .filter(
            coin =>
                coin.price_change_percentage_24h !== null
        )
        .sort(
            (a,b) =>
                b.price_change_percentage_24h -
                a.price_change_percentage_24h
        );

    const gainers = sorted.slice(0,5);

    const losers = [...sorted]
        .reverse()
        .slice(0,5);

    renderMoverList(
        "gainersList",
        gainers,
        true
    );

    renderMoverList(
        "losersList",
        losers,
        false
    );

}


function renderMoverList(
    elementId,
    coins,
    positive
){

    const container =
        document.getElementById(elementId);

    if(!container){
        return;
    }

    container.innerHTML = "";

    coins.forEach(coin => {

        const item =
            document.createElement("div");

        item.className = "mover-item";

        item.innerHTML = `

            <div class="mover-info">

                <img
                    src="${coin.image}"
                    alt="${coin.name}"
                >

                <div class="mover-name">

                    <strong>${coin.name}</strong>

                    <span>
                        ${coin.symbol.toUpperCase()}
                    </span>

                </div>

            </div>

            <div class="mover-change ${
                positive
                ? "positive"
                : "negative"
            }">

                ${formatPercent(
                    coin.price_change_percentage_24h
                )}

            </div>

        `;

        item.addEventListener(
            "click",
            () => loadCoinDetails(coin.id)
        );

        container.appendChild(item);

    });

}


/* =========================
   TRENDING
========================= */

async function loadTrending(){

    try{

        const response = await fetch(
            `${API}/search/trending`
        );

        const data = await response.json();

        const container =
            document.getElementById(
                "trendingList"
            );

        if(!container){
            return;
        }

        container.innerHTML = "";

        data.coins
            .slice(0,5)
            .forEach(item => {

                const coin = item.item;

                const element =
                    document.createElement("div");

                element.className = "mover-item";

                element.innerHTML = `

                    <div class="mover-info">

                        <img
                            src="${coin.small}"
                            alt="${coin.name}"
                        >

                        <div class="mover-name">

                            <strong>
                                ${coin.name}
                            </strong>

                            <span>
                                ${coin.symbol}
                            </span>

                        </div>

                    </div>

                    <div class="mover-change">
                        #${coin.market_cap_rank || "—"}
                    </div>

                `;

                element.addEventListener(
                    "click",
                    () => loadCoinDetails(coin.id)
                );

                container.appendChild(element);

            });

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

        const response = await fetch(
            `${API}/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=hourly`
        );

        const data = await response.json();

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
                item => item[1]
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
                                label:"BTC Price",
                                data:prices,
                                borderWidth:2,
                                pointRadius:0,
                                tension:.35
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
                                    callback:value =>
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

        const item =
            data.data[0];

        const value =
            parseInt(item.value);

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

        const sentimentElements =
            document.querySelectorAll(
                "#marketSentiment"
            );

        const intelligenceElement =
            document.getElementById(
                "sentimentIntelligence"
            );

        if(valueElement){
            valueElement.textContent = value;
        }

        if(labelElement){
            labelElement.textContent =
                classification;
        }

        sentimentElements.forEach(
            element => {
                element.textContent =
                    classification;
            }
        );

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

        const response = await fetch(
            `${API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`
        );

        allCoins = await response.json();

        coinPage = 1;

        renderCoins();

        setupCompareSelectors();

    }catch(error){

        console.log(
            "Explorer error:",
            error
        );

    }

}


function renderCoins(){

    const container =
        document.getElementById(
            "coinTableBody"
        );

    if(!container){
        return;
    }

    const searchInput =
        document.getElementById(
            "coinSearch"
        );

    const searchTerm =
        searchInput
        ? searchInput.value
            .trim()
            .toLowerCase()
        : "";

    let filtered =
        allCoins.filter(
            coin =>
                coin.name
                    .toLowerCase()
                    .includes(searchTerm) ||
                coin.symbol
                    .toLowerCase()
                    .includes(searchTerm)
        );

    const visibleCoins =
        filtered.slice(
            0,
            coinPage * coinsPerPage
        );

    container.innerHTML = "";

    visibleCoins.forEach(
        coin => {

            const row =
                document.createElement("tr");

            row.className = "coin-row";

            const change =
                coin.price_change_percentage_24h;

            row.innerHTML = `

                <td>
                    ${coin.market_cap_rank || "—"}
                </td>

                <td>

                    <div class="coin-identity">

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
                    ${formatMoney(
                        coin.current_price
                    )}
                </td>

                <td class="${
                    change >= 0
                    ? "positive"
                    : "negative"
                }">

                    ${formatPercent(change)}

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

                <td class="coin-action">
                    View
                </td>

            `;

            row.addEventListener(
                "click",
                () => loadCoinDetails(coin.id)
            );

            container.appendChild(row);

        }
    );

    const loadButton =
        document.getElementById(
            "loadMoreCoins"
        );

    if(loadButton){

        loadButton.style.display =
            visibleCoins.length <
            filtered.length
                ? "inline-block"
                : "none";

    }

}


/* =========================
   EXPLORER CONTROLS
========================= */

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
   COMPARE SELECTORS
========================= */

function setupCompareSelectors(){

    const ids = [
        "compareCoin1",
        "compareCoin2",
        "compareCoin3"
    ];

    ids.forEach(
        id => {

            const select =
                document.getElementById(id);

            if(!select){
                return;
            }

            const currentValue =
                select.value;

            select.innerHTML =
                `<option value="">
                    Select a coin
                </option>`;

            allCoins
                .slice(0,100)
                .forEach(coin => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value = coin.id;

                    option.textContent =
                        `${coin.name} (${coin.symbol.toUpperCase()})`;

                    if(
                        coin.id === currentValue
                    ){
                        option.selected = true;
                    }

                    select.appendChild(option);

                });

        }
    );

}


/* =========================
   COMPARE SYSTEM
========================= */

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
        async () => {

            const ids = [
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

            const uniqueIds =
                [...new Set(ids)];

            if(uniqueIds.length < 2){

                alert(
                    "Please select at least two different cryptocurrencies."
                );

                return;
            }

            await loadComparison(
                uniqueIds
            );

        }
    );

}


/* =========================
   LOAD COMPARISON
========================= */

async function loadComparison(ids){

    const button =
        document.getElementById(
            "compareButton"
        );

    if(button){
        button.textContent =
            "Loading...";
        button.disabled = true;
    }

    try{

        const coins = [];

        for(
            const id of ids
        ){

            const response =
                await fetch(
                    `${API}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
                );

            const coin =
                await response.json();

            coins.push(coin);

        }

        displayComparison(
            coins
        );

    }catch(error){

        console.log(
            "Comparison error:",
            error
        );

        alert(
            "Unable to load comparison data right now. Please try again."
        );

    }finally{

        if(button){

            button.textContent =
                "Compare Coins";

            button.disabled = false;

        }

    }

}


/* =========================
   DISPLAY COMPARISON
========================= */

function displayComparison(coins){

    const results =
        document.getElementById(
            "compareResults"
        );

    const empty =
        document.getElementById(
            "compareEmpty"
        );

    const cards =
        document.getElementById(
            "compareCards"
        );

    if(!results || !cards){
        return;
    }

    cards.innerHTML = "";

    coins.forEach(
        coin => {

            const market =
                coin.market_data || {};

            const currentPrice =
                market.current_price?.usd;

            const change =
                market.price_change_percentage_24h;

            const card =
                document.createElement("div");

            card.className =
                "compare-card";

            card.innerHTML = `

                <div class="compare-card-head">

                    <div class="compare-card-identity">

                        <img
                            src="${coin.image?.small || ""}"
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
                        class="compare-remove"
                        data-remove="${coin.id}"
                        title="Remove"
                    >
                        ×
                    </button>

                </div>


                <div class="compare-main-price">
                    ${formatMoney(currentPrice)}
                </div>

                <div class="
                    compare-change
                    ${change >= 0
                        ? "positive"
                        : "negative"}
                ">
                    ${formatPercent(change)}
                    24H
                </div>


                <div class="compare-card-stats">

                    <div class="compare-stat">
                        <span>Market Cap</span>
                        <strong>
                            ${formatMoney(
                                market.market_cap?.usd
                            )}
                        </strong>
                    </div>

                    <div class="compare-stat">
                        <span>24H Volume</span>
                        <strong>
                            ${formatMoney(
                                market.total_volume?.usd
                            )}
                        </strong>
                    </div>

                    <div class="compare-stat">
                        <span>Market Rank</span>
                        <strong>
                            #${coin.market_cap_rank || "—"}
                        </strong>
                    </div>

                    <div class="compare-stat">
                        <span>Circulating</span>
                        <strong>
                            ${formatSupply(
                                market.circulating_supply
                            )}
                        </strong>
                    </div>

                    <div class="compare-stat">
                        <span>All-Time High</span>
                        <strong>
                            ${formatMoney(
                                market.ath?.usd
                            )}
                        </strong>
                    </div>

                    <div class="compare-stat">
                        <span>All-Time Low</span>
                        <strong>
                            ${formatMoney(
                                market.atl?.usd
                            )}
                        </strong>
                    </div>

                </div>

            `;

            cards.appendChild(card);

        }
    );


    results.classList.remove(
        "hidden"
    );

    if(empty){
        empty.classList.add(
            "hidden"
        );
    }


    setupCompareRemoveButtons(
        coins
    );

    renderComparisonTable(
        coins
    );

    loadComparisonCharts(
        coins
    );

}


/* =========================
   REMOVE FROM COMPARISON
========================= */

function setupCompareRemoveButtons(
    coins
){

    const buttons =
        document.querySelectorAll(
            "[data-remove]"
        );

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.remove;

                    const index =
                        coins.findIndex(
                            coin =>
                                coin.id === id
                        );

                    if(index !== -1){

                        coins.splice(
                            index,
                            1
                        );

                    }

                    if(coins.length < 2){

                        document
                            .getElementById(
                                "compareResults"
                            )
                            ?.classList.add(
                                "hidden"
                            );

                        document
                            .getElementById(
                                "compareEmpty"
                            )
                            ?.classList.remove(
                                "hidden"
                            );

                        return;

                    }

                    displayComparison(
                        coins
                    );

                    const select =
                        document.getElementById(
                            `compareCoin${
                                index + 1
                            }`
                        );

                    if(select){
                        select.value = "";
                    }

                }
            );

        }
    );

}


/* =========================
   COMPARISON TABLE
========================= */

function renderComparisonTable(
    coins
){

    const headers = [
        document.getElementById(
            "compareHeader1"
        ),

        document.getElementById(
            "compareHeader2"
        ),

        document.getElementById(
            "compareHeader3"
        )
    ];

    headers.forEach(
        header => {

            if(header){
                header.textContent = "—";
            }

        }
    );


    coins.forEach(
        (coin,index) => {

            if(headers[index]){

                headers[index].textContent =
                    coin.name;

            }

        }
    );


    const tbody =
        document.getElementById(
            "comparisonTableBody"
        );

    if(!tbody){
        return;
    }

    const rows = [
        {
            name:"Price",
            value:coin =>
                formatMoney(
                    coin.market_data
                        ?.current_price
                        ?.usd
                )
        },

        {
            name:"24H Change",
            value:coin =>
                formatPercent(
                    coin.market_data
                        ?.price_change_percentage_24h
                )
        },

        {
            name:"Market Cap",
            value:coin =>
                formatMoney(
                    coin.market_data
                        ?.market_cap
                        ?.usd
                )
        },

        {
            name:"24H Volume",
            value:coin =>
                formatMoney(
                    coin.market_data
                        ?.total_volume
                        ?.usd
                )
        },

        {
            name:"Market Rank",
            value:coin =>
                "#" +
                (
                    coin.market_cap_rank ||
                    "—"
                )
        },

        {
            name:"Circulating Supply",
            value:coin =>
                formatSupply(
                    coin.market_data
                        ?.circulating_supply
                )
        },

        {
            name:"Total Supply",
            value:coin =>
                formatSupply(
                    coin.market_data
                        ?.total_supply
                )
        },

        {
            name:"All-Time High",
            value:coin =>
                formatMoney(
                    coin.market_data
                        ?.ath
                        ?.usd
                )
        },

        {
            name:"All-Time Low",
            value:coin =>
                formatMoney(
                    coin.market_data
                        ?.atl
                        ?.usd
                )
        }
    ];


    tbody.innerHTML = "";

    rows.forEach(
        row => {

            const tr =
                document.createElement("tr");

            let html =
                `<td>${row.name}</td>`;

            coins.forEach(
                coin => {

                    html +=
                        `<td>${row.value(coin)}</td>`;

                }
            );

            while(
                html.split("<td>").length - 1
                < 4
            ){

                html += "<td>—</td>";

            }

            tr.innerHTML = html;

            tbody.appendChild(tr);

        }
    );

}


/* =========================
   COMPARISON CHART
========================= */

async function loadComparisonCharts(
    coins
){

    try{

        const datasets = [];

        const labelsSet = new Set();

        for(
            const coin
            of coins
        ){

            const response =
                await fetch(
                    `${API}/coins/${coin.id}/market_chart?vs_currency=usd&days=7&interval=daily`
                );

            const data =
                await response.json();

            const prices =
                data.prices;

            if(!prices || !prices.length){
                continue;
            }

            const firstPrice =
                prices[0][1];

            const performance =
                prices.map(
                    item =>
                        (
                            (
                                item[1] /
                                firstPrice
                            ) -
                            1
                        ) *
                        100
                );

            const labels =
                prices.map(
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

            labels.forEach(
                label =>
                    labelsSet.add(label)
            );

            datasets.push({

                label:
                    coin.name +
                    " (" +
                    coin.symbol.toUpperCase() +
                    ")",

                data:performance,

                borderWidth:2,

                pointRadius:3,

                tension:.35,

                fill:false

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
                        labels:[
                            ...labelsSet
                        ],

                        datasets
                    },

                    options:{
                        responsive:true,
                        maintainAspectRatio:false,

                        interaction:{
                            mode:"index",
                            intersect:false
                        },

                        plugins:{
                            legend:{
                                display:true
                            },

                            tooltip:{
                                callbacks:{
                                    label:
                                        context =>
                                            context.dataset
                                                .label +
                                            ": " +
                                            context.parsed.y
                                                .toFixed(2) +
                                            "%"
                                }
                            }
                        },

                        scales:{
                            y:{
                                ticks:{
                                    callback:
                                        value =>
                                            value +
                                            "%"
                                }
                            }
                        }

                    }

                }
            );

    }catch(error){

        console.log(
            "Comparison chart error:",
            error
        );

    }

}


/* =========================
   COIN DETAILS
========================= */

async function loadCoinDetails(id){

    const details =
        document.getElementById(
            "coin-details"
        );

    if(!details){
        return;
    }

    details.classList.remove(
        "hidden"
    );

    details.scrollIntoView({
        behavior:"smooth"
    });

    try{

        const response =
            await fetch(
                `${API}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
            );

        const coin =
            await response.json();

        displayCoinDetails(
            coin
        );

        loadCoinDetailChart(
            id
        );

        window.currentDetailCoin =
            coin;

        updateDetailWatchButton();

    }catch(error){

        console.log(
            "Coin details error:",
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

    const price =
        document.getElementById(
            "detailCoinPrice"
        );

    const change =
        document.getElementById(
            "detailCoinChange"
        );

    if(image){
        image.src =
            coin.image?.large ||
            coin.image?.small ||
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
            coin.market_cap_rank ||
            "—";
    }

    if(price){
        price.textContent =
            formatMoney(
                market.current_price?.usd
            );
    }

    if(change){

        change.textContent =
            formatPercent(
                market.price_change_percentage_24h
            );

        change.className =
            market.price_change_percentage_24h >= 0
            ? "positive"
            : "negative";

    }


    const elements = {

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


    Object.entries(
        elements
    ).forEach(
        ([id,value]) => {

            const element =
                document.getElementById(id);

            if(element){
                element.textContent =
                    value;
            }

        }
    );


    const description =
        document.getElementById(
            "detailDescription"
        );

    if(description){

        const clean =
            coin.description?.en
                ?.replace(
                    /<[^>]*>/g,
                    ""
                );

        description.textContent =
            clean ||
            "No description available.";

    }

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
                item => item[1]
            );

        if(detailChart){
            detailChart.destroy();
        }

        detailChart =
            new Chart(
                canvas,
                {
                    type:"line",

                    data:{
                        labels,

                        datasets:[
                            {
                                label:"Price",
                                data:prices,
                                borderWidth:2,
                                pointRadius:3,
                                tension:.35
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


function setupCloseDetails(){

    const button =
        document.getElementById(
            "closeCoinDetails"
        );

    if(button){

        button.addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "coin-details"
                    )
                    ?.classList.add(
                        "hidden"
                    );

            }
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
        JSON.stringify(
            watchlist
        )
    );

}


function toggleWatchlist(id){

    if(isInWatchlist(id)){

        watchlist =
            watchlist.filter(
                coinId =>
                    coinId !== id
            );

    }else{

        watchlist.push(id);

    }

    saveWatchlist();

    renderWatchlist();

    updateWatchlistCount();

    updateDetailWatchButton();

}


function renderWatchlist(){

    const container =
        document.getElementById(
            "watchlistContainer"
        );

    if(!container){
        return;
    }

    if(!watchlist.length){

        container.innerHTML = `

            <div class="empty-watchlist">

                <div class="empty-icon">
                    ★
                </div>

                <h3>
                    Your watchlist is empty
                </h3>

                <p>
                    Add cryptocurrencies from the
                    Coin Explorer or Coin Details page.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = "";

    watchlist.forEach(
        id => {

            const coin =
                allCoins.find(
                    item =>
                        item.id === id
                );

            if(!coin){
                return;
            }

            const card =
                document.createElement("div");

            card.className =
                "watch-card";

            const change =
                coin.price_change_percentage_24h;

            card.innerHTML = `

                <div class="watch-card-header">

                    <div class="watch-identity">

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
                        data-watch-remove="${coin.id}"
                    >
                        ×
                    </button>

                </div>


                <div class="watch-price">

                    <strong>
                        ${formatMoney(
                            coin.current_price
                        )}
                    </strong>

                    <span class="${
                        change >= 0
                        ? "positive"
                        : "negative"
                    }">

                        ${formatPercent(change)}

                    </span>

                </div>

            `;

            card.addEventListener(
                "click",
                event => {

                    if(
                        event.target.closest(
                            ".remove-watch"
                        )
                    ){
                        return;
                    }

                    loadCoinDetails(
                        coin.id
                    );

                }
            );

            container.appendChild(card);

        }
    );

    setupRemoveWatchButtons();

}


function setupRemoveWatchButtons(){

    document
        .querySelectorAll(
            "[data-watch-remove]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        toggleWatchlist(
                            button.dataset.watchRemove
                        );

                    }
                );

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
            `(${watchlist.length})`;
    }

    if(intelligence){
        intelligence.textContent =
            watchlist.length;
    }

}


function updateDetailWatchButton(){

    const button =
        document.getElementById(
            "detailWatchButton"
        );

    const coin =
        window.currentDetailCoin;

    if(!button || !coin){
        return;
    }

    if(
        isInWatchlist(
            coin.id
        )
    ){

        button.textContent =
            "★ In Watchlist";

        button.classList.add(
            "active"
        );

    }else{

        button.textContent =
            "☆ Add to Watchlist";

        button.classList.remove(
            "active"
        );

    }

}


function setupDetailWatchButton(){

    const button =
        document.getElementById(
            "detailWatchButton"
        );

    if(button){

        button.addEventListener(
            "click",
            () => {

                const coin =
                    window.currentDetailCoin;

                if(coin){

                    toggleWatchlist(
                        coin.id
                    );

                }

            }
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

    if(!input){
        return;
    }

    input.addEventListener(
        "keydown",
        event => {

            if(
                event.key !== "Enter"
            ){
                return;
            }

            const term =
                input.value
                    .trim()
                    .toLowerCase();

            if(!term){
                return;
            }

            const coin =
                allCoins.find(
                    item =>
                        item.name
                            .toLowerCase()
                            .includes(term) ||
                        item.symbol
                            .toLowerCase()
                            .includes(term)
                );

            if(coin){

                loadCoinDetails(
                    coin.id
                );

            }

        }
    );

}


/* =========================
   STARTUP
========================= */

loadMarket();

loadTrending();

loadBitcoinChart();

loadFearGreed();

loadCoinExplorer();

setupCoinExplorer();

setupCompare();

setupGlobalSearch();

setupCloseDetails();

setupDetailWatchButton();

renderWatchlist();

updateWatchlistCount();


/* =========================
   AUTO REFRESH
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
