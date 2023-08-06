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
            <g id="lines">
                <path d="m 5.2 , 0  -5.2,  3"        id="0" class="line" />
                <path d="m 5.2 , 0   5.2,  3"        id="1" class="line" />
                <path d="m 5.2 , 6  -5.2, -3"        id="2" class="line" />
                <path d="m 5.2 , 6   5.2, -3"        id="3" class="line" />
                <path d="m 0   , 3   v     6"        id="4" class="line" />
                <path d="m 5.2 , 0   v     6"        id="5" class="line" />
                <path d="m 10.4, 3   v     6"        id="6" class="line" />
           <!-- <path d="m 0   , 0   v     0"        id="7" class="line" /> Trash. -->
                <path d="m 5.2 , 6  -5.2,  3"        id="8" class="line" />
                <path d="m 5.2 , 6   5.2,  3"        id="9" class="line" />
           <!-- <path d="m 0   , 12  v     0"        id="12" class="line" /> Trash. -->
           <!-- <path d="m 10.4, 12  v     0"        id="14" class="line" /> Trash. -->
                <circle cx="5.2" cy="10.55" r="1.25" id="15" class="line" />
                <path d="m 5.2 , 12 -5.2, -3"        id="10" class="line" />
                <path d="m 5.2 , 12  5.2, -3"        id="11" class="line" />
                <path d="m 5.2 , 6   v     6"        id="13" class="line" />
            </g>
            <g id="caps">
                <circle cx="5.2"          r="0.8" class="cap"/> <!-- TM -->
                <circle           cy="3"  r="0.8" class="cap"/> <!-- TL -->
                <circle cx="10.4" cy="3"  r="0.8" class="cap"/> <!-- TR -->
                <circle cx="5.2"  cy="6"  r="0.8" class="cap"/> <!-- CM -->
                <circle           cy="9"  r="0.8" class="cap"/> <!-- BL -->
                <circle cx="10.4" cy="9"  r="0.8" class="cap"/> <!-- BR -->
                <circle cx="5.2"  cy="12" r="0.8" class="cap"/> <!-- BM -->
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
let canvas;

function sortedLines(canvas) {
    return [...canvas.querySelectorAll('.line')].sort((a, b) => {a.id - b.id});
}

// In `value`, the `destination` bit is set to the state of `source` bit.
function mirrorBit(value, source, destination) {
    return ((value & ~(2**destination)) | ((!!(value & 2**source)) << destination));
}

// In `value`, the `destination` bit is set in accorance with
// whether either of bits `source_a` or `source_b` is set.
function mirrorBitOr(value, source_a, source_b, destination) {
    return ((value & ~(2**destination)) | ((!!(value & (2**source_a | 2**source_b))) << destination));
}

function updateState(eventOrState) {
    let state: number;
    if (eventOrState.constructor === PointerEvent) {
        // eventOrState.target.classList.toggle("hide");
        state = props.modelValue ^ (2 ** eventOrState.target.id);
    } else if (eventOrState.constructor === Number) {
        state = eventOrState
    }
    state = mirrorBit(state, 4, 12);
    state = mirrorBit(state, 6, 14);
    state = mirrorBitOr(state, 5, 13, 7);
    (state & 2**15) ?
        canvas.classList.add("masked") :
        canvas.classList.remove("masked");
    sortedLines(canvas).forEach(line => {
        line.classList.toggle("hide", !(state & (2 ** line.id)));
    });
    // props.modelValue = ref(state);
    emit("update:modelValue", state);
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
    canvas = root.value.querySelector<SVGElement>("g#canvas");
    updateState(props.modelValue);
    sortedLines(canvas).forEach(line => {
        line.addEventListener("click", updateState);
    });
});

function line(n: number) {}
</script>

<style scoped>
/* For debug highlighting purposes. */
path.stain {
    stroke: red;
}

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
