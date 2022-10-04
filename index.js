#!/usr/bin/env node
import { execa } from "execa";
import { readPackageUp } from "read-pkg-up";
import Table from "cli-table";
import { red } from "yoctocolors";

console.time("Done");

const units = [
  { unit: "year", ms: 31536000000 },
  { unit: "month", ms: 2628000000 },
  { unit: "day", ms: 86400000 },
  { unit: "hour", ms: 3600000 },
  { unit: "minute", ms: 60000 },
  { unit: "second", ms: 1000 },
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function relativeTimeFromDate(date) {
  if (!date) {
    throw new Error("Date missing from package's last modified");
  }

  const now = new Date();
  const elapsed = date.getTime() - now.getTime();

  for (const { unit, ms } of units) {
    if (Math.abs(elapsed) >= ms || unit === "second") {
      return rtf.format(Math.round(elapsed / ms), unit);
    }
  }

  return "";
}

const table = new Table({
  head: ["Name", "Last Modified"],
});

const { packageJson } = await readPackageUp();

const getTimeModified = async (packageName) => {
  try {
    const { stdout: timeModified } = await execa("npm", [
      "view",
      packageName,
      "time.modified",
    ]);
    return [packageName, relativeTimeFromDate(new Date(timeModified))];
  } catch {
    return [packageName, red('Failed')];

  }
};

const devDependencies = await Promise.all(
  Object.keys(packageJson.devDependencies || {}).map((packageName) =>
    getTimeModified(packageName)
  )
);

const dependencies = await Promise.all(
  Object.keys(packageJson.dependencies || {}).map(getTimeModified)
);

table.push(...dependencies);

console.log(table.toString());

console.timeEnd("Done");
