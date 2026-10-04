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
  assert.equal(blogs[0].id, "is-the-latent-reasoning-entangled");
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
    22,
  );
});

test("every linked blog has sourced card copy and a body-based reading estimate", async () => {
  const blogs = await load("blogs");
  const linked = blogs.filter((blog) => blog.url);

  assert.equal(linked.length, 22);
  assert.ok(linked.every((blog) => blog.description?.trim()));
  assert.ok(linked.every((blog) => blog.descriptionSource === blog.url));
  assert.ok(linked.every((blog) => blog.wordCount > 0));
  assert.ok(
    linked.every(
      (blog) => blog.readingMinutes === Math.ceil(blog.wordCount / 200),
    ),
  );
  assert.ok(
    linked.every(
      (blog) =>
        blog.readingTimeSource ===
        "Estimated at 200 words/minute from the public article body",
    ),
  );
});

test("reading time uses verified minutes or word-count estimates", () => {
  assert.equal(readingMinutes({ readingMinutes: 8, wordCount: 5000 }), 8);
  assert.equal(readingMinutes({ readingMinutes: null, wordCount: 401 }), 3);
  assert.equal(readingMinutes({ readingMinutes: null, wordCount: null }), null);
});

test("upcoming event remains an explicit placeholder", async () => {
  const announcements = await load("announcements");

  assert.equal(announcements.upcomingEvent.status, "placeholder");
});

test("team data separates core, coordinators, and project rosters", async () => {
  const team = await load("team");
  const count = (group) =>
    team.members.filter((member) => member.group === group).length;

  assert.equal(team.source, "https://aiclubcfi.com/team");
  assert.equal(count("club"), 5);
  assert.equal(count("hackathon-core"), 6);
  assert.equal(count("hackathon-coordinators"), 4);
  assert.equal(count("viveka-2"), 11);
  assert.equal(count("triton-cu"), 11);
  assert.equal(count("kathai"), 9);
  assert.deepEqual(
    team.members
      .filter((member) => member.group === "club-coordinators")
      .map((member) => member.name),
    ["Madhura Gurav", "Krish Shah"],
  );
  assert.ok(
    team.members.every((member) =>
      team.groups.some((group) => group.id === member.group),
    ),
  );
});

test("homepage marquee includes every verified project partner once", async () => {
  const partners = await load("partners");
  const marquee = [
    ...partners.home,
    ...partners.projects,
    ...partners.projects2526,
  ].filter(
    (partner, index, all) =>
      all.findIndex((entry) => entry.name === partner.name) === index,
  );

  assert.deepEqual(
    marquee.map((partner) => partner.name),
    [
      "Jane Street",
      "GeeksforGeeks",
      "Appian",
      "Databricks",
      "Qdrant",
      "Mindsight Analytics",
      "KLA and CΦ",
      "Shaastra",
      "LC-Lab",
      "gradCapital",
      "Exception Raised",
      "CFI",
      "Archive of IIT Madras",
    ],
  );
  assert.deepEqual(
    partners.projects.map((partner) => partner.name),
    [
      "KLA and CΦ",
      "Shaastra",
      "LC-Lab",
      "gradCapital",
      "Exception Raised",
      "CFI",
    ],
  );
  assert.deepEqual(
    partners.projects2526.map((partner) => partner.name),
    ["Exception Raised", "CFI", "Archive of IIT Madras"],
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
