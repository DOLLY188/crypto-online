const API="https://api.coingecko.com/api/v3";

let btcChart=null;
let coinDetailChart=null;

let allCoins=[];
let coinPage=1;

let selectedCoinId=null;

const coinsPerPage=25;

let watchlist=
    JSON.parse(
        localStorage.getItem(
            "cryptoOnlineWatchlist"
        ) || "[]"
    );


/* =========================
   GLOBAL MARKET
========================= */

async function loadMarket(){

    try{

        const r=await fetch(`${API}/global`);
        const d=await r.json();

        const m=d.data;

        const stats=
            document.querySelectorAll(".stat-value");

        stats[0].textContent=
            "$"+(m.total_market_cap.usd/1e12).toFixed(2)+"T";

        stats[1].textContent=
            "$"+(m.total_volume.usd/1e9).toFixed(1)+"B";

        stats[2].textContent=
            m.market_cap_percentage.btc.toFixed(1)+"%";

        stats[3].textContent=
            m.market_cap_percentage.eth.toFixed(1)+"%";

        loadCoins();

    }catch(e){

        console.log(
            "Market data error:",
            e
        );

    }

}


/* =========================
   MARKET COINS
========================= */

async function loadCoins(){

    try{

        const r=await fetch(
            `${API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`
        );

        const coins=await r.json();

        if(!Array.isArray(coins)){
            return;
        }

        const btc=coins[0];

        document.querySelector(
            ".chart-price strong"
        ).textContent=
            "$"+btc.current_price.toLocaleString();

        const btcChange=
            btc.price_change_percentage_24h;

        const chartChange=
            document.querySelector(
                ".chart-price span"
            );

        chartChange.textContent=
            (btcChange>=0?"+":"")+
            btcChange.toFixed(2)+"%";

        chartChange.className=
            btcChange>=0
            ? "positive"
            : "negative";

        document.querySelector(
            ".asset-title h3"
        ).textContent=
            btc.name;

        document.querySelector(
            ".asset-title span"
        ).textContent=
            btc.symbol.toUpperCase();

        document.querySelector(
            "#btcIntelligence"
        ).textContent=
            "$"+btc.current_price.toLocaleString();

        const valid=
            coins.filter(
                coin=>
                coin.price_change_percentage_24h!==null
            );

        const gainers=
            [...valid]
            .sort(
                (a,b)=>
                b.price_change_percentage_24h-
                a.price_change_percentage_24h
            )
            .slice(0,3);

        const losers=
            [...valid]
            .sort(
                (a,b)=>
                a.price_change_percentage_24h-
                b.price_change_percentage_24h
            )
            .slice(0,3);

        renderMovers(
            "gainersList",
            gainers
        );

        renderMovers(
            "losersList",
            losers
        );

        if(
            document
            .getElementById(
                "watchlist"
            )
        ){
            updateWatchlistFromMarket(
                coins
            );
        }

    }catch(e){

        console.log(
            "Coin data error:",
            e
        );

    }

}


/* =========================
   MARKET MOVERS
========================= */

function renderMovers(id,coins){

    const container=
        document.getElementById(id);

    if(!container){
        return;
    }

    container.innerHTML=
        coins.map(coin=>{

            const change=
                coin.price_change_percentage_24h;

            return `

                <div
                    class="asset-row"
                    data-coin-id="${coin.id}"
                >

                    <img
                        src="${coin.image}"
                        alt="${coin.name}"
                    >

                    <div class="asset-info">

                        <strong>
                            ${coin.name}
                        </strong>

                        <span>
                            ${coin.symbol.toUpperCase()}
                        </span>

                    </div>

                    <div class="asset-value">

                        <strong>
                            $${coin.current_price.toLocaleString()}
                        </strong>

                        <span class="${change>=0?"positive":"negative"}">
                            ${change>=0?"+":""}${change.toFixed(2)}%
                        </span>

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

        const r=await fetch(
            `${API}/search/trending`
        );

        const d=await r.json();

        const trending=
            d.coins
            .slice(0,3)
            .map(x=>x.item);

        const container=
            document.getElementById(
                "trendingList"
            );

        if(!container){
            return;
        }

        container.innerHTML=
            trending.map(coin=>{

                return `

                    <div
                        class="asset-row"
                        data-coin-id="${coin.id}"
                    >

                        <img
                            src="${coin.small}"
                            alt="${coin.name}"
                        >

                        <div class="asset-info">

                            <strong>
                                ${coin.name}
                            </strong>

                            <span>
                                ${coin.symbol.toUpperCase()}
                            </span>

                        </div>

                        <div class="asset-value">

                            <strong>
                                #${coin.market_cap_rank || "--"}
                            </strong>

                            <span>
                                Trending
                            </span>

                        </div>

                    </div>

                `;

            }).join("");

        setupMoverClicks();

    }catch(e){

        console.log(
            "Trending error:",
            e
        );

    }

}


/* =========================
   BITCOIN CHART
========================= */

async function loadBitcoinChart(){

    try{

        const r=await fetch(
            `${API}/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=hourly`
        );

        const data=await r.json();

        const prices=data.prices;

        const labels=
            prices.map(p=>{

                const date=
                    new Date(p[0]);

                return date.toLocaleDateString(
                    [],
                    {
                        month:"short",
                        day:"numeric"
                    }
                );

            });

        const values=
            prices.map(p=>p[1]);

        const canvas=
            document.getElementById(
                "btcChart"
            );

        if(!canvas){
            return;
        }

        const ctx=
            canvas.getContext("2d");

        if(btcChart){
            btcChart.destroy();
        }

        btcChart=
            new Chart(
                ctx,
                {

                    type:"line",

                    data:{

                        labels:labels,

                        datasets:[{

                            label:"Bitcoin Price",

                            data:values,

                            borderWidth:2,

                            pointRadius:0,

                            tension:.35,

                            fill:true

                        }]

                    },

                    options:{

                        responsive:true,

                        maintainAspectRatio:false,

                        interaction:{
                            intersect:false,
                            mode:"index"
                        },

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

                                    callback:function(value){

                                        return "$"+
                                            Number(value)
                                            .toLocaleString();

                                    }

                                }

                            }

                        }

                    }

                }
            );

    }catch(e){

        console.log(
            "Bitcoin chart error:",
            e
        );

    }

}


/* =========================
   FEAR & GREED
========================= */

async function loadFearGreed(){

    try{

        const r=await fetch(
            "https://api.alternative.me/fng/?limit=1"
        );

        const d=await r.json();

        const data=d.data[0];

        const value=
            parseInt(data.value);

        const classification=
            data.value_classification;

        const valueElement=
            document.getElementById(
                "fearGreedValue"
            );

        const labelElement=
            document.getElementById(
                "fearGreedLabel"
            );

        const sentimentElement=
            document.getElementById(
                "marketSentiment"
            );

        const intelligenceElement=
            document.getElementById(
                "sentimentIntelligence"
            );

        if(valueElement){
            valueElement.textContent=value;
        }

        if(labelElement){
            labelElement.textContent=
                classification;
        }

        if(sentimentElement){
            sentimentElement.textContent=
                classification;
        }

        if(intelligenceElement){
            intelligenceElement.textContent=
                classification+
                " ("+
                value+
                ")";
        }

    }catch(e){

        console.log(
            "Fear & Greed error:",
            e
        );

    }

}


/* =========================
   COIN EXPLORER
========================= */

async function loadCoinExplorer(){

    try{

        const r=await fetch(
            `${API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`
        );

        const data=await r.json();

        if(!Array.isArray(data)){
            return;
        }

        allCoins=data;

        coinPage=1;

        renderCoins();

        updateWatchlistFromMarket(
            data
        );

    }catch(e){

        console.log(
            "Coin Explorer error:",
            e
        );

    }

}


function renderCoins(){

    const table=
        document.getElementById(
            "coinTableBody"
        );

    if(!table){
        return;
    }

    const searchInput=
        document.getElementById(
            "coinSearch"
        );

    const searchTerm=
        searchInput
        ? searchInput.value
            .toLowerCase()
            .trim()
        : "";

    const filtered=
        allCoins.filter(coin=>{

            return (

                coin.name
                .toLowerCase()
                .includes(searchTerm)

                ||

                coin.symbol
                .toLowerCase()
                .includes(searchTerm)

            );

        });

    const visible=
        filtered.slice(
            0,
            coinPage*coinsPerPage
        );

    if(visible.length===0){

        table.innerHTML=`

            <tr>

                <td
                    colspan="7"
                    class="table-loading"
                >
                    No cryptocurrency found.
                </td>

            </tr>

        `;

        return;

    }

    table.innerHTML=
        visible.map(
            (coin,index)=>{

                const change=
                    coin.price_change_percentage_24h;

                const changeClass=
                    change>=0
                    ? "positive"
                    : "negative";

                const changeText=
                    change===null
                    ? "--"
                    :
                    (change>=0?"+":"")+
                    change.toFixed(2)+
                    "%";

                const isWatched=
                    isInWatchlist(
                        coin.id
                    );

                return `

                    <tr
                        data-coin-id="${coin.id}"
                    >

                        <td class="coin-rank">

                            ${
                                coin.market_cap_rank
                                || index+1
                            }

                        </td>


                        <td>

                            <div class="table-coin">

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


                        <td class="coin-price">

                            $${coin.current_price.toLocaleString()}

                        </td>


                        <td class="${changeClass}">

                            ${changeText}

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


                        <td class="watch-cell">

                            <button
                                class="watch-button ${isWatched?"active":""}"
                                data-watch-id="${coin.id}"
                                title="${isWatched?"Remove from watchlist":"Add to watchlist"}"
                            >
                                ${isWatched?"★":"☆"}
                            </button>

                        </td>

                    </tr>

                `;

            }
        ).join("");

    setupCoinRowClicks();

    setupWatchButtons();

}


/* =========================
   COIN FORMATTING
========================= */

function formatMoney(value){

    if(!value){
        return "--";
    }

    if(value>=1e12){

        return "$"+
            (value/1e12).toFixed(2)+
            "T";

    }

    if(value>=1e9){

        return "$"+
            (value/1e9).toFixed(2)+
            "B";

    }

    if(value>=1e6){

        return "$"+
            (value/1e6).toFixed(2)+
            "M";

    }

    if(value>=1e3){

        return "$"+
            (value/1e3).toFixed(2)+
            "K";

    }

    return "$"+
        value.toLocaleString();

}


/* =========================
   COIN SEARCH
========================= */

function setupCoinExplorer(){

    const searchInput=
        document.getElementById(
            "coinSearch"
        );

    const loadMoreButton=
        document.getElementById(
            "loadMoreCoins"
        );

    if(searchInput){

        searchInput.addEventListener(
            "input",
            ()=>{

                coinPage=1;

                renderCoins();

            }
        );

    }

    if(loadMoreButton){

        loadMoreButton.addEventListener(
            "click",
            ()=>{

                coinPage++;

                renderCoins();

            }
        );

    }

}


/* =========================
   COIN CLICK EVENTS
========================= */

function setupCoinRowClicks(){

    const rows=
        document.querySelectorAll(
            "#coinTableBody tr[data-coin-id]"
        );

    rows.forEach(row=>{

        row.addEventListener(
            "click",
            event=>{

                if(
                    event.target.closest(
                        ".watch-button"
                    )
                ){
                    return;
                }

                const id=
                    row.dataset.coinId;

                loadCoinDetails(id);

            }
        );

    });

}


function setupMoverClicks(){

    const rows=
        document.querySelectorAll(
            ".asset-row[data-coin-id]"
        );

    rows.forEach(row=>{

        if(row.dataset.listener==="true"){
            return;
        }

        row.dataset.listener="true";

        row.addEventListener(
            "click",
            ()=>{

                loadCoinDetails(
                    row.dataset.coinId
                );

            }
        );

    });

}


/* =========================
   COIN DETAILS
========================= */

async function loadCoinDetails(id){

    try{

        selectedCoinId=id;

        const section=
            document.getElementById(
                "coin-details"
            );

        section.classList.add(
            "visible"
        );

        section.scrollIntoView({
            behavior:"smooth"
        });

        const r=await fetch(
            `${API}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
        );

        const coin=await r.json();

        displayCoinDetails(
            coin
        );

        loadCoinDetailChart(
            id
        );

        updateDetailWatchButton();

    }catch(e){

        console.log(
            "Coin details error:",
            e
        );

    }

}


/* =========================
   DISPLAY COIN DETAILS
========================= */

function displayCoinDetails(coin){

    document.getElementById(
        "detailCoinImage"
    ).src=
        coin.image.large;

    document.getElementById(
        "detailCoinImage"
    ).alt=
        coin.name;

    document.getElementById(
        "detailCoinName"
    ).textContent=
        coin.name;

    document.getElementById(
        "detailCoinSymbol"
    ).textContent=
        coin.symbol.toUpperCase();

    document.getElementById(
        "detailCoinRank"
    ).textContent=
        "Market Cap Rank #"+
        (coin.market_cap_rank || "--");

    const price=
        coin.market_data
        .current_price.usd;

    const change=
        coin.market_data
        .price_change_percentage_24h;

    document.getElementById(
        "detailCoinPrice"
    ).textContent=
        "$"+price.toLocaleString();

    const changeElement=
        document.getElementById(
            "detailCoinChange"
        );

    changeElement.textContent=
        (change>=0?"+":"")+
        change.toFixed(2)+
        "% (24H)";

    changeElement.className=
        change>=0
        ? "positive"
        : "negative";

    document.getElementById(
        "detailMarketCap"
    ).textContent=
        formatMoney(
            coin.market_data
            .market_cap.usd
        );

    document.getElementById(
        "detailVolume"
    ).textContent=
        formatMoney(
            coin.market_data
            .total_volume.usd
        );

    document.getElementById(
        "detailCirculating"
    ).textContent=
        formatSupply(
            coin.market_data
            .circulating_supply
        );

    document.getElementById(
        "detailTotalSupply"
    ).textContent=
        formatSupply(
            coin.market_data
            .total_supply
        );

    document.getElementById(
        "detailAth"
    ).textContent=
        "$"+
        coin.market_data
        .ath.usd
        .toLocaleString();

    document.getElementById(
        "detailAtl"
    ).textContent=
        "$"+
        coin.market_data
        .atl.usd
        .toLocaleString();

    const description=
        coin.description?.en || "";

    const cleanDescription=
        description
        .replace(
            /<[^>]*>/g,
            ""
        )
        .trim();

    document.getElementById(
        "detailDescription"
    ).textContent=
        cleanDescription ||
        "No description is available for this asset.";

}


/* =========================
   SUPPLY FORMATTING
========================= */

function formatSupply(value){

    if(
        value===null ||
        value===undefined
    ){
        return "--";
    }

    return value.toLocaleString(
        undefined,
        {
            maximumFractionDigits:2
        }
    );

}


/* =========================
   COIN DETAIL CHART
========================= */

async function loadCoinDetailChart(id){

    try{

        const r=await fetch(
            `${API}/coins/${id}/market_chart?vs_currency=usd&days=7&interval=daily`
        );

        const data=await r.json();

        const prices=
            data.prices;

        const labels=
            prices.map(item=>{

                return new Date(
                    item[0]
                ).toLocaleDateString(
                    [],
                    {
                        month:"short",
                        day:"numeric"
                    }
                );

            });

        const values=
            prices.map(item=>item[1]);

        const canvas=
            document.getElementById(
                "coinDetailChart"
            );

        if(!canvas){
            return;
        }

        const ctx=
            canvas.getContext("2d");

        if(coinDetailChart){

            coinDetailChart.destroy();

        }

        coinDetailChart=
            new Chart(
                ctx,
                {

                    type:"line",

                    data:{

                        labels:labels,

                        datasets:[{

                            label:"Price",

                            data:values,

                            borderWidth:2,

                            pointRadius:3,

                            tension:.3,

                            fill:true

                        }]

                    },

                    options:{

                        responsive:true,

                        maintainAspectRatio:false,

                        interaction:{

                            intersect:false,

                            mode:"index"

                        },

                        plugins:{

                            legend:{
                                display:false
                            }

                        },

                        scales:{

                            y:{

                                ticks:{

                                    callback:function(value){

                                        return "$"+
                                            Number(value)
                                            .toLocaleString();

                                    }

                                }

                            }

                        }

                    }

                }
            );

    }catch(e){

        console.log(
            "Coin detail chart error:",
            e
        );

    }

}


/* =========================
   WATCHLIST STORAGE
========================= */

function saveWatchlist(){

    localStorage.setItem(
        "cryptoOnlineWatchlist",
        JSON.stringify(
            watchlist
        )
    );

}


/* =========================
   WATCHLIST CHECK
========================= */

function isInWatchlist(id){

    return watchlist.includes(id);

}


/* =========================
   TOGGLE WATCHLIST
========================= */

function toggleWatchlist(id){

    if(
        isInWatchlist(id)
    ){

        watchlist=
            watchlist.filter(
                item=>item!==id
            );

    }else{

        watchlist.push(id);

    }

    saveWatchlist();

    renderCoins();

    renderWatchlist();

    updateDetailWatchButton();

    updateWatchlistCount();

}


/* =========================
   WATCH BUTTONS
========================= */

function setupWatchButtons(){

    const buttons=
        document.querySelectorAll(
            "[data-watch-id]"
        );

    buttons.forEach(button=>{

        button.addEventListener(
            "click",
            event=>{

                event.stopPropagation();

                const id=
                    button.dataset.watchId;

                toggleWatchlist(id);

            }
        );

    });

}


/* =========================
   WATCHLIST RENDER
========================= */

function renderWatchlist(){

    const container=
        document.getElementById(
            "watchlistContainer"
        );

    if(!container){
        return;
    }

    updateWatchlistCount();

    if(
        watchlist.length===0
    ){

        container.innerHTML=`

            <div class="panel empty-state">

                <div class="empty-icon">
                    ☆
                </div>

                <h3>
                    Your watchlist is empty
                </h3>

                <p>
                    Click the star beside any cryptocurrency
                    to add it to your personal watchlist.
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

    const coins=
        watchlist
        .map(id=>
            allCoins.find(
                coin=>coin.id===id
            )
        )
        .filter(Boolean);

    if(coins.length===0){

        container.innerHTML=`

            <div class="panel empty-state">

                <div class="empty-icon">
                    ◌
                </div>

                <h3>
                    Updating watchlist
                </h3>

                <p>
                    Live market information is loading.
                </p>

            </div>

        `;

        return;

    }

    container.innerHTML=
        coins.map(coin=>{

            const change=
                coin.price_change_percentage_24h;

            return `

                <div class="watch-card">

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
                            data-remove-watch="${coin.id}"
                            title="Remove from watchlist"
                        >
                            ×
                        </button>

                    </div>


                    <div class="watch-price">

                        <strong>
                            $${coin.current_price.toLocaleString()}
                        </strong>

                        <span class="${change>=0?"positive":"negative"}">

                            ${change>=0?"+":""}
                            ${change.toFixed(2)}%

                            24H

                        </span>

                    </div>


                    <div class="watch-meta">

                        <div>

                            <span>
                                Market Cap
                            </span>

                            <strong>
                                ${formatMoney(
                                    coin.market_cap
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Rank
                            </span>

                            <strong>
                                #${coin.market_cap_rank || "--"}
                            </strong>

                        </div>

                    </div>

                </div>

            `;

        }).join("");

    setupRemoveWatchButtons();

}


function setupRemoveWatchButtons(){

    const buttons=
        document.querySelectorAll(
            "[data-remove-watch]"
        );

    buttons.forEach(button=>{

        button.addEventListener(
            "click",
            event=>{

                event.stopPropagation();

                const id=
                    button.dataset.removeWatch;

                toggleWatchlist(id);

            }
        );

    });

}


/* =========================
   UPDATE WATCHLIST
========================= */

function updateWatchlistFromMarket(
    coins
){

    if(
        !Array.isArray(coins)
    ){
        return;
    }

    renderWatchlist();

}


/* =========================
   WATCHLIST COUNT
========================= */

function updateWatchlistCount(){

    const count=
        document.getElementById(
            "watchlistCount"
        );

    const intelligence=
        document.getElementById(
            "watchlistIntelligence"
        );

    if(count){

        count.textContent=
            watchlist.length;

    }

    if(intelligence){

        intelligence.textContent=
            watchlist.length+
            (
                watchlist.length===1
                ? " asset"
                : " assets"
            );

    }

}


/* =========================
   DETAIL WATCH BUTTON
========================= */

function updateDetailWatchButton(){

    const button=
        document.getElementById(
            "detailWatchButton"
        );

    if(!button){
        return;
    }

    if(
        selectedCoinId &&
        isInWatchlist(
            selectedCoinId
        )
    ){

        button.textContent=
            "★ In Watchlist";

        button.classList.add(
            "active"
        );

    }else{

        button.textContent=
            "☆ Add to Watchlist";

        button.classList.remove(
            "active"
        );

    }

}


/* =========================
   DETAIL WATCH BUTTON SETUP
========================= */

function setupDetailWatchButton(){

    const button=
        document.getElementById(
            "detailWatchButton"
        );

    if(!button){
        return;
    }

    button.addEventListener(
        "click",
        ()=>{

            if(!selectedCoinId){
                return;
            }

            toggleWatchlist(
                selectedCoinId
            );

        }
    );

}


/* =========================
   GLOBAL SEARCH
========================= */

function setupGlobalSearch(){

    const input=
        document.getElementById(
            "globalSearch"
        );

    if(!input){
        return;
    }

    input.addEventListener(
        "keydown",
        event=>{

            if(
                event.key!=="Enter"
            ){
                return;
            }

            const value=
                input.value
                .trim()
                .toLowerCase();

            if(!value){
                return;
            }

            const coinSearch=
                document.getElementById(
                    "coinSearch"
                );

            if(coinSearch){

                coinSearch.value=value;

                coinPage=1;

                renderCoins();

                document
                    .getElementById(
                        "coin-explorer"
                    )
                    .scrollIntoView({
                        behavior:"smooth"
                    });

            }

        }
    );

}


/* =========================
   CLOSE DETAILS
========================= */

function setupCloseDetails(){

    const button=
        document.getElementById(
            "closeCoinDetails"
        );

    if(!button){
        return;
    }

    button.addEventListener(
        "click",
        ()=>{

            document
                .getElementById(
                    "coin-details"
                )
                .classList.remove(
                    "visible"
                );

        }
    );

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

renderWatchlist();

updateWatchlistCount();


/* =========================
   AUTOMATIC UPDATES
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
