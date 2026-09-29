/* =========================================================
   CRYPTO ONLINE
   NEW MULTI-PAGE APPLICATION ENGINE
   ========================================================= */

const API =
    "https://api.coingecko.com/api/v3";

const FNG_API =
    "https://api.alternative.me/fng/?limit=1";

const NEWS_API =
    "https://min-api.cryptocompare.com/data/v2/news/?lang=EN";

const MEMPOOL_API =
    "https://mempool.space/api";

const state = {
    coins: [],
    global: null,
    fearGreed: null,
    categories: [],
    news: [],
    transactions: [],
    alerts: [],
    watchlist: [],
    portfolio: [],
    academy: {},
    currentPage:
        location.pathname.split("/").pop() ||
        "index.html"
};

const storage = {

    get(key, fallback){

        try{
            const raw =
                localStorage.getItem(key);

            return raw
                ? JSON.parse(raw)
                : fallback;

        }catch(error){

            console.warn(
                "Storage read error:",
                key,
                error
            );

            return fallback;
        }
    },

    set(key,value){

        try{

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

        }catch(error){

            console.warn(
                "Storage write error:",
                key,
                error
            );
        }
    }

};

state.watchlist =
    storage.get(
        "cryptoOnlineWatchlist",
        []
    );

state.portfolio =
    storage.get(
        "cryptoOnlinePortfolio",
        []
    );

state.transactions =
    storage.get(
        "cryptoOnlineTransactions",
        []
    );

state.alerts =
    storage.get(
        "cryptoOnlineAlerts",
        []
    );

state.academy =
    storage.get(
        "cryptoOnlineAcademyProgress",
        {}
    );


function $(id){
    return document.getElementById(id);
}


function escapeHTML(value){

    return String(
        value ?? ""
    )
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}


function money(value){

    const number =
        Number(value);

    if(!Number.isFinite(number)){
        return "--";
    }

    return number.toLocaleString(
        "en-US",
        {
            style:"currency",
            currency:"USD",
            maximumFractionDigits:
                number < 1 ? 6 : 2
        }
    );
}


function compactMoney(value){

    const n = Number(value);

    if(!Number.isFinite(n)){
        return "--";
    }

    if(n >= 1e12){
        return "$" +
            (n / 1e12).toFixed(2) +
            "T";
    }

    if(n >= 1e9){
        return "$" +
            (n / 1e9).toFixed(2) +
            "B";
    }

    if(n >= 1e6){
        return "$" +
            (n / 1e6).toFixed(2) +
            "M";
    }

    if(n >= 1e3){
        return "$" +
            (n / 1e3).toFixed(2) +
            "K";
    }

    return money(n);
}


function percent(value){

    const n = Number(value);

    if(!Number.isFinite(n)){
        return "--";
    }

    return (
        n >= 0 ? "+" : ""
    ) +
    n.toFixed(2) +
    "%";
}


function percentClass(value){

    const n = Number(value);

    if(n > 0){
        return "positive";
    }

    if(n < 0){
        return "negative";
    }

    return "neutral";
}


function compactNumber(value){

    const n = Number(value);

    if(!Number.isFinite(n)){
        return "--";
    }

    return n.toLocaleString(
        "en-US",
        {
            maximumFractionDigits:2
        }
    );
}


async function fetchJSON(
    url,
    options = {}
){

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => controller.abort(),
            options.timeout || 15000
        );

    try{

        const response =
            await fetch(
                url,
                {
                    ...options,
                    signal:
                        controller.signal
                }
            );

        if(!response.ok){
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        return await response.json();

    }finally{

        clearTimeout(timeout);
    }
}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;

function showToast(message){

    const toast = $("toast");

    if(!toast){
        return;
    }

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );

    clearTimeout(
        toastTimer
    );

    toastTimer =
        setTimeout(
            () => {
                toast.classList.remove(
                    "show"
                );
            },
            2600
        );
}


/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

function setupMobile(){

    const button =
        $("mobileMenu");

    const sidebar =
        $("sidebar");

    if(!button || !sidebar){
        return;
    }

    button.addEventListener(
        "click",
        () => {
            sidebar.classList.toggle(
                "mobile-open"
            );
        }
    );

    sidebar
        .querySelectorAll(
            ".nav-link"
        )
        .forEach(
            link => {
                link.addEventListener(
                    "click",
                    () => {
                        sidebar.classList.remove(
                            "mobile-open"
                        );
                    }
                );
            }
        );
}


/* =========================================================
   MARKET
   ========================================================= */

async function loadGlobal(){

    try{

        const data =
            await fetchJSON(
                `${API}/global`
            );

        state.global =
            data.data;

        renderGlobal();

    }catch(error){

        console.error(
            "Global market error:",
            error
        );
    }
}


function renderGlobal(){

    const g =
        state.global;

    if(!g){
        return;
    }

    const total =
        $("totalMarketCap");

    const volume =
        $("totalVolume");

    const btc =
        $("btcDominance");

    const eth =
        $("ethDominance");

    if(total){
        total.textContent =
            compactMoney(
                g.total_market_cap.usd
            );
    }

    if(volume){
        volume.textContent =
            compactMoney(
                g.total_volume.usd
            );
    }

    if(btc){
        btc.textContent =
            Number(
                g.market_cap_percentage.btc
            ).toFixed(1) + "%";
    }

    if(eth){
        eth.textContent =
            Number(
                g.market_cap_percentage.eth
            ).toFixed(1) + "%";
    }
}


async function loadCoins(){

    try{

        const data =
            await fetchJSON(
                `${API}/coins/markets` +
                `?vs_currency=usd` +
                `&order=market_cap_desc` +
                `&per_page=100` +
                `&page=1` +
                `&sparkline=false` +
                `&price_change_percentage=1h,24h,7d,30d`
            );

        state.coins =
            Array.isArray(data)
                ? data
                : [];

        renderPageData();

    }catch(error){

        console.error(
            "Coin market error:",
            error
        );

        showToast(
            "Market data could not be refreshed."
        );
    }
}


/* =========================================================
   FEAR & GREED
   ========================================================= */

async function loadFearGreed(){

    try{

        const data =
            await fetchJSON(
                FNG_API
            );

        state.fearGreed =
            data.data?.[0] ||
            null;

        renderFearGreed();

    }catch(error){

        console.error(
            "Fear & Greed error:",
            error
        );
    }
}


function renderFearGreed(){

    const data =
        state.fearGreed;

    if(!data){
        return;
    }

    const value =
        Number(data.value);

    const label =
        data.value_classification;

    [
        $("fearGreedValue"),
        $("largeFearGreed")
    ]
    .filter(Boolean)
    .forEach(
        el => {
            el.textContent =
                value;
        }
    );

    [
        $("fearGreedLabel"),
        $("largeFearGreedLabel")
    ]
    .filter(Boolean)
    .forEach(
        el => {
            el.textContent =
                label;
        }
    );

    const sentiment =
        $("marketSentiment");

    if(sentiment){
        sentiment.textContent =
            label;
    }

    const description =
        $("sentimentDescription");

    if(description){

        description.textContent =
            sentimentText(
                value,
                label
            );
    }

    const headline =
        $("sentimentHeadline");

    if(headline){
        headline.textContent =
            label;
    }

    const analysis =
        $("sentimentAnalysis");

    if(analysis){
        analysis.textContent =
            sentimentText(
                value,
                label
            );
    }

    const terminal =
        $("terminalFearGreed");

    if(terminal){
        terminal.textContent =
            `${label} (${value})`;
    }

    const ai =
        $("aiFearGreed");

    if(ai){
        ai.textContent =
            `${label} (${value})`;
    }
}


function sentimentText(
    value,
    label
){

    const n =
        Number(value);

    if(n >= 75){
        return `The current Fear & Greed reading is ${n}, classified as ${label}. This describes elevated market risk appetite based on the sentiment index.`;
    }

    if(n >= 55){
        return `The current Fear & Greed reading is ${n}, classified as ${label}. The index currently describes a more positive market mood.`;
    }

    if(n >= 45){
        return `The current Fear & Greed reading is ${n}, classified as ${label}. The index currently describes a relatively mixed market mood.`;
    }

    if(n >= 25){
        return `The current Fear & Greed reading is ${n}, classified as ${label}. The index currently describes cautious market sentiment.`;
    }

    return `The current Fear & Greed reading is ${n}, classified as ${label}. The index currently describes very cautious market sentiment.`;
}
/* =========================================================
   DASHBOARD
   ========================================================= */

let btcChart = null;
let advancedChart = null;


function getCoin(id){

    return state.coins.find(
        coin =>
            coin.id === id
    );
}


function renderDashboard(){

    const btc =
        getCoin("bitcoin");

    if(!btc){
        return;
    }

    const price =
        $("btcPrice");

    if(price){
        price.textContent =
            money(
                btc.current_price
            );
    }

    const change =
        $("btcChange");

    if(change){

        change.textContent =
            percent(
                btc.price_change_percentage_24h
            );

        change.className =
            percentClass(
                btc.price_change_percentage_24h
            );
    }

    renderMovers();
    renderDashboardWatchlist();
    renderDashboardPortfolio();
    renderDashboardBriefing();
}


function renderMovers(){

    const gainers =
        [...state.coins]
        .filter(
            c =>
                Number.isFinite(
                    c.price_change_percentage_24h
                )
        )
        .sort(
            (a,b) =>
                b.price_change_percentage_24h -
                a.price_change_percentage_24h
        )
        .slice(0,5);

    const losers =
        [...state.coins]
        .filter(
            c =>
                Number.isFinite(
                    c.price_change_percentage_24h
                )
        )
        .sort(
            (a,b) =>
                a.price_change_percentage_24h -
                b.price_change_percentage_24h
        )
        .slice(0,5);

    renderMiniCoins(
        "topGainers",
        gainers
    );

    renderMiniCoins(
        "topLosers",
        losers
    );

    renderMiniCoins(
        "trendingCoins",
        state.coins.slice(0,5)
    );
}


function renderMiniCoins(
    id,
    coins
){

    const container =
        $(id);

    if(!container){
        return;
    }

    container.innerHTML =
        coins.map(
            coin => `
                <button
                    class="coin-mini"
                    data-open-coin="${escapeHTML(coin.id)}">

                    <img
                        src="${escapeHTML(coin.image)}"
                        alt="">

                    <span class="coin-mini-main">
                        <strong>
                            ${escapeHTML(coin.name)}
                        </strong>

                        <span>
                            ${escapeHTML(
                                coin.symbol.toUpperCase()
                            )}
                        </span>
                    </span>

                    <span
                        class="coin-mini-change ${percentClass(
                            coin.price_change_percentage_24h
                        )}">
                        ${percent(
                            coin.price_change_percentage_24h
                        )}
                    </span>

                </button>
            `
        )
        .join("");

    container
        .querySelectorAll(
            "[data-open-coin]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.openCoin;

                        location.href =
                            `markets.html?coin=${encodeURIComponent(id)}`;

                    }
                );

            }
        );
}


function renderDashboardWatchlist(){

    const container =
        $("dashboardWatchlist");

    const count =
        $("dashboardWatchlistCount");

    if(count){
        count.textContent =
            `${state.watchlist.length} assets`;
    }

    if(!container){
        return;
    }

    const coins =
        state.watchlist
            .map(getCoin)
            .filter(Boolean)
            .slice(0,5);

    if(!coins.length){

        container.innerHTML =
            `<div class="empty-small">
                Your watchlist is empty.
            </div>`;

        return;
    }

    container.innerHTML =
        coins.map(
            coin => `
                <div class="coin-mini">

                    <img
                        src="${escapeHTML(coin.image)}"
                        alt="">

                    <span class="coin-mini-main">
                        <strong>
                            ${escapeHTML(coin.name)}
                        </strong>

                        <span>
                            ${money(coin.current_price)}
                        </span>
                    </span>

                    <span
                        class="coin-mini-change ${percentClass(
                            coin.price_change_percentage_24h
                        )}">
                        ${percent(
                            coin.price_change_percentage_24h
                        )}
                    </span>

                </div>
            `
        )
        .join("");
}


function portfolioValue(){

    return state.portfolio.reduce(
        (total,item) => {

            const coin =
                getCoin(
                    item.coinId
                );

            if(!coin){
                return total;
            }

            return total +
                Number(item.quantity || 0) *
                Number(coin.current_price || 0);

        },
        0
    );
}


function portfolioInvested(){

    return state.portfolio.reduce(
        (total,item) => {

            return total +
                Number(item.quantity || 0) *
                Number(item.buyPrice || 0);

        },
        0
    );
}


function renderDashboardPortfolio(){

    const value =
        portfolioValue();

    const invested =
        portfolioInvested();

    const pl =
        value - invested;

    const valueEl =
        $("dashboardPortfolioValue");

    const plEl =
        $("dashboardPortfolioPL");

    if(valueEl){
        valueEl.textContent =
            money(value);
    }

    if(plEl){

        plEl.textContent =
            money(pl);

        plEl.className =
            percentClass(
                invested
                    ? pl / invested * 100
                    : 0
            );
    }
}


function renderDashboardBriefing(){

    const heading =
        $("dashboardRegime");

    const text =
        $("dashboardBriefing");

    if(!heading || !text){
        return;
    }

    const btc =
        getCoin("bitcoin");

    if(!btc){
        return;
    }

    const positive =
        state.coins.filter(
            c =>
                Number(
                    c.price_change_percentage_24h
                ) > 0
        ).length;

    const breadth =
        state.coins.length
            ? positive / state.coins.length
            : 0;

    const change =
        Number(
            btc.price_change_percentage_24h
        );

    let regime =
        "Mixed market";

    if(change > 2 && breadth > .6){
        regime =
            "Broad positive momentum";
    }else if(change < -2 && breadth < .4){
        regime =
            "Defensive market conditions";
    }

    heading.textContent =
        regime;

    text.textContent =
        `Bitcoin is ${percent(change)} over 24 hours while approximately ${(breadth * 100).toFixed(0)}% of tracked assets are positive. This is a descriptive market snapshot, not a forecast.`;
}


/* =========================================================
   BITCOIN CHART
   ========================================================= */

async function loadBitcoinChart(){

    const canvas =
        $("btcChart");

    if(!canvas || typeof Chart === "undefined"){
        return;
    }

    try{

        const data =
            await fetchJSON(
                `${API}/coins/bitcoin/market_chart` +
                `?vs_currency=usd&days=7&interval=hourly`
            );

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

        const values =
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
                                label:"Bitcoin",
                                data:values,

                                borderColor:
                                    "#2563eb",

                                backgroundColor:
                                    "rgba(37,99,235,.10)",

                                fill:true,

                                tension:.35,

                                pointRadius:0
                            }
                        ]
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
                                grid:{
                                    display:false
                                }
                            },

                            y:{
                                grid:{
                                    color:
                                        "rgba(117,109,99,.10)"
                                },

                                ticks:{
                                    callback:
                                        value =>
                                            "$" +
                                            Number(value)
                                            .toLocaleString()
                                }
                            }
                        }
                    }
                }
            );

    }catch(error){

        console.error(
            "BTC chart error:",
            error
        );
    }
}
/* =========================================================
   EXPLORER
   ========================================================= */

let explorerPage = 1;

const explorerPerPage = 20;


function setupExplorer(){

    const search =
        $("explorerSearch");

    const filter =
        $("explorerFilter");

    const sort =
        $("explorerSort");

    const direction =
        $("explorerDirection");

    [
        search,
        filter,
        sort,
        direction
    ]
    .filter(Boolean)
    .forEach(
        element => {

            element.addEventListener(
                "input",
                () => {

                    explorerPage = 1;

                    renderExplorer();

                }
            );

            element.addEventListener(
                "change",
                () => {

                    explorerPage = 1;

                    renderExplorer();

                }
            );
        }
    );

    [
        "minMarketCap",
        "maxMarketCap",
        "minChange",
        "maxChange"
    ]
    .map($)
    .filter(Boolean)
    .forEach(
        element => {

            element.addEventListener(
                "input",
                () => {

                    explorerPage = 1;

                    renderExplorer();

                }
            );
        }
    );

    $("resetExplorer")
        ?.addEventListener(
            "click",
            () => {

                if(search) search.value = "";
                if(filter) filter.value = "all";
                if(sort) sort.value = "rank";
                if(direction) direction.value = "asc";

                [
                    "minMarketCap",
                    "maxMarketCap",
                    "minChange",
                    "maxChange"
                ]
                .map($)
                .filter(Boolean)
                .forEach(
                    input => {
                        input.value = "";
                    }
                );

                explorerPage = 1;

                renderExplorer();

            }
        );
}


function getExplorerCoins(){

    let coins =
        [...state.coins];

    const search =
        $("explorerSearch")
            ?.value
            .trim()
            .toLowerCase();

    const filter =
        $("explorerFilter")
            ?.value || "all";

    const minCap =
        Number(
            $("minMarketCap")?.value
        );

    const maxCap =
        Number(
            $("maxMarketCap")?.value
        );

    const minChange =
        Number(
            $("minChange")?.value
        );

    const maxChange =
        Number(
            $("maxChange")?.value
        );

    if(search){

        coins =
            coins.filter(
                coin =>
                    coin.name
                        .toLowerCase()
                        .includes(search) ||
                    coin.symbol
                        .toLowerCase()
                        .includes(search) ||
                    coin.id
                        .toLowerCase()
                        .includes(search)
            );
    }

    if(filter === "gainers"){

        coins =
            coins.filter(
                coin =>
                    coin.price_change_percentage_24h > 0
            );

    }else if(filter === "losers"){

        coins =
            coins.filter(
                coin =>
                    coin.price_change_percentage_24h < 0
            );

    }else if(filter === "top10"){

        coins =
            coins.filter(
                coin =>
                    coin.market_cap_rank <= 10
            );

    }else if(filter === "top50"){

        coins =
            coins.filter(
                coin =>
                    coin.market_cap_rank <= 50
            );
    }

    if(Number.isFinite(minCap) &&
       $("minMarketCap")?.value){

        coins =
            coins.filter(
                coin =>
                    coin.market_cap >= minCap
            );
    }

    if(Number.isFinite(maxCap) &&
       $("maxMarketCap")?.value){

        coins =
            coins.filter(
                coin =>
                    coin.market_cap <= maxCap
            );
    }

    if(Number.isFinite(minChange) &&
       $("minChange")?.value){

        coins =
            coins.filter(
                coin =>
                    coin.price_change_percentage_24h >=
                    minChange
            );
    }

    if(Number.isFinite(maxChange) &&
       $("maxChange")?.value){

        coins =
            coins.filter(
                coin =>
                    coin.price_change_percentage_24h <=
                    maxChange
            );
    }

    const sort =
        $("explorerSort")
            ?.value || "rank";

    const direction =
        $("explorerDirection")
            ?.value || "asc";

    const multiplier =
        direction === "asc"
            ? 1
            : -1;

    coins.sort(
        (a,b) => {

            let av = 0;
            let bv = 0;

            if(sort === "rank"){
                av = a.market_cap_rank || 999999;
                bv = b.market_cap_rank || 999999;
            }

            if(sort === "market_cap"){
                av = a.market_cap || 0;
                bv = b.market_cap || 0;
            }

            if(sort === "price"){
                av = a.current_price || 0;
                bv = b.current_price || 0;
            }

            if(sort === "change"){
                av = a.price_change_percentage_24h || 0;
                bv = b.price_change_percentage_24h || 0;
            }

            if(sort === "volume"){
                av = a.total_volume || 0;
                bv = b.total_volume || 0;
            }

            return (
                av - bv
            ) * multiplier;
        }
    );

    return coins;
}


function renderExplorer(){

    const table =
        $("explorerTable");

    if(!table){
        return;
    }

    const coins =
        getExplorerCoins();

    const total =
        coins.length;

    const start =
        (explorerPage - 1) *
        explorerPerPage;

    const visible =
        coins.slice(
            start,
            start + explorerPerPage
        );

    const count =
        $("explorerCount");

    if(count){
        count.textContent =
            `${total} matching assets`;
    }

    if(!visible.length){

        table.innerHTML =
            `<tr>
                <td colspan="8"
                    class="table-loading">
                    No assets match your filters.
                </td>
             </tr>`;

    }else{

        table.innerHTML =
            visible.map(
                coin => `

                <tr>

                    <td>
                        #${coin.market_cap_rank || "--"}
                    </td>

                    <td>
                        <div class="asset-cell">

                            <img
                                src="${escapeHTML(coin.image)}"
                                alt="">

                            <span>
                                <strong>
                                    ${escapeHTML(coin.name)}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        coin.symbol.toUpperCase()
                                    )}
                                </small>
                            </span>

                        </div>
                    </td>

                    <td>
                        ${money(coin.current_price)}
                    </td>

                    <td class="${percentClass(
                        coin.price_change_percentage_24h
                    )}">
                        ${percent(
                            coin.price_change_percentage_24h
                        )}
                    </td>

                    <td>
                        ${compactMoney(coin.market_cap)}
                    </td>

                    <td>
                        ${compactMoney(coin.total_volume)}
                    </td>

                    <td>
                        ${compactNumber(
                            coin.circulating_supply
                        )}
                    </td>

                    <td>

                        <div class="row-actions">

                            <button
                                class="button secondary small"
                                data-detail="${escapeHTML(coin.id)}">
                                Details
                            </button>

                            <button
                                class="button secondary small"
                                data-watch="${escapeHTML(coin.id)}">
                                ★
                            </button>

                        </div>

                    </td>

                </tr>
                `
            )
            .join("");

    }

    table
        .querySelectorAll(
            "[data-detail]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {
                        openCoinDetail(
                            button.dataset.detail
                        );
                    }
                );

            }
        );

    table
        .querySelectorAll(
            "[data-watch]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        toggleWatchlist(
                            button.dataset.watch
                        );

                    }
                );

            }
        );

    renderPagination(
        coins.length
    );
}


function renderPagination(total){

    const container =
        $("explorerPagination");

    if(!container){
        return;
    }

    const pages =
        Math.ceil(
            total / explorerPerPage
        );

    if(pages <= 1){

        container.innerHTML =
            "";

        return;
    }

    const visiblePages =
        Math.min(
            pages,
            8
        );

    container.innerHTML =
        Array.from(
            {length:visiblePages},
            (_,i) => {

                const page =
                    i + 1;

                return `
                    <button
                        class="page-button ${
                            page === explorerPage
                                ? "active"
                                : ""
                        }"
                        data-page="${page}">
                        ${page}
                    </button>
                `;
            }
        )
        .join("");

    container
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        explorerPage =
                            Number(
                                button.dataset.page
                            );

                        renderExplorer();

                        window.scrollTo({
                            top:0,
                            behavior:"smooth"
                        });

                    }
                );

            }
        );
}


/* =========================================================
   WATCHLIST
   ========================================================= */

function toggleWatchlist(id){

    const index =
        state.watchlist.indexOf(id);

    if(index >= 0){

        state.watchlist.splice(
            index,
            1
        );

        showToast(
            "Removed from watchlist."
        );

    }else{

        state.watchlist.push(id);

        showToast(
            "Added to watchlist."
        );
    }

    storage.set(
        "cryptoOnlineWatchlist",
        state.watchlist
    );

    renderPageData();
}


function renderWatchlist(){

    const container =
        $("watchlistContainer");

    if(!container){
        return;
    }

    const coins =
        state.watchlist
            .map(getCoin)
            .filter(Boolean);

    const count =
        $("watchlistCount");

    if(count){
        count.textContent =
            coins.length;
    }

    if(!coins.length){

        container.innerHTML =
            `<div class="empty-state">
                <span>★</span>
                <h3>Your watchlist is empty</h3>
                <p>
                    Open Markets and add assets
                    you want to monitor.
                </p>
            </div>`;

        return;
    }

    container.innerHTML =
        coins.map(
            coin => `

                <article class="watch-card">

                    <div class="watch-card-header">

                        <div class="watch-card-asset">

                            <img
                                src="${escapeHTML(coin.image)}"
                                alt="">

                            <span>
                                <strong>
                                    ${escapeHTML(coin.name)}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        coin.symbol.toUpperCase()
                                    )}
                                </span>
                            </span>

                        </div>

                        <button
                            class="button secondary small"
                            data-remove-watch="${escapeHTML(coin.id)}">
                            Remove
                        </button>

                    </div>

                    <div class="watch-card-price">
                        ${money(coin.current_price)}
                    </div>

                    <div class="watch-card-change ${percentClass(
                        coin.price_change_percentage_24h
                    )}">
                        ${percent(
                            coin.price_change_percentage_24h
                        )}
                    </div>

                </article>
            `
        )
        .join("");

    container
        .querySelectorAll(
            "[data-remove-watch]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        toggleWatchlist(
                            button.dataset.removeWatch
                        );

                    }
                );

            }
        );
}
/* =========================================================
   PORTFOLIO
   ========================================================= */

function populateAssetSelects(){

    const ids = [
        "portfolioCoin",
        "transactionCoin",
        "alertCoin",
        "convertFrom",
        "convertTo",
        "advancedChartCoin"
    ];

    ids
        .map($)
        .filter(Boolean)
        .forEach(
            select => {

                const current =
                    select.value;

                select.innerHTML =
                    "";

                state.coins
                    .slice(0,100)
                    .forEach(
                        coin => {

                            const option =
                                document.createElement(
                                    "option"
                                );

                            option.value =
                                coin.id;

                            option.textContent =
                                `${coin.name} (${coin.symbol.toUpperCase()})`;

                            select.appendChild(
                                option
                            );
                        }
                    );

                if(
                    state.coins.some(
                        c => c.id === current
                    )
                ){
                    select.value =
                        current;
                }

            }
        );
}


function addPortfolioAsset(){

    const coinId =
        $("portfolioCoin")?.value;

    const quantity =
        Number(
            $("portfolioQuantity")?.value
        );

    const buyPrice =
        Number(
            $("portfolioBuyPrice")?.value
        );

    if(
        !coinId ||
        quantity <= 0 ||
        buyPrice < 0
    ){

        showToast(
            "Enter a valid portfolio asset."
        );

        return;
    }

    const existing =
        state.portfolio.find(
            item =>
                item.coinId === coinId
        );

    if(existing){

        const oldQuantity =
            Number(existing.quantity);

        const newQuantity =
            oldQuantity +
            quantity;

        const oldCost =
            oldQuantity *
            Number(existing.buyPrice);

        const newCost =
            quantity *
            buyPrice;

        existing.quantity =
            newQuantity;

        existing.buyPrice =
            (oldCost + newCost) /
            newQuantity;

    }else{

        state.portfolio.push({
            coinId,
            quantity,
            buyPrice
        });

    }

    storage.set(
        "cryptoOnlinePortfolio",
        state.portfolio
    );

    $("portfolioQuantity").value =
        "";

    $("portfolioBuyPrice").value =
        "";

    showToast(
        "Portfolio updated."
    );

    renderPageData();
}


function removePortfolioAsset(
    coinId
){

    state.portfolio =
        state.portfolio.filter(
            item =>
                item.coinId !== coinId
        );

    storage.set(
        "cryptoOnlinePortfolio",
        state.portfolio
    );

    renderPageData();

    showToast(
        "Holding removed."
    );
}


function renderPortfolio(){

    const table =
        $("portfolioTable");

    if(!table){
        return;
    }

    const value =
        portfolioValue();

    const invested =
        portfolioInvested();

    const pl =
        value - invested;

    const plPercent =
        invested
            ? pl / invested * 100
            : 0;

    $("portfolioCurrentValue").textContent =
        money(value);

    $("portfolioInvested").textContent =
        money(invested);

    $("portfolioProfitLoss").textContent =
        money(pl);

    $("portfolioProfitPercent").textContent =
        percent(plPercent);

    $("portfolioHoldingsCount").textContent =
        state.portfolio.length;

    if(!state.portfolio.length){

        table.innerHTML =
            `<tr>
                <td colspan="8"
                    class="table-loading">
                    Your portfolio is empty.
                </td>
             </tr>`;

        return;
    }

    table.innerHTML =
        state.portfolio.map(
            item => {

                const coin =
                    getCoin(
                        item.coinId
                    );

                if(!coin){
                    return "";
                }

                const quantity =
                    Number(item.quantity);

                const buy =
                    Number(item.buyPrice);

                const current =
                    Number(coin.current_price);

                const currentValue =
                    quantity *
                    current;

                const cost =
                    quantity *
                    buy;

                const itemPL =
                    currentValue -
                    cost;

                const allocation =
                    value
                        ? currentValue /
                          value *
                          100
                        : 0;

                return `
                    <tr>

                        <td>
                            <div class="asset-cell">
                                <img
                                    src="${escapeHTML(coin.image)}"
                                    alt="">
                                <span>
                                    <strong>
                                        ${escapeHTML(coin.name)}
                                    </strong>
                                    <small>
                                        ${escapeHTML(
                                            coin.symbol.toUpperCase()
                                        )}
                                    </small>
                                </span>
                            </div>
                        </td>

                        <td>
                            ${quantity.toLocaleString()}
                        </td>

                        <td>
                            ${money(buy)}
                        </td>

                        <td>
                            ${money(current)}
                        </td>

                        <td>
                            ${money(currentValue)}
                        </td>

                        <td class="${percentClass(
                            itemPL
                        )}">
                            ${money(itemPL)}
                        </td>

                        <td>
                            ${allocation.toFixed(1)}%
                        </td>

                        <td>
                            <button
                                class="button danger small"
                                data-remove-portfolio="${escapeHTML(item.coinId)}">
                                Remove
                            </button>
                        </td>

                    </tr>
                `;
            }
        )
        .join("");

    table
        .querySelectorAll(
            "[data-remove-portfolio]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        removePortfolioAsset(
                            button.dataset.removePortfolio
                        );

                    }
                );

            }
        );

    renderPortfolioInsights();
}


function renderPortfolioInsights(){

    const value =
        portfolioValue();

    let largest =
        null;

    let gainers = 0;
    let losers = 0;

    let hhi = 0;

    state.portfolio
        .map(
            item => ({
                item,
                coin:
                    getCoin(
                        item.coinId
                    )
            })
        )
        .filter(
            x => x.coin
        )
        .forEach(
            ({item,coin}) => {

                const holding =
                    Number(item.quantity) *
                    Number(coin.current_price);

                const allocation =
                    value
                        ? holding / value * 100
                        : 0;

                hhi +=
                    Math.pow(
                        allocation,
                        2
                    );

                if(
                    !largest ||
                    holding > largest.value
                ){

                    largest = {
                        name:coin.name,
                        value:holding,
                        allocation
                    };
                }

                const pl =
                    holding -
                    Number(item.quantity) *
                    Number(item.buyPrice);

                if(pl > 0){
                    gainers++;
                }

                if(pl < 0){
                    losers++;
                }
            }
        );

    if($("largestHolding")){
        $("largestHolding").textContent =
            largest
                ? largest.name
                : "--";
    }

    if($("largestHoldingPercent")){
        $("largestHoldingPercent").textContent =
            largest
                ? `${largest.allocation.toFixed(1)}% of portfolio`
                : "--";
    }

    if($("portfolioHHI")){
        $("portfolioHHI").textContent =
            hhi
                ? hhi.toFixed(0)
                : "--";
    }

    if($("portfolioGainers")){
        $("portfolioGainers").textContent =
            gainers;
    }

    if($("portfolioLosers")){
        $("portfolioLosers").textContent =
            losers;
    }
}


/* =========================================================
   ALERTS
   ========================================================= */

function addAlert(){

    const coinId =
        $("alertCoin")?.value;

    const condition =
        $("alertCondition")?.value;

    const target =
        Number(
            $("alertTarget")?.value
        );

    if(
        !coinId ||
        !Number.isFinite(target)
    ){

        showToast(
            "Enter a valid alert."
        );

        return;
    }

    state.alerts.push({

        id:
            Date.now(),

        coinId,

        condition,

        target,

        active:true,

        created:
            new Date().toISOString()

    });

    storage.set(
        "cryptoOnlineAlerts",
        state.alerts
    );

    $("alertTarget").value =
        "";

    renderAlerts();

    showToast(
        "Alert created."
    );
}


function renderAlerts(){

    const container =
        $("alertsList");

    if(!container){
        return;
    }

    if(!state.alerts.length){

        container.innerHTML =
            `<div class="empty-small">
                No alerts created.
            </div>`;

        return;
    }

    container.innerHTML =
        state.alerts.map(
            alert => {

                const coin =
                    getCoin(
                        alert.coinId
                    );

                if(!coin){
                    return "";
                }

                const conditionText = {

                    above:"Price above",

                    below:"Price below",

                    change_above:
                        "24H change above",

                    change_below:
                        "24H change below"

                }[alert.condition] ||
                "Condition";

                return `
                    <div class="alert-item">

                        <div class="alert-item-main">

                            <img
                                src="${escapeHTML(coin.image)}"
                                alt="">

                            <span>
                                <strong>
                                    ${escapeHTML(coin.name)}
                                </strong>

                                <span>
                                    ${conditionText}
                                    ${alert.target}
                                </span>
                            </span>

                        </div>

                        <div class="alert-actions">

                            <button
                                class="button secondary small"
                                data-toggle-alert="${alert.id}">
                                ${alert.active ? "Pause" : "Resume"}
                            </button>

                            <button
                                class="button danger small"
                                data-delete-alert="${alert.id}">
                                Delete
                            </button>

                        </div>

                    </div>
                `;
            }
        )
        .join("");

    container
        .querySelectorAll(
            "[data-toggle-alert]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const alert =
                            state.alerts.find(
                                item =>
                                    item.id ===
                                    Number(
                                        button.dataset.toggleAlert
                                    )
                            );

                        if(alert){
                            alert.active =
                                !alert.active;
                        }

                        storage.set(
                            "cryptoOnlineAlerts",
                            state.alerts
                        );

                        renderAlerts();
                    }
                );

            }
        );

    container
        .querySelectorAll(
            "[data-delete-alert]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        state.alerts =
                            state.alerts.filter(
                                item =>
                                    item.id !==
                                    Number(
                                        button.dataset.deleteAlert
                                    )
                            );

                        storage.set(
                            "cryptoOnlineAlerts",
                            state.alerts
                        );

                        renderAlerts();
                    }
                );

            }
        );
}


/* =========================================================
   AI ASSISTANT
   ========================================================= */

function sendAI(){

    const input =
        $("aiInput");

    const messages =
        $("aiMessages");

    if(!input || !messages){
        return;
    }

    const query =
        input.value.trim();

    if(!query){
        return;
    }

    appendAIMessage(
        query,
        "user"
    );

    input.value =
        "";

    setTimeout(
        () => {

            appendAIMessage(
                answerAI(query),
                "assistant"
            );

        },
        250
    );
}


function appendAIMessage(
    text,
    type
){

    const messages =
        $("aiMessages");

    if(!messages){
        return;
    }

    const div =
        document.createElement(
            "div"
        );

    div.className =
        `ai-message ${type}`;

    div.textContent =
        text;

    messages.appendChild(
        div
    );

    messages.scrollTop =
        messages.scrollHeight;
}


function answerAI(query){

    const q =
        query.toLowerCase();

    const btc =
        getCoin("bitcoin");

    const btcPrice =
        btc
            ? money(btc.current_price)
            : "--";

    const btcChange =
        btc
            ? percent(
                btc.price_change_percentage_24h
              )
            : "--";

    const sentiment =
        state.fearGreed
            ? `${state.fearGreed.value_classification} (${state.fearGreed.value})`
            : "--";

    if(
        q.includes("bitcoin") ||
        q.includes("btc")
    ){

        return `Bitcoin is currently ${btcPrice} and ${btcChange} over 24 hours. The current Fear & Greed reading is ${sentiment}. This describes current market data and is not a prediction.`;
    }

    if(
        q.includes("fear") ||
        q.includes("greed") ||
        q.includes("sentiment")
    ){

        return `The current Fear & Greed index is ${sentiment}. This index is a sentiment measure and should be interpreted alongside other market information.`;
    }

    if(
        q.includes("gainer")
    ){

        const coins =
            [...state.coins]
            .sort(
                (a,b) =>
                    (b.price_change_percentage_24h || 0) -
                    (a.price_change_percentage_24h || 0)
            )
            .slice(0,3);

        return (
            "Current top tracked gainers: " +
            coins
                .map(
                    c =>
                        `${c.name} ${percent(c.price_change_percentage_24h)}`
                )
                .join(", ") +
            "."
        );
    }

    if(
        q.includes("portfolio")
    ){

        return `Your tracked portfolio currently contains ${state.portfolio.length} assets with an estimated live value of ${money(portfolioValue())}.`;
    }

    if(
        q.includes("watchlist")
    ){

        return `Your watchlist currently contains ${state.watchlist.length} tracked assets.`;
    }

    if(
        q.includes("market") ||
        q.includes("condition")
    ){

        const positive =
            state.coins.filter(
                c =>
                    c.price_change_percentage_24h > 0
            ).length;

        const breadth =
            state.coins.length
                ? positive /
                  state.coins.length *
                  100
                : 0;

        return `The current tracked market has approximately ${breadth.toFixed(0)}% positive assets over 24 hours. Bitcoin is ${btcChange}. Fear & Greed is ${sentiment}. This is a descriptive snapshot, not investment advice.`;
    }

    if(
        q.includes("blockchain")
    ){

        return "A blockchain is a distributed ledger where transactions are recorded and validated by a network according to its consensus rules.";
    }

    if(
        q.includes("wallet") ||
        q.includes("private key")
    ){

        return "A crypto wallet manages the cryptographic keys used to interact with blockchain assets. A private key or seed phrase should never be shared with another person or entered into an unknown website.";
    }

    return "I can explain current market data, Bitcoin, Ethereum, Fear & Greed, movers, your watchlist, portfolio information, blockchain concepts and basic crypto terminology.";
}
/* =========================================================
   NEWS
   ========================================================= */

async function loadNews(){

    const grid =
        $("newsGrid");

    if(!grid){
        return;
    }

    try{

        const data =
            await fetchJSON(
                NEWS_API
            );

        state.news =
            data.Data || [];

        renderNews();

    }catch(error){

        console.error(
            "News error:",
            error
        );

        const status =
            $("newsStatus");

        if(status){
            status.textContent =
                "News could not be loaded right now.";
        }
    }
}


function renderNews(){

    const grid =
        $("newsGrid");

    if(!grid){
        return;
    }

    const search =
        $("newsSearch")
            ?.value
            .trim()
            .toLowerCase() ||
            "";

    const category =
        document
            .querySelector(
                ".news-tab.active"
            )
            ?.dataset
            .newsCategory ||
            "latest";

    let items =
        [...state.news];

    if(search){

        items =
            items.filter(
                item =>
                    `${item.title} ${item.body} ${item.categories}`
                    .toLowerCase()
                    .includes(search)
            );
    }

    if(category !== "latest"){

        items =
            items.filter(
                item =>
                    `${item.title} ${item.categories}`
                    .toLowerCase()
                    .includes(category)
            );
    }

    items =
        items.slice(0,30);

    const status =
        $("newsStatus");

    if(status){

        status.textContent =
            `${items.length} articles`;
    }

    if(!items.length){

        grid.innerHTML =
            `<div class="empty-state">
                <span>▤</span>
                <h3>No matching news</h3>
                <p>
                    Try another search or category.
                </p>
            </div>`;

        return;
    }

    grid.innerHTML =
        items.map(
            item => `

                <article class="news-card">

                    ${
                        item.imageurl
                            ? `
                                <img
                                    class="news-card-image"
                                    src="${escapeHTML(item.imageurl)}"
                                    alt="">
                              `
                            : ""
                    }

                    <div class="news-card-content">

                        <span class="news-source">
                            ${escapeHTML(
                                item.source_info?.name ||
                                item.source ||
                                "Crypto News"
                            )}
                        </span>

                        <h3>
                            ${escapeHTML(item.title)}
                        </h3>

                        <p>
                            ${escapeHTML(
                                item.body || ""
                            )}
                        </p>

                        <div class="news-card-footer">

                            <span>
                                ${new Date(
                                    Number(item.published_on || 0) * 1000
                                ).toLocaleString()}
                            </span>

                            <a
                                href="${safeURL(item.url)}"
                                target="_blank"
                                rel="noopener"
                                class="text-link">
                                Read →
                            </a>

                        </div>

                    </div>

                </article>
            `
        )
        .join("");
}


function safeURL(url){

    try{

        const parsed =
            new URL(
                url,
                location.href
            );

        if(
            parsed.protocol === "https:" ||
            parsed.protocol === "http:"
        ){
            return parsed.href;
        }

    }catch(error){}

    return "#";
}


/* =========================================================
   TOOLS
   ========================================================= */

function setupTools(){

    $("calculateProfit")
        ?.addEventListener(
            "click",
            () => {

                const buy =
                    Number(
                        $("profitBuy").value
                    );

                const sell =
                    Number(
                        $("profitSell").value
                    );

                const quantity =
                    Number(
                        $("profitQuantity").value
                    );

                const result =
                    (sell - buy) *
                    quantity;

                $("profitResult").textContent =
                    money(result);

            }
        );

    $("calculatePercent")
        ?.addEventListener(
            "click",
            () => {

                const oldValue =
                    Number(
                        $("percentOld").value
                    );

                const newValue =
                    Number(
                        $("percentNew").value
                    );

                const result =
                    oldValue
                        ? (
                            (newValue - oldValue) /
                            oldValue
                        ) * 100
                        : 0;

                $("percentResult").textContent =
                    percent(result);

            }
        );

    $("calculateCap")
        ?.addEventListener(
            "click",
            () => {

                const price =
                    Number(
                        $("capPrice").value
                    );

                const supply =
                    Number(
                        $("capSupply").value
                    );

                $("capResult").textContent =
                    compactMoney(
                        price * supply
                    );

            }
        );

    $("calculateDca")
        ?.addEventListener(
            "click",
            () => {

                const amount =
                    Number(
                        $("dcaAmount").value
                    );

                const periods =
                    Number(
                        $("dcaPeriods").value
                    );

                $("dcaResult").textContent =
                    money(
                        amount * periods
                    );

            }
        );

    $("calculatePosition")
        ?.addEventListener(
            "click",
            () => {

                const account =
                    Number(
                        $("positionAccount").value
                    );

                const risk =
                    Number(
                        $("positionRisk").value
                    );

                const stop =
                    Number(
                        $("positionStop").value
                    );

                const riskMoney =
                    account *
                    risk /
                    100;

                const size =
                    stop
                        ? riskMoney /
                          (stop / 100)
                        : 0;

                $("positionResult").textContent =
                    money(size);

            }
        );

    $("calculateConverter")
        ?.addEventListener(
            "click",
            () => {

                const amount =
                    Number(
                        $("convertAmount").value
                    );

                const from =
                    getCoin(
                        $("convertFrom").value
                    );

                const to =
                    getCoin(
                        $("convertTo").value
                    );

                if(!from || !to){
                    return;
                }

                const usd =
                    amount *
                    from.current_price;

                const result =
                    usd /
                    to.current_price;

                $("converterResult").textContent =
                    result.toLocaleString(
                        "en-US",
                        {
                            maximumFractionDigits:8
                        }
                    );
            }
        );
}


/* =========================================================
   ACADEMY
   ========================================================= */

const academyLessons = [

    {
        id:"basics",
        level:"beginner",
        title:"Crypto Basics",
        text:"Learn what cryptocurrency is, why digital assets exist and how crypto markets work.",
        question:"What does cryptocurrency generally use to record transactions?",
        answers:[
            "A blockchain or distributed ledger",
            "A paper notebook",
            "A single private spreadsheet"
        ],
        correct:0
    },

    {
        id:"blockchain",
        level:"beginner",
        title:"Understanding Blockchain",
        text:"Understand blocks, transactions, consensus and distributed networks.",
        question:"What is a blockchain?",
        answers:[
            "A distributed ledger",
            "A physical bank",
            "A computer monitor"
        ],
        correct:0
    },

    {
        id:"bitcoin",
        level:"beginner",
        title:"Bitcoin",
        text:"Study Bitcoin's basic design, supply structure and transaction model.",
        question:"What is Bitcoin's native asset called?",
        answers:[
            "BTC",
            "ETH",
            "SOL"
        ],
        correct:0
    },

    {
        id:"wallets",
        level:"beginner",
        title:"Crypto Wallets",
        text:"Learn public addresses, private keys and seed phrases.",
        question:"Which should never be publicly shared?",
        answers:[
            "Private key or seed phrase",
            "Public address",
            "Coin symbol"
        ],
        correct:0
    },

    {
        id:"ethereum",
        level:"intermediate",
        title:"Ethereum",
        text:"Learn about Ethereum and programmable blockchain applications.",
        question:"What is Ethereum's native asset?",
        answers:[
            "ETH",
            "BTC",
            "USDT"
        ],
        correct:0
    },

    {
        id:"smart-contracts",
        level:"intermediate",
        title:"Smart Contracts",
        text:"Understand blockchain programs that execute according to predefined rules.",
        question:"Where do smart contracts commonly execute?",
        answers:[
            "On blockchain networks",
            "Only inside email",
            "Only on paper"
        ],
        correct:0
    },

    {
        id:"defi",
        level:"intermediate",
        title:"DeFi",
        text:"Explore decentralized finance concepts including exchanges and lending.",
        question:"What does DeFi commonly mean?",
        answers:[
            "Decentralized Finance",
            "Digital File Finance",
            "Default Financial Input"
        ],
        correct:0
    },

    {
        id:"stablecoins",
        level:"intermediate",
        title:"Stablecoins",
        text:"Learn why some crypto assets are designed to track reference values.",
        question:"What is a common goal of a stablecoin?",
        answers:[
            "Maintain relatively stable value against a reference asset",
            "Always increase in price",
            "Have no market"
        ],
        correct:0
    },

    {
        id:"onchain",
        level:"advanced",
        title:"On-Chain Analysis",
        text:"Study blockchain transaction activity and network-level information.",
        question:"What does on-chain data describe?",
        answers:[
            "Data recorded on a blockchain",
            "Private bank passwords",
            "Offline paper records"
        ],
        correct:0
    },

    {
        id:"tokenomics",
        level:"advanced",
        title:"Tokenomics",
        text:"Understand supply, distribution, emissions and utility.",
        question:"What does tokenomics study?",
        answers:[
            "Token economic structure",
            "Computer screen resolution",
            "Email protocols"
        ],
        correct:0
    },

    {
        id:"security",
        level:"advanced",
        title:"Crypto Security",
        text:"Learn practical principles for protecting digital assets.",
        question:"What should you do with a seed phrase?",
        answers:[
            "Keep it private and secure",
            "Post it publicly",
            "Send it to strangers"
        ],
        correct:0
    },

    {
        id:"market-analysis",
        level:"advanced",
        title:"Crypto Market Analysis",
        text:"Learn how price, volume, market capitalization and sentiment can be studied together.",
        question:"What is market capitalization?",
        answers:[
            "Price multiplied by circulating supply",
            "Price divided by volume",
            "Volume multiplied by time"
        ],
        correct:0
    }

];


function renderAcademy(){

    const grid =
        $("academyGrid");

    if(!grid){
        return;
    }

    const activeLevel =
        document
            .querySelector(
                ".academy-filter.active"
            )
            ?.dataset
            .academyLevel ||
            "all";

    const lessons =
        academyLessons.filter(
            lesson =>
                activeLevel === "all" ||
                lesson.level === activeLevel
        );

    grid.innerHTML =
        lessons.map(
            lesson => {

                const complete =
                    !!state.academy[
                        lesson.id
                    ];

                return `
                    <article
                        class="academy-card ${
                            complete
                                ? "completed"
                                : ""
                        }">

                        <span class="academy-level">
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
                            class="button ${
                                complete
                                    ? "secondary"
                                    : "primary"
                            }"
                            data-lesson="${escapeHTML(
                                lesson.id
                            )}">
                            ${
                                complete
                                    ? "Completed"
                                    : "Start Lesson"
                            }
                        </button>

                    </article>
                `;
            }
        )
        .join("");

    grid
        .querySelectorAll(
            "[data-lesson]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openLesson(
                            button.dataset.lesson
                        );

                    }
                );

            }
        );

    updateAcademyProgress();
}


function openLesson(id){

    const lesson =
        academyLessons.find(
            item =>
                item.id === id
        );

    if(!lesson){
        return;
    }

    const backdrop =
        $("academyModal");

    const content =
        $("academyModalContent");

    if(!backdrop || !content){
        return;
    }

    content.innerHTML = `
        <span class="eyebrow">
            ${escapeHTML(lesson.level)}
        </span>

        <h2 style="margin-top:6px">
            ${escapeHTML(lesson.title)}
        </h2>

        <p style="margin-top:10px">
            ${escapeHTML(lesson.text)}
        </p>

        <div style="margin-top:25px">
            <strong>
                ${escapeHTML(lesson.question)}
            </strong>
        </div>

        <div id="lessonAnswers"
             style="
                display:flex;
                flex-direction:column;
                gap:7px;
                margin-top:13px;
             ">

            ${lesson.answers.map(
                (answer,index) => `
                    <button
                        class="button secondary"
                        data-answer="${index}">
                        ${escapeHTML(answer)}
                    </button>
                `
            ).join("")}

        </div>

        <div id="lessonFeedback"
             style="margin-top:14px">
        </div>
    `;

    backdrop.classList.add(
        "active"
    );

    content
        .querySelectorAll(
            "[data-answer]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const answer =
                            Number(
                                button.dataset.answer
                            );

                        const feedback =
                            $("lessonFeedback");

                        if(
                            answer ===
                            lesson.correct
                        ){

                            state.academy[
                                lesson.id
                            ] = true;

                            storage.set(
                                "cryptoOnlineAcademyProgress",
                                state.academy
                            );

                            feedback.textContent =
                                "Correct. Lesson completed.";

                            feedback.style.color =
                                "var(--green)";

                            renderAcademy();

                        }else{

                            feedback.textContent =
                                "Not quite. Try again.";

                            feedback.style.color =
                                "var(--red)";
                        }

                    }
                );

            }
        );
}


function updateAcademyProgress(){

    const completed =
        academyLessons.filter(
            lesson =>
                state.academy[
                    lesson.id
                ]
        ).length;

    const total =
        academyLessons.length;

    const value =
        total
            ? completed / total * 100
            : 0;

    if($("academyProgressText")){
        $("academyProgressText").textContent =
            `${value.toFixed(0)}% complete`;
    }

    if($("academyProgressBar")){
        $("academyProgressBar").style.width =
            `${value}%`;
    }
}


/* =========================================================
   ADVANCED CHART
   ========================================================= */

async function loadAdvancedChart(){

    const canvas =
        $("advancedChart");

    const select =
        $("advancedChartCoin");

    if(
        !canvas ||
        !select ||
        typeof Chart === "undefined"
    ){
        return;
    }

    const coinId =
        select.value ||
        "bitcoin";

    const range =
        document
            .querySelector(
                ".chart-range.active"
            )
            ?.dataset
            .range ||
            "7";

    try{

        const data =
            await fetchJSON(
                `${API}/coins/${encodeURIComponent(coinId)}/market_chart` +
                `?vs_currency=usd&days=${range}`
            );

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

        const values =
            data.prices.map(
                item => item[1]
            );

        if(advancedChart){
            advancedChart.destroy();
        }

        advancedChart =
            new Chart(
                canvas,
                {
                    type:"line",

                    data:{
                        labels,

                        datasets:[
                            {
                                label:
                                    coinId,

                                data:values,

                                borderColor:
                                    "#2563eb",

                                backgroundColor:
                                    "rgba(37,99,235,.08)",

                                fill:true,

                                tension:.3,

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
                        }
                    }
                }
            );

    }catch(error){

        console.error(
            "Advanced chart error:",
            error
        );
    }
}


/* =========================================================
   COIN DETAIL
   ========================================================= */

async function openCoinDetail(
    id
){

    const coin =
        getCoin(id);

    if(!coin){
        return;
    }

    const container =
        $("coinDetails");

    if(!container){
        location.href =
            `markets.html?coin=${encodeURIComponent(id)}`;

        return;
    }

    container.innerHTML =
        `<div class="empty-state">
            <span>◈</span>
            <h3>Loading ${escapeHTML(coin.name)}</h3>
            <p>Fetching detailed market data...</p>
        </div>`;

    const section =
        $("coinDetailsSection");

    section?.scrollIntoView({
        behavior:"smooth"
    });

    try{

        const details =
            await fetchJSON(
                `${API}/coins/${encodeURIComponent(id)}` +
                `?localization=false` +
                `&tickers=false` +
                `&market_data=true` +
                `&community_data=false` +
                `&developer_data=false`
            );

        renderCoinDetail(
            details
        );

    }catch(error){

        console.error(
            "Coin detail error:",
            error
        );

        container.innerHTML =
            `<div class="empty-state">
                <span>!</span>
                <h3>Unable to load asset</h3>
                <p>
                    The coin detail request failed.
                </p>
            </div>`;
    }
}


function renderCoinDetail(
    coin
){

    const container =
        $("coinDetails");

    if(!container){
        return;
    }

    const market =
        coin.market_data ||
        {};

    const current =
        market.current_price?.usd;

    const change =
        market.price_change_percentage_24h;

    container.innerHTML = `

        <div class="coin-terminal-head">

            <div class="coin-identity">

                <img
                    src="${escapeHTML(
                        coin.image?.large ||
                        ""
                    )}"
                    alt="">

                <div>

                    <h2>
                        ${escapeHTML(
                            coin.name
                        )}
                    </h2>

                    <span>
                        ${escapeHTML(
                            coin.symbol?.toUpperCase() ||
                            ""
                        )}
                        · Rank #${coin.market_cap_rank || "--"}
                    </span>

                </div>

            </div>

            <div class="coin-terminal-price">

                <strong>
                    ${money(current)}
                </strong>

                <span class="${percentClass(change)}">
                    ${percent(change)}
                </span>

            </div>

        </div>


        <div class="coin-terminal-stats">

            <div class="coin-terminal-stat">
                <span>Market Cap</span>
                <strong>
                    ${compactMoney(
                        market.market_cap?.usd
                    )}
                </strong>
            </div>

            <div class="coin-terminal-stat">
                <span>24H Volume</span>
                <strong>
                    ${compactMoney(
                        market.total_volume?.usd
                    )}
                </strong>
            </div>

            <div class="coin-terminal-stat">
                <span>Circulating Supply</span>
                <strong>
                    ${compactNumber(
                        market.circulating_supply
                    )}
                </strong>
            </div>

            <div class="coin-terminal-stat">
                <span>Total Supply</span>
                <strong>
                    ${compactNumber(
                        market.total_supply
                    )}
                </strong>
            </div>

            <div class="coin-terminal-stat">
                <span>All Time High</span>
                <strong>
                    ${money(
                        market.ath?.usd
                    )}
                </strong>
            </div>

            <div class="coin-terminal-stat">
                <span>All Time Low</span>
                <strong>
                    ${money(
                        market.atl?.usd
                    )}
                </strong>
            </div>

            <div class="coin-terminal-stat">
                <span>7D Change</span>
                <strong class="${percentClass(
                    market.price_change_percentage_7d
                )}">
                    ${percent(
                        market.price_change_percentage_7d
                    )}
                </strong>
            </div>

            <div class="coin-terminal-stat">
                <span>30D Change</span>
                <strong class="${percentClass(
                    market.price_change_percentage_30d
                )}">
                    ${percent(
                        market.price_change_percentage_30d
                    )}
                </strong>
            </div>

        </div>


        <div class="coin-terminal-chart">

            <canvas id="coinDetailChart"></canvas>

        </div>


        <div style="
            display:flex;
            gap:8px;
            flex-wrap:wrap;
            margin-top:15px;
        ">

            <button
                class="button primary"
                data-detail-watch="${escapeHTML(
                    coin.id
                )}">
                ★ Watchlist
            </button>

            ${
                coin.links?.homepage?.[0]
                    ? `
                        <a
                            href="${safeURL(
                                coin.links.homepage[0]
                            )}"
                            target="_blank"
                            rel="noopener"
                            class="button secondary">
                            Official Website
                        </a>
                      `
                    : ""
            }

        </div>


        <div style="
            margin-top:20px;
            padding-top:18px;
            border-top:1px solid var(--border-light);
        ">

            <span class="eyebrow">
                ABOUT
            </span>

            <p style="
                margin-top:8px;
                color:var(--muted);
                font-size:11px;
            ">
                ${stripHTML(
                    coin.description?.en ||
                    "No description available."
                )}
            </p>

        </div>
    `;

    container
        .querySelector(
            "[data-detail-watch]"
        )
        ?.addEventListener(
            "click",
            () => {

                toggleWatchlist(
                    coin.id
                );

            }
        );

    loadCoinDetailChart(
        coin.id
    );
}


function stripHTML(
    text
){

    const div =
        document.createElement(
            "div"
        );

    div.innerHTML =
        text;

    return div.textContent ||
        div.innerText ||
        "";
}


async function loadCoinDetailChart(
    id
){

    const canvas =
        $("coinDetailChart");

    if(
        !canvas ||
        typeof Chart === "undefined"
    ){
        return;
    }

    try{

        const data =
            await fetchJSON(
                `${API}/coins/${encodeURIComponent(id)}/market_chart` +
                `?vs_currency=usd&days=30`
            );

        new Chart(
            canvas,
            {
                type:"line",

                data:{
                    labels:
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
                        ),

                    datasets:[
                        {
                            data:
                                data.prices.map(
                                    item =>
                                        item[1]
                                ),

                            borderColor:
                                "#2563eb",

                            backgroundColor:
                                "rgba(37,99,235,.08)",

                            fill:true,
                            tension:.3,
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
                    }
                }
            }
        );

    }catch(error){

        console.error(
            "Coin detail chart error:",
            error
        );
    }
}
/* =========================================================
   CATEGORY / ON-CHAIN
   ========================================================= */

async function loadCategories(){

    const table =
        $("categoryTable");

    if(!table){
        return;
    }

    try{

        const data =
            await fetchJSON(
                `${API}/coins/categories?order=market_cap_desc`
            );

        state.categories =
            Array.isArray(data)
                ? data
                : [];

        renderCategories();

    }catch(error){

        console.error(
            "Category error:",
            error
        );
    }
}


function renderCategories(){

    const table =
        $("categoryTable");

    if(!table){
        return;
    }

    const search =
        $("categorySearch")
            ?.value
            .trim()
            .toLowerCase() ||
            "";

    const categories =
        state.categories
            .filter(
                item =>
                    !search ||
                    item.name
                        .toLowerCase()
                        .includes(search)
            )
            .slice(0,50);

    table.innerHTML =
        categories.map(
            (item,index) => `
                <tr>

                    <td>
                        #${index + 1}
                    </td>

                    <td>
                        <strong>
                            ${escapeHTML(item.name)}
                        </strong>
                    </td>

                    <td>
                        ${compactMoney(
                            item.market_cap
                        )}
                    </td>

                    <td class="${percentClass(
                        item.market_cap_change_24h
                    )}">
                        ${percent(
                            item.market_cap_change_24h
                        )}
                    </td>

                    <td>
                        ${item.coins_count || "--"}
                    </td>

                </tr>
            `
        )
        .join("");
}


async function loadOnChain(){

    if(!$("blockHeight") &&
       !$("largeTransactions")){

        return;
    }

    try{

        const [
            blocks,
            mempool,
            fees,
            recent
        ] =
            await Promise.all([
                fetchJSON(
                    `${MEMPOOL_API}/blocks`
                ),
                fetchJSON(
                    `${MEMPOOL_API}/mempool`
                ),
                fetchJSON(
                    `${MEMPOOL_API}/v1/fees/recommended`
                ),
                fetchJSON(
                    `${MEMPOOL_API}/mempool/recent`
                )
            ]);

        if($("blockHeight")){
            $("blockHeight").textContent =
                blocks?.[0]?.height || "--";
        }

        if($("mempoolCount")){
            $("mempoolCount").textContent =
                mempool?.count?.toLocaleString() ||
                "--";
        }

        if($("recommendedFee")){
            $("recommendedFee").textContent =
                fees?.fastestFee
                    ? `${fees.fastestFee} sat/vB`
                    : "--";
        }

        const large =
            (recent || [])
                .filter(
                    tx =>
                        Number(
                            tx.value || 0
                        ) / 100000000 >= 10
                );

        if($("largeTxCount")){
            $("largeTxCount").textContent =
                large.length;
        }

        if($("terminalWhales")){
            $("terminalWhales").textContent =
                large.length;
        }

        renderLargeTransactions(
            large
        );

    }catch(error){

        console.error(
            "On-chain error:",
            error
        );
    }
}


function renderLargeTransactions(
    transactions
){

    const table =
        $("largeTransactions");

    if(!table){
        return;
    }

    if(!transactions.length){

        table.innerHTML =
            `<tr>
                <td colspan="4"
                    class="table-loading">
                    No large recent transactions found.
                </td>
             </tr>`;

        return;
    }

    const btc =
        getCoin("bitcoin");

    const btcPrice =
        btc?.current_price || 0;

    table.innerHTML =
        transactions
            .slice(0,15)
            .map(
                tx => {

                    const amount =
                        Number(tx.value || 0) /
                        100000000;

                    return `
                        <tr>

                            <td>
                                ${new Date(
                                    Number(
                                        tx.time || Date.now() / 1000
                                    ) * 1000
                                ).toLocaleTimeString()}
                            </td>

                            <td>
                                ${amount.toFixed(3)} BTC
                            </td>

                            <td>
                                ${compactMoney(
                                    amount *
                                    btcPrice
                                )}
                            </td>

                            <td>
                                <a
                                    href="https://mempool.space/tx/${encodeURIComponent(tx.txid || "")}"
                                    target="_blank"
                                    rel="noopener"
                                    class="text-link">
                                    View transaction →
                                </a>
                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   EVENTS
   ========================================================= */

function setupEvents(){

    $("addPortfolioAsset")
        ?.addEventListener(
            "click",
            addPortfolioAsset
        );

    $("addAlert")
        ?.addEventListener(
            "click",
            addAlert
        );

    $("aiSend")
        ?.addEventListener(
            "click",
            sendAI
        );

    $("aiInput")
        ?.addEventListener(
            "keydown",
            event => {

                if(
                    event.key === "Enter"
                ){
                    sendAI();
                }

            }
        );

    document
        .querySelectorAll(
            "[data-ai-prompt]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const input =
                            $("aiInput");

                        if(input){

                            input.value =
                                button.dataset.aiPrompt;

                            sendAI();
                        }

                    }
                );

            }
        );

    $("refreshMarket")
        ?.addEventListener(
            "click",
            refreshEverything
        );

    $("refreshNews")
        ?.addEventListener(
            "click",
            async () => {

                await loadNews();

                showToast(
                    "News refreshed."
                );

            }
        );

    $("refreshOnChain")
        ?.addEventListener(
            "click",
            async () => {

                await loadOnChain();

                showToast(
                    "Blockchain data refreshed."
                );

            }
        );

    $("categorySearch")
        ?.addEventListener(
            "input",
            renderCategories
        );

    $("newsSearch")
        ?.addEventListener(
            "input",
            renderNews
        );

    document
        .querySelectorAll(
            ".news-tab"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".news-tab"
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

                        renderNews();
                    }
                );

            }
        );

    document
        .querySelectorAll(
            ".academy-filter"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".academy-filter"
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

                        renderAcademy();
                    }
                );

            }
        );

    $("closeAcademy")
        ?.addEventListener(
            "click",
            () => {

                $("academyModal")
                    ?.classList.remove(
                        "active"
                    );

            }
        );

    $("academyModal")
        ?.addEventListener(
            "click",
            event => {

                if(
                    event.target ===
                    $("academyModal")
                ){

                    $("academyModal")
                        .classList.remove(
                            "active"
                        );

                }

            }
        );

    $("compareButton")
        ?.addEventListener(
            "click",
            compareCoins
        );

    $("advancedChartCoin")
        ?.addEventListener(
            "change",
            loadAdvancedChart
        );

    document
        .querySelectorAll(
            ".chart-range"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".chart-range"
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

                        loadAdvancedChart();
                    }
                );

            }
        );

    $("exportTransactions")
        ?.addEventListener(
            "click",
            exportTransactions
        );

    $("addTransaction")
        ?.addEventListener(
            "click",
            addTransaction
        );

    setupExplorer();
}


async function compareCoins(){

    const ids = [
        $("compareCoin1")?.value,
        $("compareCoin2")?.value,
        $("compareCoin3")?.value
    ]
    .filter(Boolean);

    if(ids.length < 2){

        showToast(
            "Select at least two assets."
        );

        return;
    }

    const container =
        $("compareResults");

    if(!container){
        return;
    }

    const coins =
        ids
            .map(getCoin)
            .filter(Boolean);

    container.innerHTML =
        `<div class="compare-cards">
            ${coins.map(
                coin => `
                    <article class="compare-card">

                        <div class="compare-card-header">

                            <img
                                src="${escapeHTML(coin.image)}"
                                alt="">

                            <div>
                                <h3>
                                    ${escapeHTML(coin.name)}
                                </h3>
                                <small>
                                    ${escapeHTML(
                                        coin.symbol.toUpperCase()
                                    )}
                                </small>
                            </div>

                        </div>

                        <div class="compare-price">
                            ${money(coin.current_price)}
                        </div>

                        <div class="compare-metrics">

                            <div>
                                <span>24H</span>
                                <strong class="${percentClass(
                                    coin.price_change_percentage_24h
                                )}">
                                    ${percent(
                                        coin.price_change_percentage_24h
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Market Cap</span>
                                <strong>
                                    ${compactMoney(
                                        coin.market_cap
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Volume</span>
                                <strong>
                                    ${compactMoney(
                                        coin.total_volume
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Rank</span>
                                <strong>
                                    #${coin.market_cap_rank || "--"}
                                </strong>
                            </div>

                        </div>

                    </article>
                `
            ).join("")}
        </div>`;

}


/* =========================================================
   TRANSACTIONS
   ========================================================= */

function addTransaction(){

    const coinId =
        $("transactionCoin")?.value;

    const type =
        $("transactionType")?.value;

    const quantity =
        Number(
            $("transactionQuantity")?.value
        );

    const price =
        Number(
            $("transactionPrice")?.value
        );

    const fee =
        Number(
            $("transactionFee")?.value
        ) || 0;

    const date =
        $("transactionDate")?.value ||
        new Date()
            .toISOString()
            .slice(0,10);

    if(
        !coinId ||
        quantity <= 0 ||
        price < 0
    ){

        showToast(
            "Enter valid transaction data."
        );

        return;
    }

    state.transactions.push({

        id:Date.now(),

        coinId,

        type,

        quantity,

        price,

        fee,

        date

    });

    storage.set(
        "cryptoOnlineTransactions",
        state.transactions
    );

    renderTransactions();

    showToast(
        "Transaction recorded."
    );
}


function renderTransactions(){

    const table =
        $("transactionTable");

    if(!table){
        return;
    }

    if(!state.transactions.length){

        table.innerHTML =
            `<tr>
                <td colspan="8"
                    class="table-loading">
                    No transactions recorded.
                </td>
             </tr>`;

        return;
    }

    let buys = 0;
    let sells = 0;
    let fees = 0;

    table.innerHTML =
        state.transactions
            .slice()
            .reverse()
            .map(
                tx => {

                    const coin =
                        getCoin(
                            tx.coinId
                        );

                    const total =
                        tx.quantity *
                        tx.price;

                    if(tx.type === "buy"){
                        buys += total;
                    }else{
                        sells += total;
                    }

                    fees +=
                        tx.fee;

                    return `
                        <tr>

                            <td>
                                ${escapeHTML(tx.date)}
                            </td>

                            <td>
                                ${escapeHTML(
                                    coin?.symbol?.toUpperCase() ||
                                    tx.coinId
                                )}
                            </td>

                            <td class="${tx.type === "buy" ? "positive" : "negative"}">
                                ${tx.type.toUpperCase()}
                            </td>

                            <td>
                                ${tx.quantity}
                            </td>

                            <td>
                                ${money(tx.price)}
                            </td>

                            <td>
                                ${money(tx.fee)}
                            </td>

                            <td>
                                ${money(total)}
                            </td>

                            <td>
                                <button
                                    class="button danger small"
                                    data-delete-transaction="${tx.id}">
                                    Delete
                                </button>
                            </td>

                        </tr>
                    `;
                }
            )
            .join("");

    if($("ledgerBuys")){
        $("ledgerBuys").textContent =
            money(buys);
    }

    if($("ledgerSells")){
        $("ledgerSells").textContent =
            money(sells);
    }

    if($("ledgerFees")){
        $("ledgerFees").textContent =
            money(fees);
    }

    if($("ledgerRealized")){
        $("ledgerRealized").textContent =
            "Not tracked";
    }

    table
        .querySelectorAll(
            "[data-delete-transaction]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        state.transactions =
                            state.transactions.filter(
                                tx =>
                                    tx.id !==
                                    Number(
                                        button.dataset.deleteTransaction
                                    )
                            );

                        storage.set(
                            "cryptoOnlineTransactions",
                            state.transactions
                        );

                        renderTransactions();

                    }
                );

            }
        );
}


function exportTransactions(){

    if(!state.transactions.length){

        showToast(
            "There are no transactions to export."
        );

        return;
    }

    const rows = [
        [
            "Date",
            "Asset",
            "Type",
            "Quantity",
            "Price",
            "Fee"
        ]
    ];

    state.transactions.forEach(
        tx => {

            rows.push([
                tx.date,
                tx.coinId,
                tx.type,
                tx.quantity,
                tx.price,
                tx.fee
            ]);

        }
    );

    const csv =
        rows
            .map(
                row =>
                    row
                        .map(
                            value =>
                                `"${String(value)
                                    .replaceAll('"','""')}"`
                        )
                        .join(",")
            )
            .join("\n");

    const blob =
        new Blob(
            [csv],
            {
                type:"text/csv"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href =
        url;

    link.download =
        "crypto-online-transactions.csv";

    link.click();

    URL.revokeObjectURL(
        url
    );
}


/* =========================================================
   GLOBAL SEARCH
   ========================================================= */

function setupGlobalSearch(){

    const input =
        $("globalSearch");

    const results =
        $("globalSearchResults");

    if(!input || !results){
        return;
    }

    input.addEventListener(
        "input",
        () => {

            const query =
                input.value
                    .trim()
                    .toLowerCase();

            if(!query){

                results.innerHTML =
                    "";

                return;
            }

            const matches =
                state.coins
                    .filter(
                        coin =>
                            coin.name
                                .toLowerCase()
                                .includes(query) ||
                            coin.symbol
                                .toLowerCase()
                                .includes(query)
                    )
                    .slice(0,7);

            results.innerHTML =
                matches.map(
                    coin => `
                        <button
                            class="search-result"
                            data-search-coin="${escapeHTML(
                                coin.id
                            )}">

                            <img
                                src="${escapeHTML(coin.image)}"
                                alt="">

                            <span>
                                ${escapeHTML(coin.name)}
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

            results
                .querySelectorAll(
                    "[data-search-coin]"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            () => {

                                location.href =
                                    `markets.html?coin=${encodeURIComponent(
                                        button.dataset.searchCoin
                                    )}`;

                            }
                        );

                    }
                );

        }
    );
}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

function renderPageData(){

    renderGlobal();
    renderFearGreed();
    renderDashboard();
    renderExplorer();
    renderWatchlist();
    renderPortfolio();
    renderAlerts();
    renderTransactions();
    renderCategories();
    renderNews();
}


async function refreshEverything(){

    showToast(
        "Refreshing market data..."
    );

    await Promise.allSettled([
        loadGlobal(),
        loadCoins(),
        loadFearGreed()
    ]);

    await Promise.allSettled([
        loadNews(),
        loadCategories(),
        loadOnChain(),
        loadBitcoinChart(),
        loadAdvancedChart()
    ]);

    renderPageData();

    showToast(
        "Market data refreshed."
    );
}


async function initialize(){

    setupMobile();
    setupGlobalSearch();
    setupEvents();
    setupTools();

    await Promise.allSettled([
        loadGlobal(),
        loadCoins(),
        loadFearGreed()
    ]);

    populateAssetSelects();

    renderPageData();

    await Promise.allSettled([
        loadBitcoinChart(),
        loadAdvancedChart(),
        loadNews(),
        loadCategories(),
        loadOnChain()
    ]);

    renderAcademy();

    /* URL coin opening */
    const params =
        new URLSearchParams(
            location.search
        );

    const requestedCoin =
        params.get("coin");

    if(
        requestedCoin &&
        $("coinDetails")
    ){

        await openCoinDetail(
            requestedCoin
        );
    }

    console.log(
        "Crypto Online new interface initialized."
    );
}


/* =========================================================
   AUTO REFRESH
   ========================================================= */

setInterval(
    async () => {

        await Promise.allSettled([
            loadGlobal(),
            loadCoins(),
            loadFearGreed()
        ]);

        populateAssetSelects();
        renderPageData();

    },
    60000
);


setInterval(
    loadNews,
    600000
);


setInterval(
    loadOnChain,
    120000
);


setInterval(
    loadAdvancedChart,
    300000
);


/* =========================================================
   START
   ========================================================= */

if(
    document.readyState ===
    "loading"
){

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );

}else{

    initialize();

}
