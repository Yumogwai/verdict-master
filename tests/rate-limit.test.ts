// Sliding-window rate limiter for the generation routes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { rateLimit, clientId } from "../lib/rate-limit";

const LIMIT = 20; // mirrors MAX_REQUESTS in lib/rate-limit.ts

test("allows a full window of requests, then blocks with a retry hint", () => {
  const id = "test-block-" + Math.random();
  for (let i = 0; i < LIMIT; i++) {
    assert.equal(rateLimit(id).ok, true, "request " + (i + 1) + " should pass");
  }
  const blocked = rateLimit(id);
  assert.equal(blocked.ok, false);
  if (!blocked.ok) {
    assert.ok(blocked.retryAfterSec >= 1);
    assert.ok(blocked.retryAfterSec <= 60);
  }
});

test("buckets are per-client: one hot client cannot starve another", () => {
  const hot = "test-hot-" + Math.random();
  const calm = "test-calm-" + Math.random();
  for (let i = 0; i < LIMIT + 5; i++) rateLimit(hot);
  assert.equal(rateLimit(hot).ok, false);
  assert.equal(rateLimit(calm).ok, true);
});

test("the window resets after it elapses", () => {
  const id = "test-reset-" + Math.random();
  const realNow = Date.now;
  try {
    let t = realNow();
    Date.now = () => t;
    for (let i = 0; i < LIMIT + 1; i++) rateLimit(id);
    assert.equal(rateLimit(id).ok, false);
    t += 61_000; // jump past the 60s window
    assert.equal(rateLimit(id).ok, true);
  } finally {
    Date.now = realNow;
  }
});

function reqWith(headers: Record<string, string>) {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  };
}

test("clientId prefers the first forwarded hop, then x-real-ip, then a local tag", () => {
  assert.equal(
    clientId(reqWith({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })),
    "203.0.113.7"
  );
  assert.equal(clientId(reqWith({ "x-real-ip": "198.51.100.2" })), "198.51.100.2");
  assert.equal(clientId(reqWith({})), "local");
});
