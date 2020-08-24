export interface AnyNamed {
  name: string;
}

export type NamedColor = {
  name: string;
  hex: string;
};

export type ColorDataShort = {
  name: string;
  hex: string;
  distance: number;
};

export type ColorData = {
  name: string;
  hex: string;
  distance: number;
  luminance: number;
  labelHex: string;
};
