import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  groupByYear,
  newestPublished,
  readingMinutes,
} from "../src/lib/content.mjs";

const load = async (name) =>
  JSON.parse(
    await readFile(
      new URL(`../src/data/${name}.json`, import.meta.url),
      "utf8",
    ),
  );

test("homepage content sorts newest published records first", async () => {
  const events = newestPublished(await load("events"));
  const blogs = newestPublished(await load("blogs"));

  assert.equal(events[0].id, "epoch-2");
  assert.equal(
    blogs[0].id,
    "from-random-actions-to-balance-building-a-reinforcement-learning-agent-for-the-cartpole-problem",
  );
  assert.ok(
    events.every(
      (record, index) => index === 0 || events[index - 1].date >= record.date,
    ),
  );
  assert.ok(
    blogs.every(
      (record, index) => index === 0 || blogs[index - 1].date >= record.date,
    ),
  );
});

test("blog archives group records by descending year", async () => {
  const groups = groupByYear(await load("blogs"));
  assert.deepEqual(
    groups.map((group) => group.year),
    ["2026", "2025", "2024", "2023"],
  );
  assert.equal(
    groups.reduce((total, group) => total + group.records.length, 0),
    21,
  );
});

test("reading time uses verified minutes or word-count estimates", () => {
  assert.equal(readingMinutes({ readingMinutes: 8, wordCount: 5000 }), 8);
  assert.equal(readingMinutes({ readingMinutes: null, wordCount: 401 }), 3);
  assert.equal(readingMinutes({ readingMinutes: null, wordCount: null }), null);
});

test("unverified source content remains explicit instead of invented", async () => {
  const team = await load("team");
  const announcements = await load("announcements");
  const blogs = await load("blogs");

  assert.deepEqual(team.members, []);
  assert.equal(announcements.upcomingEvent.status, "placeholder");
  assert.ok(blogs.some((blog) => blog.todo?.length));
});

test("homepage and project partners use their verified source sets", async () => {
  const partners = await load("partners");

  assert.deepEqual(
    partners.home.map((partner) => partner.name),
    [
      "Jane Street",
      "GeeksforGeeks",
      "Appian",
      "Databricks",
      "Qdrant",
      "Mindsight Analytics",
    ],
  );
  assert.deepEqual(
    partners.projects.map((partner) => partner.name),
    ["KLA and CΦ", "Shaastra", "LC-Lab", "gradCapital", "Exception Raised"],
  );
});

test("projects without public detail pages omit the project-link placeholder", async () => {
  const projects = await load("projects");
  const withoutLinks = projects.filter((project) =>
    ["deep-recall", "speechseek"].includes(project.id),
  );

  assert.equal(withoutLinks.length, 2);
  assert.ok(withoutLinks.every((project) => project.showProjectLink === false));
});
