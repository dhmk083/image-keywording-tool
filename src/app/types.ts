import createSettings from "./settings";
import createImage from "./image";
import createGallery from "./gallery";
import createMetadata from "./metadata";

export type Settings = ReturnType<typeof createSettings>;
export type ImageApi = ReturnType<typeof createImage>;
export type GalleryApi = ReturnType<typeof createGallery>;
export type MetadataApi = ReturnType<typeof createMetadata>;

export type MetadataValue = string | ReadonlyArray<string>;

export type FileMetadata = Readonly<Record<string, MetadataValue>>;

export type ShapeEntry = Readonly<{
  id: string;
  request: string;
  response: string;
  multi?: boolean;
}>;

export type Shape = ReadonlyArray<ShapeEntry>;

export type ShapeWithValue = ReadonlyArray<
  ShapeEntry & Readonly<{ value: MetadataValue }>
>;

export type ExiftoolService = Readonly<{
  read(path: string, shape: Shape): Promise<ShapeWithValue>;
  write(path: string, shape: Shape, values: FileMetadata): Promise<void>;
}>;

export type MetadataService = Readonly<{
  read(path: string): Promise<ShapeWithValue>;
}>;
