// Warning: The spoiler zone! If you want to keep the surprise/puzzle unspoilt and solve it yourself, do not scroll through this file!
// It straight up describes the writing system, sorry <3

import constants from '/src/constants.ts';
const {hl, hs, glyphOffset, glyphScale, cy} = constants;

export class Paragraph {
    words: Word[] = [];
    description: string = "";

    constructor(words?: Word[], description?: string) {
        this.words.push(...(words ?? []));
        this.description = description ?? this.description;
        this.words.forEach((w) => {
            if (w.usedIn.includes(this)) return;
            w.usedIn.push(this);
        });
    }

    pushWord(word: Word) {
        this.words.push(word);
        if (word.usedIn.indexOf(this) != -1) return;
        word.usedIn.push(this);
    }

    popWord() {
        const word = this.words.pop();
        const idx = word?.usedIn.indexOf(this);
        if (!word || idx == undefined || idx == -1) return;
        word.usedIn.splice(idx, 1);
    }
}

export class Word {
    glyphs: Glyph[] = [];

    plaintext = "";
    isOnlyPlaintext = false;
    isIcon = false;

    cachedBlob?: string;
    usedIn: Paragraph[] = [];

    constructor(glyphString?: string, text?: string) {
        if (glyphString && glyphString.trim() != "")
            this.glyphs.push(...glyphString.split(" ").map((s) => new Glyph(parseInt(s, 16))));

        this.plaintext = text ?? this.plaintext;
    }

    async toBlob(targetCanvas: HTMLCanvasElement, scale = 3, splitComponents = false): Promise<string> {
        const context = targetCanvas.getContext("2d");
        if (!context) throw "No 2D context";

        targetCanvas.width = (2 * glyphOffset + this.glyphs.length * hs) * scale;
        targetCanvas.height = (2 * glyphOffset + hl) * scale;
        // context.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        this.render(context, glyphOffset, glyphOffset, scale, "#000000", undefined, splitComponents);

        const toBlobPromise = new Promise<string>((resolve, reject) => {
            targetCanvas.toBlob((blob) => {
                if (!blob) return reject("No blob object?");
                const url = URL.createObjectURL(blob);
                this.cachedBlob = url;
                resolve(url);
            });
        });

        return toBlobPromise;
    }

    render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        scaling: number = 1,
        color = "#000000",
        debugRect = false,
        splitComponents = false,
        inColor?: string,
        outColor?: string
    ) {
        let n = 0;
        for (const glyph of this.glyphs) {
            glyph.render(
                ctx,
                x + n * hs * scaling,
                y,
                false,
                scaling,
                color,
                splitComponents,
                inColor,
                outColor
            );
            n++;
        }
    }

    toGlyphString() {
        return this.glyphs.map((g) => g.toString()).join(" ");
    }

    toPhonetic() {
        return this.glyphs
            .map(g => g.toPhonetic())
            .join('');
    }

    toString() {
        if (this.plaintext.trim() != "") return this.plaintext;
        if (this.glyphs.length == 0) return "[ NOTHING ]";

        return this.glyphs.map((g) => g.toString()).join(" ");
    }
}

/*
THE GLYPH:

  /|\
 1 6 2
|3 | 4|
5 \+/ 7
|  8  | Top (LSB)
-------
5 /+\ 7 Bottom (MSB)
|1 6 2|
 3 | 4
  \+/
   8     <- A loop here

Encoded as a number or hex string, 16 bit, 1 is LSB
*/

type GlyphContext = {
    canvas: CanvasRenderingContext2D;
    x: number;
    y: number;
    scaling: number;
};

const lines = [
    { n: 0,  x: hs / 2, y: 0     , dx: -(hs / 2), dy:   hl / 4 , in: false }, // TL
    { n: 1,  x: hs / 2, y: 0     , dx:   hs / 2 , dy:   hl / 4 , in: false }, // TR
    { n: 2,  x: hs / 2, y: hl / 2, dx: -(hs / 2), dy: -(hl / 4), in: true },  // TLi
    { n: 3,  x: hs / 2, y: hl / 2, dx:   hs / 2 , dy: -(hl / 4), in: true },  // TRi
    { n: 4,  x: 0     , y: hl / 4, dx:   0      , dy:   hl / 2 , in: false }, // LT
    { n: 5,  x: hs / 2, y: 0     , dx:   0      , dy:   hl / 2 , in: true },  // TMi
    { n: 6,  x: hs    , y: hl / 4, dx:   0      , dy:   hl / 2 , in: false }, // RT
    // { n: 7,  x: 0,      y: 0,      dx:   0,       dy:   0,       in: true },  // MCi
    
    { n: 8,  x: hs / 2, y: hl / 2, dx: -(hs / 2), dy:   hl / 4,  in: true },  // BLi
    { n: 9,  x: hs / 2, y: hl / 2, dx:   hs / 2 , dy:   hl / 4,  in: true },  // BRi
    { n: 10, x: hs / 2, y: hl,     dx: -(hs / 2), dy: -(hl / 4), in: false }, // BL
    { n: 11, x: hs / 2, y: hl,     dx:   hs / 2 , dy: -(hl / 4), in: false }, // BR
    // { n: 12, x: 0,      y: hl,     dx:   0,       dy:   0,       in: false }, // LB
    { n: 13, x: hs / 2, y: hl,     dx:   0,       dy: -(hl / 2), in: true },  // BMi
    // { n: 14, x: hs,     y: hl,     dx:   0,       dy:   0,       in: false }, // RB
];

const phonemes = {
    out: [
        { mask: 0b0000_0000_0000_0011, text: "ʌ" },
        { mask: 0b0001_0000_0001_0001, text: "ɔ" },
        { mask: 0b0001_0100_0001_0000, text: "ʊ" },
        { mask: 0b0001_0100_0001_0011, text: "u" },

        { mask: 0b0001_0000_0001_0011, text: "æ" },
        { mask: 0b0000_1100_0000_0000, text: "ɪ" },
        { mask: 0b0001_1100_0001_0000, text: "ɛ" },
        { mask: 0b0001_1100_0001_0001, text: "i" },

        { mask: 0b0000_1100_0000_0011, text: "ɑɹ" },
        { mask: 0b0001_1000_0001_0011, text: "ɔɹ" },
        { mask: 0b0001_1100_0001_0010, text: "əɹ" },
        { mask: 0b0001_1000_0001_0000, text: "ɛɹ" },
        { mask: 0b0001_1000_0001_0001, text: "ɪɹ" },

        { mask: 0b0000_0000_0000_0010, text: "aɪ" },
        { mask: 0b0000_0100_0000_0000, text: "ɔɪ" },
        { mask: 0b0000_0000_0000_0001, text: "eɪ" },

        { mask: 0b0000_1000_0000_0000, text: "aʊ" },
        { mask: 0b0001_1100_0001_0011, text: "oʊ" },
    ],
    in: [
        { mask: 0b0000_0011_0000_0100, text: "n" },
        { mask: 0b0000_0011_0000_0000, text: "m" },

        { mask: 0b0010_0011_1010_1100, text: "ŋ" },

        { mask: 0b0010_0010_1010_0000, text: "h" },
        { mask: 0b0010_0000_1010_1000, text: "ɹ" },
        { mask: 0b0010_0000_1010_0100, text: "j" },
        { mask: 0b0000_0000_0000_1100, text: "w" },

        { mask: 0b0010_0000_1010_0000, text: "l" },

        { mask: 0b0010_0000_1000_1100, text: "t" },
        { mask: 0b0000_0011_1010_0000, text: "d" },

        { mask: 0b0010_0000_1000_1000, text: "p" },
        { mask: 0b0000_0010_1010_0000, text: "b" },

        { mask: 0b0000_0010_1010_1000, text: "k" },
        { mask: 0b0010_0010_1000_1000, text: "g" },

        { mask: 0b0010_0001_1000_1000, text: "f" },
        { mask: 0b0000_0010_1010_0100, text: "v" },

        { mask: 0b0010_0001_1010_1000, text: "s" },
        { mask: 0b0010_0010_1010_0100, text: "z" },

        { mask: 0b0010_0011_1000_1100, text: "ʃ" },
        { mask: 0b0000_0011_1010_1100, text: "ʒ" },

        { mask: 0b0010_0011_1010_0000, text: "θ" },
        { mask: 0b0010_0000_1010_1100, text: "ð" },

        { mask: 0b0010_0000_1000_0100, text: "t͡ʃ" },
        { mask: 0b0000_0001_1010_0000, text: "d͡ʒ" },
    ],
};

export enum Masks {
    Upper = 0x00ff,
    Lower = 0xff00,
    Inner = 0b0010_0011_1010_1100,
    Outer = 0b0101_1100_0101_0011,
}

export class Glyph {
    encoded: number;

    constructor(encoded: number) {
        this.encoded = encoded;
    }

    render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        standalone: boolean = true,
        scaling: number = 1,
        color = "#000000",
        splitComponents = false,
        inColor = "#080",
        outColor = "#f00"
    ) {
        const context: GlyphContext = {
            canvas: ctx,
            x,
            y,
            scaling,
        };
        for (const line of lines) {
            this.line(
                context,
                line.x,
                line.y,
                line.dx,
                line.dy,
                [0, 1, 4, 6, 10, 11].includes(line.n),
                "#0000000F"
            );
        }
        for (const line of lines.filter((l) => l.in)) {
            this.line(
                context,
                line.x,
                line.y,
                line.dx,
                line.dy,
                this.encoded & (2 ** line.n),
                splitComponents ? inColor : color
            );
        }
        for (const line of lines.filter((l) => !l.in)) {
            this.line(
                context,
                line.x,
                line.y,
                line.dx,
                line.dy,
                this.encoded & (2 ** line.n),
                splitComponents ? outColor : color
            );
        }
        this.circle(context, hs / 2, cy, 1, this.encoded & (2 ** 15));
    }

    line(
        ctx: GlyphContext,
        x: number,
        y: number,
        dx: number,
        dy: number,
        condition: boolean | number,
        color = "#000000",
        cap: CanvasLineCap = "round"
    ) {
        if (!condition) return;
        const lx = ctx.x + x * ctx.scaling;
        const ly = ctx.y + y * ctx.scaling;

        ctx.canvas.beginPath();
        ctx.canvas.moveTo(lx, ly);
        ctx.canvas.lineTo(lx + dx * ctx.scaling, ly + dy * ctx.scaling);
        ctx.canvas.lineWidth = 1 * ctx.scaling;
        ctx.canvas.lineCap = cap;
        ctx.canvas.strokeStyle = color;
        ctx.canvas.stroke();
    }

    circle(
        ctx: GlyphContext,
        x: number,
        y: number,
        r: number,
        condition: boolean | number,
        color = "#000000"
    ) {
        if (!condition) return;
        const lx = ctx.x + x * ctx.scaling;
        const ly = ctx.y + y * ctx.scaling;

        ctx.canvas.beginPath();
        ctx.canvas.arc(lx, ly, r * ctx.scaling, 0, Math.PI * 2, true);
        ctx.canvas.lineWidth = ctx.scaling;
        ctx.canvas.strokeStyle = color;
        ctx.canvas.stroke();
    }

    toPhonetic() {
        const reverse = this.encoded & 0x8000;
        const inCode = this.encoded & Masks.Inner;
        const outCode = this.encoded & Masks.Outer;
        const inner = phonemes.in.find((ph) => ph.mask == inCode)?.text ?? this.toString();
        const outer = phonemes.out.find((ph) => ph.mask == outCode)?.text ?? this.toString();

        return inCode == 0
            ? outer
            : outCode == 0
            ? inner
            : reverse
            ? outer + inner
            : inner + outer;
    }

    toString() {
        return this.encoded.toString(16).toUpperCase().padStart(4, "0");
    }
}
