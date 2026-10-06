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

  assert.equal(events[0].id, "epoch-3");
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

test("event source records are stored newest to oldest", async () => {
  const events = (await load("events")).filter((event) => event.date);

  assert.ok(
    events.every(
      (event, index) => index === 0 || events[index - 1].date >= event.date,
    ),
  );
});

test("2026–27 events include the complete poster-backed archive", async () => {
  const events = await load("events");
  const current = newestPublished(events).filter(
    (event) => event.academicYear === "26-27",
  );
  const currentKts = events.find(
    (event) => event.id === "knowledge-transfer-sessions-26-27",
  );
  const previousKts = events.find(
    (event) => event.id === "knowledge-transfer-sessions",
  );

  assert.deepEqual(
    current.map((event) => event.id),
    [
      "epoch-3",
      "introduction-to-neural-networks",
      "prof-talk-kaushik-mitra",
      "informals-search-quest",
      "informals-gradient-flows",
      "freshie-roadmap-nlp",
      "software-summer-school-ai",
      "knowledge-transfer-sessions-26-27",
    ],
  );
  assert.equal(currentKts?.date, "2026-06-23");
  assert.equal(currentKts?.displayDate, "23 June–15 July, 2026");
  assert.equal(currentKts?.description, previousKts?.description);
  assert.deepEqual(
    currentKts?.resourceLinks?.map((resource) => resource.label),
    ["Slides & Notebooks", "Translating Tensors", "Session Recordings"],
  );
  assert.match(
    currentKts?.resourceLinks?.find(
      (resource) => resource.label === "Session Recordings",
    )?.url || "",
    /youtube\.com\/playlist\?list=PLC9TZSja48vY/,
  );
  assert.deepEqual(
    previousKts?.resourceLinks?.map((resource) => resource.label),
    ["Slides & Notebooks", "Session Recordings"],
  );
  assert.match(
    previousKts?.resourceLinks?.find(
      (resource) => resource.label === "Session Recordings",
    )?.url || "",
    /youtube\.com\/playlist\?list=PLWkFppvOIj_ToR0qUdltuIeEaBMeiqCUi/,
  );
  assert.equal(
    events.filter((event) => event.academicYear === "26-27").length,
    8,
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

test("event cards preserve available schedule labels", async () => {
  const events = await load("events");

  assert.ok(events.every((event) => event.displayDate?.trim()));
  const mathInformals = events.find(
    (event) => event.id === "ai-club-informals-math-for-ai",
  );
  assert.equal(mathInformals?.date, "2025-08-18");
  assert.equal(mathInformals?.displayTime.trim(), "7:30 PM");
  assert.equal(mathInformals?.location.trim(), "ESB 128");
});

test("the first Informals session includes all shared resources", async () => {
  const events = await load("events");
  const informals = events.find((event) => event.id === "ai-club-informals");

  assert.equal(informals?.resourceLinks?.length, 4);
  assert.ok(
    informals.resourceLinks.every(
      (resource) =>
        resource.label?.trim() && resource.url?.startsWith("https://"),
    ),
  );
});

test("Gradient Flows includes all follow-up resources", async () => {
  const events = await load("events");
  const gradientFlows = events.find(
    (event) => event.id === "informals-gradient-flows",
  );

  assert.equal(gradientFlows?.resourceLinks?.length, 7);
  assert.ok(
    gradientFlows.resourceLinks.every(
      (resource) =>
        resource.label?.trim() && resource.url?.startsWith("https://"),
    ),
  );
});

test("the neural networks session links its slides and recording", async () => {
  const events = await load("events");
  const neuralNetworks = events.find(
    (event) => event.id === "introduction-to-neural-networks",
  );

  assert.deepEqual(
    neuralNetworks?.resourceLinks?.map((resource) => resource.label),
    ["Session Slides", "Session Recording"],
  );
  assert.match(
    neuralNetworks?.description || "",
    /linear and polynomial regression/i,
  );
  assert.match(
    neuralNetworks?.description || "",
    /weights, biases, and activation functions/i,
  );
  assert.match(neuralNetworks?.description || "", /forward propagation/i);
  assert.match(
    neuralNetworks?.description || "",
    /gradient descent and backpropagation/i,
  );
});

test("the NLP roadmap links its slides and reflects their topics", async () => {
  const events = await load("events");
  const nlp = events.find((event) => event.id === "freshie-roadmap-nlp");

  assert.equal(nlp?.resourceLinks?.[0]?.label, "Session Slides");
  assert.match(nlp?.description || "", /next-token prediction/i);
  assert.match(nlp?.description || "", /embeddings and cosine similarity/i);
});

test("the professor talk reflects its deck and links both resources", async () => {
  const events = await load("events");
  const profTalk = events.find(
    (event) => event.id === "prof-talk-kaushik-mitra",
  );

  assert.deepEqual(
    profTalk?.resourceLinks?.map((resource) => resource.label),
    ["Presentation Slides", "Talk Recording"],
  );
  assert.match(profTalk?.description || "", /PRISM3D/);
  assert.match(profTalk?.description || "", /PhotonSplat/);
  assert.match(profTalk?.description || "", /GANESH/);
});

test("the Summer School card reflects its slides and links the deck", async () => {
  const events = await load("events");
  const summerSchool = events.find(
    (event) => event.id === "software-summer-school-ai",
  );

  assert.equal(summerSchool?.date, "2026-07-20");
  assert.equal(summerSchool?.displayTime, "5:00 PM");
  assert.equal(summerSchool?.resourceLinks?.[0]?.label, "Session Slides");
  assert.match(summerSchool?.description || "", /neural networks/i);
  assert.match(summerSchool?.description || "", /computer vision/i);
  assert.match(summerSchool?.description || "", /natural language processing/i);
  assert.match(summerSchool?.description || "", /backpropagation/i);
});

test("Epoch 3 links its slides and available recordings", async () => {
  const events = await load("events");
  const epoch = events.find((event) => event.id === "epoch-3");

  assert.deepEqual(
    epoch?.resourceLinks?.map((resource) => resource.label),
    [
      "Session Slides",
      "Pre-Epoch Recording",
      "Day 1 Recording",
      "Day 2 Recording",
    ],
  );
  assert.equal(
    epoch?.resourceLinks?.find(
      (resource) => resource.label === "Day 2 Recording",
    )?.url,
    "https://www.youtube.com/watch?v=QZzemwvmVsY",
  );
  assert.match(epoch?.description || "", /Pre-Epoch built the prerequisites/);
  assert.match(epoch?.description || "", /On Day 1/);
  assert.match(epoch?.description || "", /Day 2 focused on architecture/);
  assert.equal(epoch?.description?.split("\n\n").length, 3);
  assert.doesNotMatch(
    epoch?.description || "",
    /\b(?:7|9|11)(?::00)?\s*(?:AM|PM)\b/i,
  );
});

test("team data separates core, coordinators, and project rosters", async () => {
  const team = await load("team");
  const count = (group) =>
    team.members.filter((member) => member.group === group).length;

  assert.equal(team.source, "https://aiclubcfi.com/team");
  assert.equal(count("club"), 5);
  assert.equal(count("hackathon-core"), 6);
  assert.equal(count("previous-leads"), 11);
  const previousLeads = team.members.filter(
    (member) => member.group === "previous-leads",
  );
  assert.deepEqual(
    previousLeads.slice(0, 3).map((member) => member.role),
    Array(3).fill("Team Lead, 2025-26"),
  );
  assert.ok(
    previousLeads.every((member) => member.url?.startsWith("https://")),
  );
  const publishedAffiliations = previousLeads
    .slice(3)
    .map((member) => member.current)
    .filter(Boolean);
  assert.equal(publishedAffiliations.length, 8);
  assert.ok(
    publishedAffiliations.every(
      (affiliation) =>
        affiliation.startsWith("Currently at ") &&
        !/IIT|AI Club|CFI/i.test(affiliation),
    ),
  );
  assert.equal(count("hackathon-coordinators"), 4);
  assert.equal(count("viveka-2"), 11);
  assert.equal(count("triton-cu"), 11);
  assert.equal(count("kathai"), 2);
  const clubCoordinators = team.members.filter(
    (member) =>
      member.group === "club-coordinators" ||
      member.role === "Project Member & Coordinator",
  );
  assert.equal(clubCoordinators.length, 9);
  assert.deepEqual(
    clubCoordinators
      .filter((member) => member.group === "club-coordinators")
      .map((member) => member.name),
    ["Madhura Gurav", "Krish Shah"],
  );
  assert.ok(
    team.members.every((member) =>
      team.groups.some((group) => group.id === member.group),
    ),
  );
  assert.equal(
    team.members.filter((member) => member.name === "Lokesh").length,
    1,
  );
  assert.equal(
    team.members.find((member) => member.name === "Lokesh")?.role,
    "Hackathon Core",
  );
  assert.ok(!team.members.some((member) => member.name === "Sahithi"));
  assert.equal(
    team.members.find((member) => member.id === "bhavana-viveka-2")?.role,
    "Project Member",
  );
  assert.deepEqual(
    team.members
      .filter((member) => member.group === "kathai")
      .map((member) => member.name),
    ["Venkatesh", "Vibhu"],
  );
  assert.equal(
    team.members.find((member) => member.id === "mukunthan-triton-cu")?.url,
    "https://www.linkedin.com/in/mukunthan-k-u-b078b9308/",
  );
  assert.equal(
    team.members.find((member) => member.id === "pradish-triton-cu")?.url,
    "https://www.linkedin.com/in/pradish-gandhi-s-9285a2383",
  );
  assert.equal(
    team.members.find((member) => member.id === "rithvik-triton-cu")?.url,
    "https://in.linkedin.com/in/rithvik-kalyani-563b453b7",
  );
  assert.match(
    team.members.find((member) => member.id === "madhura-club-coordinator")
      ?.url || "",
    /linkedin\.com\/in\/madhura-gurav-896978378/,
  );
  assert.equal(
    team.members.find((member) => member.id === "varnita-viveka-2")?.url,
    "https://www.linkedin.com/in/varnita-avuthu-9ab806398",
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
      "CFI",
      "Exception Raised",
      "Archive of IIT Madras",
    ],
  );
  assert.deepEqual(
    partners.projects.map((partner) => partner.name),
    ["KLA and CΦ", "Shaastra", "LC-Lab", "gradCapital", "CFI"],
  );
  assert.deepEqual(
    partners.projects2526.map((partner) => partner.name),
    ["Exception Raised", "CFI", "Archive of IIT Madras"],
  );
});

test("Viveka project cards use the dedicated project websites", async () => {
  const projects = await load("projects");
  const vivekaOne = projects.find((project) => project.id === "viveka");
  const vivekaTwo = projects.find((project) => project.id === "viveka-2");

  assert.equal(vivekaOne?.title, "Viveka 1.0");
  assert.equal(vivekaOne?.url, "https://viveka.aiclubcfi.com/viveka-1.html");
  assert.equal(vivekaTwo?.url, "https://viveka.aiclubcfi.com/viveka-2.html");
});

test("projects without public detail pages omit the project-link placeholder", async () => {
  const projects = await load("projects");
  const withoutLinks = projects.filter((project) =>
    ["deep-recall", "speechseek"].includes(project.id),
  );

  assert.equal(withoutLinks.length, 2);
  assert.ok(withoutLinks.every((project) => project.showProjectLink === false));
});

test("the 2023–25 project archive preserves the Wix project inventory", async () => {
  const projects = await load("projects");
  const archive = projects.filter(
    (project) => project.academicYear === "23-25",
  );

  assert.deepEqual(
    archive.map((project) => project.title),
    [
      "AI Rahman",
      "Night Vision",
      "Suncast",
      "Text 2 Scene",
      "Spike Drive",
      "RL Games",
      "Deepfake Detection",
      "OptiWing",
      "AI Choreography",
    ],
  );
  assert.ok(archive.every((project) => project.description.trim()));
  assert.ok(archive.every((project) => project.showProjectLink === false));
  assert.deepEqual(
    archive
      .filter((project) => project.tenure === "24-25")
      .map((project) => project.title),
    ["AI Rahman", "Night Vision", "Suncast"],
  );
  assert.deepEqual(
    archive
      .filter((project) => project.tenure === "23-24")
      .map((project) => project.title),
    [
      "Text 2 Scene",
      "Spike Drive",
      "RL Games",
      "Deepfake Detection",
      "OptiWing",
      "AI Choreography",
    ],
  );
});
