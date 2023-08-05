<template>
    <svg
        viewBox="-1 -1 13 13"
        class="mx-auto"
        ref="root"
        :height="height"
        version="1.1"
        id="svg5"
        inkscape:version="1.1.2 (0a00cf5339, 2022-02-04, custom)"
        xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:svg="http://www.w3.org/2000/svg"
    >
        <defs id="defs2" />
        <mask id="hole">
            <rect x="-0.8" y="-0.8" width="13.6" height="13.6" fill="white"></rect>
            <circle cx="5.2" cy="10.55" r="0.85"></circle>
        </mask>
        <g id="canvas">
            <!-- hs = 10.392304845413264, 5.196152422706632; hl = 12, 6, 3 -->
            <!-- <rect x="-0.4" y="-0.4" width="11.2" height="12.8" />  -->
            <g id="high">
                <path d="m 5.2 , 0  -5.2,  3" id="high_1" class="line" />
                <path d="m 5.2 , 0   5.2,  3" id="high_2" class="line" />
                <path d="m 5.2 , 6  -5.2, -3" id="high_3" class="line" />
                <path d="m 5.2 , 6   5.2, -3" id="high_4" class="line" />
                <path d="m 0   , 3   v     6" id="high_5" class="line" />
                <path d="m 5.2 , 0   v     6" id="high_6" class="line" />
                <path d="m 10.4, 3   v     6" id="high_7" class="line" />
           <!-- <path d="m 0   , 0   v     0" id="high_8" class="line" /> Trash. -->
            </g>
            <g id="low">
                <path d="m 5.2 , 6  -5.2,  3" id="low_1" class="line" />
                <path d="m 5.2 , 6   5.2,  3" id="low_2" class="line" />
           <!-- <path d="m 0   , 12  v     0" id="low_5" class="line" /> Trash. -->
           <!-- <path d="m 10.4, 12  v     0" id="low_7" class="line" /> Trash. -->
                <circle cx="5.2" cy="10.55" r="1.25" id="low_8" class="line" />
                <path d="m 5.2 , 12 -5.2, -3" id="low_3" class="line" />
                <path d="m 5.2 , 12  5.2, -3" id="low_4" class="line" />
                <path d="m 5.2 , 6   v     6" id="low_6" class="line" />
            </g>
            <g id="caps">
                <circle cx="5.2"          r="0.8" /> <!-- TM -->
                <circle           cy="3"  r="0.8" /> <!-- TL -->
                <circle cx="10.4" cy="3"  r="0.8" /> <!-- TR -->
                <circle cx="5.2"  cy="6"  r="0.8" /> <!-- CM -->
                <circle           cy="9"  r="0.8" /> <!-- BL -->
                <circle cx="10.4" cy="9"  r="0.8" /> <!-- BR -->
                <circle cx="5.2"  cy="12" r="0.8" /> <!-- BM -->
            </g>
        </g>
    </svg>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

const props = defineProps({
    modelValue: { type: Number, required: true },
    height: { type: Number },
    row: { type: Number }
});
const emit = defineEmits<{
    (e: "update:modelValue", value: number): void;
}>();

const root = ref<SVGElement>();
function updateState(state: number, skip: number | null = null) {
    for (let i = 0; i < 16; i++) {
        if ([skip, 7, 12, 14].includes(i)) continue;
        const lineId = `#${i < 8 ? "high" : "low"}_${(i % 8) + 1}`;
        const lineElem = root.value?.querySelector(lineId);
        if (!lineElem) throw "Element not found: " + lineId;
        lineElem.classList.toggle("hide", (state & (2 ** i)) == 0)
        lineElem.classList.toggle("highlight", props.row != undefined && Math.floor(i / 4) == props.row);
    }
}

watch(
    () => props.modelValue,
    (newValue) => {
        updateState(newValue);
    }
);

watch(
    () => props.row,
    (newValue) => {
        updateState(props.modelValue);
    }
);

onMounted(() => {
    updateState(props.modelValue);
    const canvas = root.value?.querySelector<SVGElement>("g#canvas");
    for (let i = 0; i < 16; i++) {
        if ([7, 12, 14].includes(i)) continue;
        const lineId = `#${i < 8 ? "high" : "low"}_${(i % 8) + 1}`;
        const lineElem = root.value?.querySelector<SVGElement>(lineId);
        if (!lineElem) throw "Element not found: " + lineId;
        lineElem.addEventListener("click", (event) => {
            lineElem.classList.toggle("hide");
            let newValue = props.modelValue ^ (2 ** i);
            if ([4, 6].includes(i)) {
                newValue = newValue ^ (2 ** (i + 8))
            } else if ([5, 13].includes(i)) {
                if (newValue & (2 ** 5 | 2 ** 13)) {
                    newValue |=   2 ** 7
                } else {
                    newValue &= ~(2 ** 7)
                }
            }
            if (i == 15) {
                if (newValue & 2 ** 15) {
                    canvas?.classList.add("masked");
                } else {
                    canvas?.classList.remove("masked");
                }
            }
            updateState(newValue, i);
            emit("update:modelValue", newValue);
        });
    }
});

function line(n: number) {}
</script>

<style scoped>
.line {
    fill: none;
    stroke: #000000;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 0.8;
    transition: stroke 200ms ease;
    cursor: pointer;
}
.line.hide {
    stroke: #00000000;
}

.masked {
    mask: url(#hole)
}

.glyph-input:hover .line.highlight,
.focused .line.highlight {
    stroke: #222288;
}

.glyph-input:hover .line.hide.highlight,
.focused .line.hide.highlight {
    stroke: #d0d0ff;
}

.glyph:hover .line.hide {
    stroke: #d0d0d0;
}

.glyph:hover .line:hover {
    stroke: #606060;
}
.glyph:hover .line.hide:hover {
    stroke: #808080;
}

#caps circle {
    fill: #00000044;
    transition: fill 200ms ease;
}
.glyph:hover #caps circle {
    fill: #000000;
}
</style>
