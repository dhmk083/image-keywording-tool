import { promisify } from "util";
import { exec } from "child_process";
import * as t from "./types";

const execAsync = promisify(exec);

export async function read({
  path,
  shape,
  exiftool = "exiftool",
}: Readonly<{
  path: string;
  shape: t.Shape;
  exiftool?: string;
}>) {
  const { stdout } = await execAsync(
    `"${exiftool}" "${path}" -j ${shape.map((x) => x.request).join(" ")}`
  );
  const data = JSON.parse(stdout)[0];

  const adjustValue = (v, m) => (m ? (Array.isArray(v) ? v : [v]) : v);

  return shape.map((s) => ({
    ...s,
    value: adjustValue(data[s.response] ?? (s.multi ? [] : ""), s.multi),
  })) as t.ShapeWithValue;
}

export async function write({
  path,
  shape,
  values,
  exiftool = "exiftool",
}: Readonly<{
  path: string;
  shape: t.Shape;
  values: t.FileMetadata;
  exiftool?: string;
}>) {
  const req = shape
    .map((s) =>
      s.multi
        ? [""] // empty string for clearing value
            .concat(values[s.id])
            .map((v) => `${s.request}="${v}"`)
            .join(" ")
        : `${s.request}="${values[s.id]}"`
    )
    .join(" ");

  await execAsync(
    `"${exiftool}" "${path}" -overwrite_original_in_place ${req}`
  );
}
