import * as chroma from "chroma-js";
import { AnyNamed, NamedColor, ColorData, ColorDataShort } from "./types";
import { colorsHTML } from "./html";
import { colorsNTC } from "./ntc";

const namedColors: NamedColor[] = [].concat(colorsHTML, colorsNTC);

function normalizeName(name: string): string {
  return name.replace(/\s/g, "").toLowerCase();
}

function calcLabelHex(hex: string): string {
  const colorTransformFactor: number = 3;
  const hexLight: string = chroma(hex)
    .brighten(colorTransformFactor)
    .saturate()
    .hex();
  const hexDark: string = chroma(hex)
    .darken(colorTransformFactor)
    .saturate()
    .hex();
  const chooseLighterOptionFactor: number = 1;
  return chroma.contrast(hex, hexLight) + chooseLighterOptionFactor >
    chroma.contrast(hex, hexDark)
    ? hexLight
    : hexDark;
}

function hasName(list: AnyNamed[], name: string): boolean {
  return !!list.find(
    (current) => normalizeName(current.name) === normalizeName(name)
  );
}

function getClosestUniqueNamedColors(hexOfSelected: string): ColorDataShort[] {
  return (
    namedColors
      // Sort all named colors by distance and get first 15 closest
      .map((color: NamedColor) => ({
        name: color.name,
        hex: color.hex,
        distance: chroma.distance(hexOfSelected, color.hex),
      }))
      .sort((a: ColorDataShort, b: ColorDataShort) => a.distance - b.distance)
      .slice(0, 15)
      // Remove identical names from different lists,
      // e.g. Magenta in html colors and same in ntc
      .reduce((colors: ColorDataShort[], color: ColorDataShort) => {
        if (!hasName(colors, color.name)) colors.push(color);
        return colors;
      }, [])
      // Combine different names for same color, e.g. Violet aka Lavender
      .reduce((colors: ColorDataShort[], color: ColorDataShort) => {
        const colorWithSameDistance = colors.find(
          (current) => current.distance === color.distance
        );
        if (colorWithSameDistance) {
          colorWithSameDistance.name += ` aka ${color.name}`;
        } else {
          colors.push(color);
        }
        return colors;
      }, [])
  );
}

function getClosestNamedColors({ r, g, b }): any | null {
  const hexOfSelected = chroma.gl(r, g, b).hex();
  const closestUniqueNamedColors: ColorDataShort[] = getClosestUniqueNamedColors(
    hexOfSelected
  );
  const directHit = closestUniqueNamedColors.find(
    (color) => color.distance === 0
  );
  if (directHit) {
    directHit.name += " (Selected)";
  } else {
    closestUniqueNamedColors.unshift({
      name: "(Selected)",
      hex: hexOfSelected,
      distance: 0,
    });
  }
  const colorsData: ColorData[] = closestUniqueNamedColors
    .slice(0, 5)
    .map((color) => ({
      name: color.name,
      hex: color.hex,
      distance: color.distance,
      luminance: chroma(color.hex).luminance(),
      labelHex: calcLabelHex(color.hex),
    }))
    .sort((a, b) => b.luminance - a.luminance);

  return colorsData;
}

function getSolidColor(node: SceneNode): RGB | null {
  if (
    "fills" in node &&
    node.fills !== figma.mixed &&
    node.fills.length !== 0
  ) {
    const fillSolid = node.fills.find((fill) => fill.type === "SOLID");
    if (fillSolid && "color" in fillSolid) return fillSolid.color;
  }
  return null;
}

function isEquivalent(a: object, b: object): boolean {
  const aProps: string[] = Object.getOwnPropertyNames(a);
  const bProps: string[] = Object.getOwnPropertyNames(b);
  if (aProps.length != bProps.length) return false;
  for (const propName of aProps) {
    if (a[propName] !== b[propName]) return false;
  }
  return true;
}

function hasColor(colors, color): boolean {
  return colors.find((current) => isEquivalent(current, color));
}

function handleSelection(): void {
  const colorsData: ColorData[] = figma.currentPage.selection
    .reduce((solidColors, node) => {
      const solidColor: RGB = getSolidColor(node);
      if (solidColor && !hasColor(solidColors, solidColor))
        solidColors.push(solidColor);
      return solidColors;
    }, [])
    .map((color) => getClosestNamedColors(color));

  figma.ui.postMessage({
    type: "render",
    colorsData,
  });
}

figma.showUI(__html__, { width: 240, height: 196 });

handleSelection();

figma.on("selectionchange", handleSelection);
