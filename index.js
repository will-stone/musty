#!/usr/bin/env node
import { readPackageUp } from "read-pkg-up";
import Table from "cli-table";
import pc from "picocolors";
import { execa } from "execa";

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
  const elapsed = new Date(date.trim()).getTime() - now.getTime();

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
    return [packageName, relativeTimeFromDate(timeModified)];
  } catch {
    return [packageName, pc.red("Failed")];
  }
};

const devDependencies = await Promise.all(
  Object.keys(packageJson.devDependencies || {}).map(getTimeModified)
);

const dependencies = await Promise.all(
  Object.keys(packageJson.dependencies || {}).map((packageName) =>
    getTimeModified(packageName)
  )
);

table.push(...dependencies);

console.log(table.toString());

console.timeEnd("Done");
