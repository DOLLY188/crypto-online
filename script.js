const API="https://api.coingecko.com/api/v3";

async function loadMarket(){
 try{
  const r=await fetch(`${API}/global`);
  const d=await r.json();
  const m=d.data;

  document.querySelectorAll(".stat-value")[0].textContent="$"+(m.total_market_cap.usd/1e12).toFixed(2)+"T";
  document.querySelectorAll(".stat-value")[1].textContent="$"+(m.total_volume.usd/1e9).toFixed(1)+"B";
  document.querySelectorAll(".stat-value")[2].textContent=m.market_cap_percentage.btc.toFixed(1)+"%";
  document.querySelectorAll(".stat-value")[3].textContent=m.market_cap_percentage.eth.toFixed(1)+"%";

  loadCoins();
 }catch(e){console.log("Market data error:",e)}
}

async function loadCoins(){
 const r=await fetch(`${API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false`);
 const coins=await r.json();

 const btc=coins[0];
 document.querySelector(".chart-price strong").textContent="$"+btc.current_price.toLocaleString();
 document.querySelector(".chart-price span").textContent=btc.price_change_percentage_24h.toFixed(2)+"%";
 document.querySelector(".asset-title h3").textContent=btc.name;
 document.querySelector(".asset-title span").textContent=btc.symbol.toUpperCase();

 console.log("Crypto Online market data loaded",coins);
}

loadMarket();
setInterval(loadMarket,60000);
