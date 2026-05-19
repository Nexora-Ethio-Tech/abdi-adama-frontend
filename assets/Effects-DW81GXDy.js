import{t as e}from"./jsx-runtime-DdD5Lxcm.js";var t=e(),n=()=>{let e=[`#5f91ff`,`#ff5f91`,`#91ff5f`,`#ffda5f`,`#ffffff`],n=3+Math.floor(Math.random()*4);return(0,t.jsxs)(`div`,{className:`fixed inset-0 overflow-hidden pointer-events-none z-0`,children:[(0,t.jsx)(`div`,{className:`shooting-stars-container w-full h-full`,children:[...Array(n)].map((n,r)=>{let i=e[Math.floor(Math.random()*e.length)],a=Math.random()*100,o=Math.random()*100,s=Math.random()*360,c=3+Math.random()*12,l=Math.random()*25,u=800+Math.random()*2e3,d=1+Math.random()*2;return(0,t.jsx)(`div`,{className:`shooting-star`,style:{top:`${o}vh`,left:`${a}vw`,height:`${d}px`,background:`linear-gradient(90deg, ${i}, transparent)`,filter:`drop-shadow(0 0 15px ${i})`,transform:`rotate(${s}deg)`,animationDelay:`${l}s`,animationDuration:`${c}s`,"--travel-dist":`${u}px`,"--star-color":i,opacity:.1+Math.random()*.5}},r)})}),(0,t.jsx)(`style`,{children:`
        .shooting-star {
          position: absolute;
          width: 0;
          border-radius: 999px;
          animation: fly-across var(--animation-duration, 5s) linear infinite;
        }
        @keyframes fly-across {
          0% {
            width: 0;
            transform: rotate(inherit) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
            width: 150px;
          }
          90% {
            opacity: 1;
            width: 150px;
          }
          100% {
            width: 0;
            transform: rotate(inherit) translateX(var(--travel-dist, 1000px));
            opacity: 0;
          }
        }
        .shooting-star::before {
          content: '';
          position: absolute;
          top: 50%;
          right: 0;
          transform: translateY(-50%);
          width: 4px;
          height: 4px;
          background: var(--star-color);
          border-radius: 50%;
          box-shadow: 0 0 15px 2px var(--star-color);
        }
      `})]})};export{n as t};