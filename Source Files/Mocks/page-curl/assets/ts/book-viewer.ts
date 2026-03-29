interface BookConfig {
  spineDepth: number;
  pageBulge: number;
  indent: number;
  marginH: number;
  marginV: number;
  showShadow: boolean;
  width: number;
  height: number;
  noise: number;
  [key: string]: number | boolean;
}

export class BookViewer extends HTMLElement {
  private shadow: ShadowRoot;
  private config: BookConfig;
  private _markdown: string = "";
  private readonly NS = "http://www.w3.org/2000/svg";
  private resizeObserver: ResizeObserver;

  static get observedAttributes() {
    return ["spine-depth", "page-bulge", "indent", "margin-h", "margin-v", "show-shadow", "text-content", "fit", "width", "height", "noise"];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });

    // Default configuration
    this.config = {
      spineDepth: 20,
      pageBulge: 40,
      indent: 80,
      marginH: 40,
      marginV: 60,
      showShadow: false,
      width: 0,
      height: 0,
      noise: 0
    };
    this.resizeObserver = new ResizeObserver(() => {
      this.updateBook();
    });
  }

  connectedCallback() {
    this.render();
    // Kurze Verzögerung, damit der Parser den Inhalt zwischen den Tags verarbeiten kann
    setTimeout(() => {
      this.updateFromAttributes();
      this.updateBook();
    }, 0);
    this.resizeObserver.observe(this);
  }

  disconnectedCallback() {
    this.resizeObserver.unobserve(this);
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    this.updateFromAttributes();
    if (this.shadow.childElementCount > 0) {
      this.updateBook();
    }
  }

  private updateFromAttributes() {
    this.config.spineDepth = parseInt(this.getAttribute("spine-depth") || `${this.config.spineDepth}`, 10);
    this.config.pageBulge = parseInt(this.getAttribute("page-bulge") || `${this.config.pageBulge}`, 10);
    this.config.indent = parseInt(this.getAttribute("indent") || `${this.config.indent}`, 10);
    this.config.marginH = parseInt(this.getAttribute("margin-h") || `${this.config.marginH}`, 10);
    this.config.marginV = parseInt(this.getAttribute("margin-v") || `${this.config.marginV}`, 10);
    this.config.showShadow = this.hasAttribute("show-shadow");
    this.config.width = parseInt(this.getAttribute("width") || "0", 10);
    this.config.height = parseInt(this.getAttribute("height") || "0", 10);
    this.config.noise = parseFloat(this.getAttribute("noise") || "0");

    const attrText = this.getAttribute("text-content");
    let rawContent = attrText || (super.textContent || this.innerText || "").trim();

    // Frontmatter (--- ... ---) entfernen, falls vorhanden
    if (rawContent.startsWith('---')) {
      const parts = rawContent.split('---');
      if (parts.length >= 3) {
        rawContent = parts.slice(2).join('---').trim();
      }
    }
    this._markdown = rawContent;
  }

  private render() {
    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          aspect-ratio: var(--viewbox-width, 900) / var(--viewbox-height, 600);
          max-width: 100%;
          max-height: 100%;
          /* Default Theming Variables */
          --page-background: white;
          --page-stack-background: #e5e5e5;
          --page-border: #555555;
          --text-color: #333;
          --spine-shadow-color: rgba(0, 0, 0, 0.2);
          --spine-line-color: #555555;
          --link-color: #0066cc;
        }
        :host([fit]) {
          aspect-ratio: auto;
          width: 100%;
          height: 100%;
        }
        svg {
          display: block;
          width: 100%;
          height: 100%;
        }
        #page-left, #page-right {
          fill: var(--page-background);
          stroke: var(--page-border);
          stroke-width: 1;
        }
        .page-stack {
          fill: var(--page-stack-background);
          stroke: var(--page-border);
          stroke-width: 1;
        }
        svg.has-noise #page-left, svg.has-noise #page-right {
          filter: url(#paper-noise);
        }
        #spine-line {
          stroke: var(--spine-line-color);
          stroke-width: 1;
        }
        #spine-rect {
          fill: url(#spine-gradient);
        }
        #text-container > text {
          fill: var(--text-color);
          font-family: inherit;
        }
      </style>
      <svg preserveAspectRatio="xMidYMid meet" part="svg">
        <defs>
          <linearGradient id="spine-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:var(--spine-shadow-color)" />
            <stop offset="50%" style="stop-color:rgba(0,0,0,0)" />
            <stop offset="100%" style="stop-color:var(--spine-shadow-color)" />
          </linearGradient>
          <filter id="paper-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="3" seed="15" result="noise"/>
            <!-- Erzeugt harte, größere Flecken durch Verschiebung der Schwellenwerte -->
            <feComponentTransfer in="noise" result="thresholded">
              <feFuncR type="discrete" tableValues="1 1 1 1 0" />
              <feFuncG type="discrete" tableValues="1 1 1 1 0" />
              <feFuncB type="discrete" tableValues="1 1 1 1 0" />
            </feComponentTransfer>
            <feColorMatrix id="noise-matrix" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0" result="texturedNoise"/>
            <feComposite in="texturedNoise" in2="SourceGraphic" operator="in" result="clippedNoise"/>
            <feBlend in="SourceGraphic" in2="clippedNoise" mode="multiply"/>            
          </filter>
          <g id="path-defs"></g>
        </defs>
        <rect id="spine-rect" style="display: none;" part="spine"/>
        <path id="page-left-s2" class="page-stack" part="page page-stack"></path>
        <path id="page-left-s1" class="page-stack" part="page page-stack"></path>
        <path id="page-left" d="" part="page page-left"></path>
        <path id="page-right-s2" class="page-stack" part="page page-stack"></path>
        <path id="page-right-s1" class="page-stack" part="page page-stack"></path>
        <path id="page-right" d="" part="page page-right"></path>
        <line id="spine-line" part="spine-line" />
        <g id="text-container" part="text-container"></g>
      </svg>
    `;
  }

  private updateBook(): void {
    const svg = this.shadow.querySelector<SVGSVGElement>("svg");
    const pathDefs = this.shadow.querySelector<SVGGraphicsElement>("#path-defs");
    const textContainer = this.shadow.querySelector<SVGGraphicsElement>("#text-container");
    const pageL = this.shadow.querySelector<SVGPathElement>("#page-left");
    const pageR = this.shadow.querySelector<SVGPathElement>("#page-right");
    const pageLS1 = this.shadow.querySelector<SVGPathElement>("#page-left-s1");
    const pageLS2 = this.shadow.querySelector<SVGPathElement>("#page-left-s2");
    const pageRS1 = this.shadow.querySelector<SVGPathElement>("#page-right-s1");
    const pageRS2 = this.shadow.querySelector<SVGPathElement>("#page-right-s2");
    const spineShadow = this.shadow.querySelector<SVGRectElement>("#spine-rect");
    const spineLine = this.shadow.querySelector<SVGLineElement>("#spine-line");
    const noiseMatrix = this.shadow.querySelector<SVGColorMatrixElement>("#noise-matrix");

    if (!svg || !pathDefs || !textContainer || !pageL || !pageR || !pageLS1 || !pageLS2 || !pageRS1 || !pageRS2 || !spineShadow || !spineLine || !noiseMatrix) {
      console.error("SVG Elemente nicht gefunden.");
      return;
    }

    if (this.config.noise > 0) {
      // Mappt den invertierten Rot-Kanal auf Alpha, um schwarze Körnung zu erzeugen
      const n = this.config.noise;
      noiseMatrix.setAttribute("values", `0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${-n} 0 0 0 ${n}`);
      svg.classList.add('has-noise');
    } else {
      svg.classList.remove('has-noise');
    }

    pathDefs.innerHTML = "";
    textContainer.innerHTML = "";

    // Get the actual rendered dimensions of the component in pixels.
    const { width: componentWidthPx, height: componentHeightPx } = this.getBoundingClientRect();
    if (componentWidthPx === 0 || componentHeightPx === 0) return; // Avoid division by zero if not rendered

    // Fallback to element dimensions if width/height are not set
    const viewBoxWidth = this.config.width || componentWidthPx;
    const viewBoxHeight = this.config.height || componentHeightPx;

    svg.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
    this.style.setProperty('--viewbox-width', String(viewBoxWidth));
    this.style.setProperty('--viewbox-height', String(viewBoxHeight));

    spineShadow.style.display = this.config.showShadow ? "block" : "none";

    // --- Responsive Calculations ---
    // Calculate how much the viewBox is scaled in each dimension.
    const scaleX = componentWidthPx / viewBoxWidth;
    const scaleY = componentHeightPx / viewBoxHeight;

    // 'meet' preserves aspect ratio by using the smaller scale factor. This is what the browser does.
    const uniformScaleFactor = Math.min(scaleX, scaleY);

    // Use the font size of the element itself as the base size.
    const targetFontSizePx = parseFloat(window.getComputedStyle(this).fontSize) || 16;
    // Calculate the font size in viewBox units needed to achieve the target pixel size.
    const dynamicFontSizeVb = targetFontSizePx / uniformScaleFactor;

    // Also calculate a dynamic line height to prevent text overlap on scaling.
    const dynamicLineHeightVb = dynamicFontSizeVb * 1.4;

    const midX = viewBoxWidth / 2;
    const topY = 50;
    const bottomY = viewBoxHeight - 50;
    const outerL = 50;
    const outerR = viewBoxWidth - 50;

    spineShadow.setAttribute("x", String(midX - 10));
    spineShadow.setAttribute("y", String(topY));
    spineShadow.setAttribute("width", "20");
    spineShadow.setAttribute("height", String(bottomY - topY + this.config.spineDepth));

    spineLine.setAttribute("x1", String(midX));
    spineLine.setAttribute("y1", String(topY + this.config.spineDepth));
    spineLine.setAttribute("x2", String(midX));
    spineLine.setAttribute("y2", String(bottomY + this.config.spineDepth));

    const getLPath = (ol: number, ty: number, by: number) => 
      `M ${ol},${ty} C ${ol + this.config.indent},${ty} ${midX - 100},${ty - this.config.pageBulge} ${midX},${ty + this.config.spineDepth} L ${midX},${by + this.config.spineDepth} C ${midX - 100},${by - this.config.pageBulge} ${ol + this.config.indent},${by} ${ol},${by} Z`;
    
    const getRPath = (or: number, ty: number, by: number) =>
      `M ${midX},${ty + this.config.spineDepth} C ${midX + 100},${ty - this.config.pageBulge} ${or - this.config.indent},${ty} ${or},${ty} L ${or},${by} C ${or - this.config.indent},${by} ${midX + 100},${by - this.config.pageBulge} ${midX},${by + this.config.spineDepth} Z`;

    // Stapel-Effekt (Ränder der Seiten)
    pageLS2.setAttribute("d", getLPath(outerL - 6, topY + 6, bottomY + 6));
    pageLS1.setAttribute("d", getLPath(outerL - 3, topY + 3, bottomY + 3));
    pageL.setAttribute("d", getLPath(outerL, topY, bottomY));

    pageRS2.setAttribute("d", getRPath(outerR + 6, topY + 6, bottomY + 6));
    pageRS1.setAttribute("d", getRPath(outerR + 3, topY + 3, bottomY + 3));
    pageR.setAttribute("d", getRPath(outerR, topY, bottomY));

    const pageWidth = midX - outerL;
    const availableTextWidth = pageWidth - this.config.marginH * 2;

    // Recalculate character limit based on the dynamic font size.
    // A character's average width is roughly 0.5em (i.e., 0.5 * font-size).
    const avgCharWidthVb = dynamicFontSizeVb * 0.5;
    const charLimit = Math.max(5, Math.floor(availableTextWidth / avgCharWidthVb));

    // Split content by markdown horizontal rule separator (---) to define left and right page content
    const pageContents = this._markdown.split(/(?:^|\n)\s*---\s*(?:\n|$)/);
    const pages = [
      { side: "left" as const, content: pageContents[0] || "" },
      { side: "right" as const, content: pageContents[1] || "" }
    ];

    for (const { side, content } of pages) {
      if (!content.trim()) continue;
      const lines = this.splitText(content.trim(), charLimit);
      
      let currentY = topY + this.config.marginV;

      lines.forEach((line, i) => {
        const isHeader = line.startsWith('#');
        const isBlockquote = line.startsWith('>');
        const isOrderedList = !!line.match(/^\s*\d+\.\s+/);

        const headerMatch = line.match(/^(#+)\s+(.*)$/);
        const headerLevel = headerMatch ? headerMatch[1].length : 0;
        let cleanLine = headerMatch ? headerMatch[2] : line;
        if (isBlockquote) cleanLine = cleanLine.replace(/^>\s?/, '');

        // Überschriften größer darstellen
        const fontSize = isHeader ? dynamicFontSizeVb * (1.6 - headerLevel * 0.1) : dynamicFontSizeVb;
        const fontWeight = (isHeader || isOrderedList) ? "bold" : "normal";
        const fontStyle = isBlockquote ? "italic" : "normal";
        const lineHeight = fontSize * 1.3;

        if (currentY + lineHeight > bottomY - this.config.marginV) return;

        const id = `p-${side}-${i}-${currentY}`;
        const p = document.createElementNS(this.NS, "path");
        p.setAttribute("id", id);
        p.setAttribute("fill", "none");

        let startX: number, endX: number;
        const blockIndent = (isBlockquote || isOrderedList) ? 20 : 0;

        if (side === "left") {
          startX = outerL + this.config.marginH + blockIndent;
          endX = midX - this.config.marginH;
          p.setAttribute("d", `M ${startX},${currentY} C ${startX + this.config.indent * 0.5},${currentY} ${midX - 80},${currentY - this.config.pageBulge} ${endX},${currentY + this.config.spineDepth * 0.8}`);
        } else {
          startX = midX + this.config.marginH + blockIndent;
          endX = outerR - this.config.marginH;
          p.setAttribute("d", `M ${startX},${currentY + this.config.spineDepth * 0.8} C ${midX + 80},${currentY - this.config.pageBulge} ${endX - this.config.indent * 0.5},${currentY} ${endX},${currentY}`);
        }

        pathDefs.appendChild(p);
        const t = document.createElementNS(this.NS, "text");
        t.setAttribute("font-size", `${fontSize}px`);
        t.setAttribute("font-weight", fontWeight);
        t.setAttribute("font-style", fontStyle);

        const tp = document.createElementNS(this.NS, "textPath");
        tp.setAttribute("href", "#" + id);
        this.renderMarkdown(tp, cleanLine);
        t.appendChild(tp);
        textContainer.appendChild(t);

        currentY += lineHeight;
      });
    }
  }

  private renderMarkdown(container: SVGElement, text: string) {
    // Unterstützt fett (**), kursiv (*), durchgestrichen (~~) und Links
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|~~.*?~~|\[.*?\]\(.*?\))/g);
    
    parts.forEach(part => {
      if (!part) return;
      if (part.startsWith('**') && part.endsWith('**')) {
        const tspan = document.createElementNS(this.NS, "tspan");
        tspan.setAttribute("font-weight", "bold");
        tspan.textContent = part.slice(2, -2);
        container.appendChild(tspan);
      } else if (part.startsWith('*') && part.endsWith('*')) {
        const tspan = document.createElementNS(this.NS, "tspan");
        tspan.setAttribute("font-style", "italic");
        tspan.textContent = part.slice(1, -1);
        container.appendChild(tspan);
      } else if (part.startsWith('~~') && part.endsWith('~~')) {
        const tspan = document.createElementNS(this.NS, "tspan");
        tspan.setAttribute("text-decoration", "line-through");
        tspan.textContent = part.slice(2, -2);
        container.appendChild(tspan);
      } else if (part.startsWith('[') && part.includes('](')) {
        const match = part.match(/\[(.*?)\]\(.*?\)/);
        if (match) {
          const tspan = document.createElementNS(this.NS, "tspan");
          tspan.setAttribute("fill", "var(--link-color)");
          tspan.setAttribute("text-decoration", "underline");
          tspan.textContent = match[1];
          container.appendChild(tspan);
        }
      } else if (part.length > 0) {
        container.appendChild(document.createTextNode(part));
      }
    });
  }

  private splitText(text: string, len: number): string[] {
    // Zerlegen in Zeilen, um Markdown-Blockelemente (Header) zu erhalten
    const sections = text.split(/\n/);
    const lines: string[] = [];

    sections.forEach((section) => {
      const trimmed = section.trim();
      if (trimmed === "") {
        lines.push("");
        return;
      }

      // Block-Elemente (Header, Quotes, Listen-Anfang) separat behandeln
      if (trimmed.startsWith('#') || trimmed.startsWith('>') || trimmed.match(/^\d+\.\s+/)) {
        lines.push(trimmed);
        return; // Beendet die Bearbeitung dieses Abschnitts, um Dopplungen zu verhindern
      }

      const words = trimmed.split(/\s+/);
      let curr = "";
      words.forEach((w) => {
        // Sichtbare Länge berechnen (ohne Markdown-Steuerzeichen wie **, *, ~~, [])
        const clean = (s: string) => s.replace(/\*\*|\*|~~/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1");
        const visibleW = clean(w);
        const visibleCurr = clean(curr);

        if ((visibleCurr + visibleW).length > len) {
          lines.push(curr.trim());
          curr = w + " ";
        } else curr += w + " ";
      });
      lines.push(curr.trim());
      lines.push(""); // Add an empty line for paragraph spacing
    });
    return lines;
  }
}
