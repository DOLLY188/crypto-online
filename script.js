let btcChart=null;
const API="https://api.coingecko.com/api/v3";

async function loadMarket(){
 try{
  const r=await fetch(`${API}/global`);
  const d=await r.json();
  const m=d.data;

  const stats=document.querySelectorAll(".stat-value");

  stats[0].textContent="$"+(m.total_market_cap.usd/1e12).toFixed(2)+"T";
  stats[1].textContent="$"+(m.total_volume.usd/1e9).toFixed(1)+"B";
  stats[2].textContent=m.market_cap_percentage.btc.toFixed(1)+"%";
  stats[3].textContent=m.market_cap_percentage.eth.toFixed(1)+"%";

  loadCoins();
  loadTrending();

 }catch(e){
  console.log("Market data error:",e);
 }
}


async function loadCoins(){

 try{

  const r=await fetch(
   `${API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`
  );

  const coins=await r.json();

  const btc=coins[0];

  document.querySelector(".chart-price strong").textContent=
   "$"+btc.current_price.toLocaleString();

  document.querySelector(".chart-price span").textContent=
   btc.price_change_percentage_24h.toFixed(2)+"%";

  document.querySelector(".asset-title h3").textContent=
   btc.name;

  document.querySelector(".asset-title span").textContent=
   btc.symbol.toUpperCase();


  const valid=coins.filter(c=>
   c.price_change_percentage_24h!==null
  );

  const gainers=[...valid]
   .sort((a,b)=>b.price_change_percentage_24h-a.price_change_percentage_24h)
   .slice(0,3);

  const losers=[...valid]
   .sort((a,b)=>a.price_change_percentage_24h-b.price_change_percentage_24h)
   .slice(0,3);


  updateList(".movers-grid .panel:nth-child(1)",gainers,true);

  updateList(".movers-grid .panel:nth-child(2)",losers,false);

 }catch(e){

  console.log("Coin data error:",e);

 }

}


async function loadTrending(){

 try{

  const r=await fetch(`${API}/search/trending`);
  const d=await r.json();

  const trending=d.coins.slice(0,3).map(x=>x.item);

  const panel=document.querySelector(
   ".movers-grid .panel:nth-child(3)"
  );

  const rows=panel.querySelectorAll(".asset-row");

  trending.forEach((coin,i)=>{

   if(!rows[i]) return;

   rows[i].querySelector(".coin-logo").innerHTML=
    `<img src="${coin.small}" width="35" height="35">`;

   rows[i].querySelector(".asset-info strong").textContent=
    coin.name;

   rows[i].querySelector(".asset-info span").textContent=
    coin.symbol.toUpperCase();

   rows[i].querySelector(".asset-value strong").textContent=
    "Rank #"+coin.market_cap_rank;

   rows[i].querySelector(".asset-value span").textContent=
    "Trending";

  });

 }catch(e){

  console.log("Trending error:",e);

 }

}


function updateList(selector,coins,positive){

 const panel=document.querySelector(selector);

 const rows=panel.querySelectorAll(".asset-row");

 coins.forEach((coin,i)=>{

  if(!rows[i]) return;

  rows[i].querySelector(".coin-logo").innerHTML=
   `<img src="${coin.image}" width="35" height="35">`;

  rows[i].querySelector(".asset-info strong").textContent=
   coin.name;

  rows[i].querySelector(".asset-info span").textContent=
   coin.symbol.toUpperCase();

  rows[i].querySelector(".asset-value strong").textContent=
   "$"+coin.current_price.toLocaleString();

  const change=coin.price_change_percentage_24h;

  const changeElement=
   rows[i].querySelector(".asset-value span");

  changeElement.textContent=
   (change>=0?"+":"")+change.toFixed(2)+"%";

  changeElement.className=
   positive?"positive":"negative";
  async function loadBitcoinChart(){

 try{

  const r=await fetch(
   `${API}/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=hourly`
  );

  const data=await r.json();

  const prices=data.prices;

  const labels=prices.map(p=>{
   const date=new Date(p[0]);
   return date.toLocaleDateString([],{
    month:"short",
    day:"numeric"
   });
  });

  const values=prices.map(p=>p[1]);

  const canvas=document.getElementById("btcChart");

  if(!canvas) return;

  const ctx=canvas.getContext("2d");

  if(btcChart){
   btcChart.destroy();
  }

  btcChart=new Chart(ctx,{
   type:"line",

   data:{
    labels:labels,

    datasets:[{
     label:"Bitcoin Price",
     data:values,

     borderWidth:2,
     pointRadius:0,
     tension:0.35,

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
     },

     tooltip:{
      callbacks:{
       label:function(context){
        return "$"+context.parsed.y.toLocaleString();
       }
      }
     }
    },

    scales:{
     x:{
      display:false
     },

     y:{
      ticks:{
       callback:function(value){
        return "$"+Number(value).toLocaleString();
       }
      }
     }
    }
   }
  });

 }catch(e){

  console.log("Bitcoin chart error:",e);

 }

}

 });

}


loadMarket();

setInterval(loadMarket,60000);
