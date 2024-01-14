import { writable } from "svelte/store";
const LS_KEY = "app:dcim-compress-util";
const client = typeof window !== "undefined";
const initialLsValue = client && localStorage.getItem(LS_KEY);

const initialLsJson = typeof initialLsValue === "string"
    && JSON.parse(initialLsValue);

let state_actual; // shadows the value of the writable store `state`
const state = writable(initialLsJson || {
    levels: {
        low: { height: 360, q: 12 },
        mid: { height: 720, q: 10 },
        high: { height: 1080, q: 8 },
    },
    files: [
        /*
        {
            name: "PXL_....jpg",
            res: [ 1920, 1080 ],
            sizes: { orig: 930865, high: 122656, mid: 56139, low: 15778 }
            selection: null, // "orig", "low", "mid", "high"
            rotation: 0, // 90, 180, 270 (clockwise)
            discard: true,
            note: "",
        },
        */
    ],
    selectionImgIdx: 0,
    settings: {
        autoSelectNext: true,
    },
});
export default state;

function saveObject() {
    localStorage.setItem(LS_KEY, JSON.stringify(state_actual));
}

export const saveToLs = writable(!!initialLsValue);
let saveToLs_actual; // shadows the value of `saveToLs`

state.subscribe((v) => {
    state_actual = v;
    if (saveToLs_actual) saveObject();
});

let isFirstUpdate = true;
saveToLs.subscribe((v) => {
    saveToLs_actual = v;
    if (isFirstUpdate) {
        isFirstUpdate = false;
        return;
    }
    if (client && !v) localStorage.removeItem(LS_KEY); // disable and clear
    if (client && v) saveObject();
});
