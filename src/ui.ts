import "./ui.css";
import { ColorData } from "./types";

function insertSpacesBeforeCapitals(s: string): string {
  return s.replace(/([a-z])([A-Z]+)/g, "$1 $2");
}

function markupColorSample({
  name,
  hex,
  distance,
  luminance,
  labelHex,
}): string {
  const sampleClass: string = name.includes("Selected")
    ? "color-sample-selected text-bold"
    : "color-sample-closest";
  const nameWithSpaces = insertSpacesBeforeCapitals(name);
  return `
<div class="color-sample ${sampleClass}" style="background-color:${hex};color:${labelHex};">
  <span class="color-sample-name">${nameWithSpaces}</span><span class="color-sample-hex">${hex.toUpperCase()}</span>
</div>`;
}

function markupListItem(colorsData: ColorData[]): string {
  return `<li class="color-item">${markupColorSamples(colorsData)}</li>`;
}

const markup = (markupItem: (arg: ColorData[] | ColorData) => string) => (
  list: ColorData[]
) => list.reduce((markup, item) => markup + markupItem(item), "");
const markupListItems = markup(markupListItem);
const markupColorSamples = markup(markupColorSample);

onmessage = (event) => {
  const messageType = event.data.pluginMessage.type;

  if (messageType === "render") {
    const colorsData = event.data.pluginMessage.colorsData;
    document.querySelector(".container").innerHTML =
      colorsData.length > 0
        ? `<ul class="colors-list">${markupListItems(colorsData)}</ul>`
        : `<div class="no-selection">Select something<br>with solid fill</div>`;
  }
};
