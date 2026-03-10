interface BookConfig {
  spineDepth: number;
  pageBulge: number;
  indent: number;
  marginH: number;
  marginV: number;
  showShadow: boolean;
  [key: string]: number | boolean; // Index Signature für dynamischen Zugriff
}

const config: BookConfig = {
  spineDepth: 20,
  pageBulge: 40,
  indent: 80,
  marginH: 40,
  marginV: 60,
  showShadow: false
};

const textContent: string = "Der horizontale Seitenrand (Margin X) wirkt nun symmetrisch auf beiden Seiten. Er definiert den Abstand sowohl zum äußeren Buchrand als auch zur inneren Falz. Dadurch bleibt der Textblock zentriert auf der jeweiligen Buchseite, unabhängig davon, wie tief die Falz ist oder wie stark sich das Papier wölbt. Dies entspricht dem Standard-Layout eines professionell gesetzten Buches.";

const NS = "http://www.w3.org/2000/svg";

function updateBook(): void {
  const pathDefs = document.querySelector<SVGGraphicsElement>("#path-defs");
  const textContainer = document.querySelector<SVGGraphicsElement>("#text-container");
  const pageL = document.querySelector<SVGPathElement>("#page-left");
  const pageR = document.querySelector<SVGPathElement>("#page-right");
  const spineShadow = document.querySelector<SVGRectElement>("#spine-rect");

  if (!pathDefs || !textContainer || !pageL || !pageR || !spineShadow) {
    console.error("SVG Elemente nicht gefunden.");
    return;
  }

  pathDefs.innerHTML = "";
  textContainer.innerHTML = "";
  spineShadow.style.display = config.showShadow ? "block" : "none";

  const midX = 450;
  const topY = 50;
  const bottomY = 550;
  const outerL = 50;
  const outerR = 850;

  // Seiten-Hintergrund
  pageL.setAttribute("d", `M ${outerL},${topY} C ${outerL + config.indent},${topY} ${midX - 100},${topY - config.pageBulge} ${midX},${topY + config.spineDepth} L ${midX},${bottomY + config.spineDepth} C ${midX - 100},${bottomY - config.pageBulge} ${outerL + config.indent},${bottomY} ${outerL},${bottomY} Z`);
  pageR.setAttribute("d", `M ${midX},${topY + config.spineDepth} C ${midX + 100},${topY - config.pageBulge} ${outerR - config.indent},${topY} ${outerR},${topY} L ${outerR},${bottomY} C ${outerR - config.indent},${bottomY} ${midX + 100},${bottomY - config.pageBulge} ${midX},${bottomY + config.spineDepth} Z`);

  const pageWidth = midX - outerL;
  const availableTextWidth = pageWidth - config.marginH * 2;
  const charLimit = Math.max(5, Math.floor(availableTextWidth / 7.5));

  const sides: ("left" | "right")[] = ["left", "right"];

  for (const side of sides) {
    const lines = splitText(textContent, charLimit);
    lines.forEach((line, i) => {
      const y = topY + config.marginV + i * 22;
      if (y > bottomY - 20) return;

      const id = `p-${side}-${i}`;
      const p = document.createElementNS(NS, "path");
      p.setAttribute("id", id);
      p.setAttribute("fill", "none");

      let startX: number, endX: number;
      if (side === "left") {
        startX = outerL + config.marginH;
        endX = midX - config.marginH;
        p.setAttribute("d", `M ${startX},${y} C ${startX + config.indent * 0.5},${y} ${midX - 80},${y - config.pageBulge} ${endX},${y + config.spineDepth * 0.8}`);
      } else {
        startX = midX + config.marginH;
        endX = outerR - config.marginH;
        p.setAttribute("d", `M ${startX},${y + config.spineDepth * 0.8} C ${midX + 80},${y - config.pageBulge} ${endX - config.indent * 0.5},${y} ${endX},${y}`);
      }

      pathDefs.appendChild(p);
      const t = document.createElementNS(NS, "text");
      const tp = document.createElementNS(NS, "textPath");
      tp.setAttribute("href", "#" + id);
      tp.textContent = line;
      t.appendChild(tp);
      textContainer.appendChild(t);
    });
  }
}

function splitText(text: string, len: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let curr = "";
  words.forEach((w) => {
    if ((curr + w).length > len) {
      lines.push(curr.trim());
      curr = w + " ";
    } else curr += w + " ";
  });
  lines.push(curr.trim());
  return lines;
}

// Event-Binding
["spineDepth", "pageBulge", "indent", "marginH", "marginV"].forEach((id) => {
  const el = document.getElementById(id) as HTMLInputElement | null;
  el?.addEventListener("input", (e: Event) => {
    const target = e.target as HTMLInputElement;
    config[id] = parseInt(target.value);
    updateBook();
  });
});

document.getElementById("showShadow")?.addEventListener("change", (e: Event) => {
  const target = e.target as HTMLInputElement;
  config.showShadow = target.checked;
  updateBook();
});

updateBook();
