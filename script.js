const API="https://api.coingecko.com/api/v3";

let btcChart=null;
let coinDetailChart=null;

let allCoins=[];
let coinPage=1;

const coinsPerPage=25;


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

        console.log("Market data error:",e);

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

        if(!Array.isArray(coins)) return;

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
        ).textContent=btc.name;

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

    }catch(e){

        console.log("Coin data error:",e);

    }

}


/* =========================
   MARKET MOVERS
========================= */

function renderMovers(id,coins){

    const container=
        document.getElementById(id);

    if(!container) return;

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

        if(!container) return;

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

        if(!canvas) return;

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

        if(!Array.isArray(data)) return;

        allCoins=data;

        coinPage=1;

        renderCoins();

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

    if(!table) return;

    const searchInput=
        document.getElementById(
            "coinSearch"
        );

    const searchTerm=
        searchInput
        ? searchInput.value.toLowerCase().trim()
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
                    colspan="6"
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

                            $${coin.current_price
                                .toLocaleString()}

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

                    </tr>

                `;

            }
        ).join("");

    setupCoinRowClicks();

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

        loadMoreButton
